<script lang="ts">
	import { onMount } from 'svelte';
	import { gameMode } from '$lib/game-mode.svelte';

	// Snake game. Coin (yellow) page bg shines through; the snake + food
	// render in --black on a fully-transparent canvas. Keyboard arrows or
	// WASD to steer on desktop; swipe gestures on touch.

	const CELL = 24;
	let canvas: HTMLCanvasElement | undefined = $state();
	let cols = $state(20);
	let rows = $state(20);
	let snake = $state<Array<[number, number]>>([]);
	let dir = $state<[number, number]>([1, 0]);
	let pendingDir = $state<[number, number]>([1, 0]);
	let food = $state<[number, number]>([0, 0]);
	let score = $state(0);
	let gameOver = $state(false);

	const TICK_MS = 110;

	function reset() {
		// Spawn fully below the canvas (head at y=rows is off-screen by one
		// row; body trails further down). Direction is up, so the first few
		// ticks march the snake into view from below — head emerges in the
		// 2nd column, which lines up under the wordmark text (.left-6 is
		// 24 px; CELL is 24 px → col-1 straddles the same x as the first
		// letter). step()'s lower-boundary check is only `head[1] >= rows`
		// *after* a move, so the off-screen start state never triggers
		// game-over.
		const startX = 1;
		const startY = rows;
		snake = [
			[startX, startY],
			[startX, startY + 1],
			[startX, startY + 2],
		];
		dir = [0, -1];
		pendingDir = [0, -1];
		score = 0;
		gameOver = false;
		placeFood();
	}

	function placeFood() {
		const occupied = new Set(snake.map(([x, y]) => `${x},${y}`));
		const free: Array<[number, number]> = [];
		for (let x = 0; x < cols; x++) {
			for (let y = 0; y < rows; y++) {
				if (!occupied.has(`${x},${y}`)) free.push([x, y]);
			}
		}
		if (free.length === 0) return;
		food = free[Math.floor(Math.random() * free.length)];
	}

	function step() {
		if (gameOver) return;
		dir = pendingDir;
		const head: [number, number] = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
		if (head[0] < 0 || head[0] >= cols || head[1] < 0 || head[1] >= rows) {
			gameOver = true;
			return;
		}
		for (const [sx, sy] of snake) {
			if (sx === head[0] && sy === head[1]) {
				gameOver = true;
				return;
			}
		}
		snake = [head, ...snake];
		if (head[0] === food[0] && head[1] === food[1]) {
			score += 1;
			placeFood();
		} else {
			snake = snake.slice(0, -1);
		}
	}

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const dpr = window.devicePixelRatio || 1;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
		ctx.fillStyle = '#1a1a14';
		const pad = 2;
		for (const [x, y] of snake) {
			ctx.fillRect(x * CELL + pad, y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
		}
		const [fx, fy] = food;
		ctx.beginPath();
		ctx.arc(fx * CELL + CELL / 2, fy * CELL + CELL / 2, CELL / 2 - 4, 0, Math.PI * 2);
		ctx.fill();
	}

	function setDir(d: [number, number]) {
		if (gameOver) return;
		if (d[0] === -dir[0] && d[1] === -dir[1]) return;
		pendingDir = d;
	}

	function onKey(e: KeyboardEvent) {
		if (!gameMode.active) return;
		if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setDir([0, -1]);
		else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') setDir([0, 1]);
		else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setDir([-1, 0]);
		else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setDir([1, 0]);
		else if (e.key === 'Escape') gameMode.stop();
		else return;
		// "r" restart removed: it called the local reset() which left
		// gameMode's pending game-over/replay timers running — the "again?"
		// prompt would pop on top of a live game ~2 s later. Restart now
		// flows exclusively through gameMode.restart() via the button.
		e.preventDefault();
	}

	let touchStart: { x: number; y: number } | null = null;
	// Buttons + other interactive controls inside the game (e.g. "play again"
	// on the game-over overlay) need touchstart→click to fire. preventDefault
	// on touchstart kills that synthetic click on iOS, so we skip the swipe
	// handler entirely when the touch begins on an interactive descendant.
	function isInteractiveTarget(target: EventTarget | null): boolean {
		const el = target as HTMLElement | null;
		return !!el?.closest('button, a, [role="button"]');
	}
	function onTouchStart(e: TouchEvent) {
		if (isInteractiveTarget(e.target)) return;
		// preventDefault on touchstart cancels Arc/Safari's edge-swipe-back
		// gesture from competing with our left/right swipes.
		e.preventDefault();
		const t = e.touches[0];
		if (t) touchStart = { x: t.clientX, y: t.clientY };
	}
	function onTouchMove(e: TouchEvent) {
		if (isInteractiveTarget(e.target)) return;
		// Block the vertical-pan / overscroll spring while a touch is in
		// flight — without this the game container slid up and bounced back.
		e.preventDefault();
	}
	function onTouchEnd(e: TouchEvent) {
		if (isInteractiveTarget(e.target)) return;
		e.preventDefault();
		if (!touchStart) return;
		const t = e.changedTouches[0];
		if (!t) return;
		const dx = t.clientX - touchStart.x;
		const dy = t.clientY - touchStart.y;
		touchStart = null;
		if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
		if (Math.abs(dx) > Math.abs(dy)) setDir([dx > 0 ? 1 : -1, 0]);
		else setDir([0, dy > 0 ? 1 : -1]);
	}

	function resize() {
		if (!canvas) return;
		const w = window.innerWidth;
		const h = window.innerHeight;
		cols = Math.max(8, Math.floor(w / CELL));
		rows = Math.max(8, Math.floor(h / CELL));
		const dpr = window.devicePixelRatio || 1;
		canvas.width = cols * CELL * dpr;
		canvas.height = rows * CELL * dpr;
		canvas.style.width = `${cols * CELL}px`;
		canvas.style.height = `${rows * CELL}px`;
		// Snap snake + food into the new grid if they're out of range.
		if (snake.length === 0 || snake.some(([x, y]) => x >= cols || y >= rows)) reset();
		else if (food[0] >= cols || food[1] >= rows) placeFood();
		draw();
	}

	onMount(() => {
		resize();
		window.addEventListener('keydown', onKey);
		window.addEventListener('resize', resize);
		// Lock the document scroll while the game is mounted so iOS / Arc
		// can't elastic-scroll the page underneath when a swipe gesture
		// crosses the container.
		const prevHtmlOverflow = document.documentElement.style.overflow;
		const prevBodyOverflow = document.body.style.overflow;
		const prevOverscroll = document.body.style.overscrollBehavior;
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
		document.body.style.overscrollBehavior = 'none';

		const id = window.setInterval(() => {
			step();
			draw();
		}, TICK_MS);
		return () => {
			window.clearInterval(id);
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('resize', resize);
			document.documentElement.style.overflow = prevHtmlOverflow;
			document.body.style.overflow = prevBodyOverflow;
			document.body.style.overscrollBehavior = prevOverscroll;
		};
	});

	$effect(() => {
		// Redraw whenever reactive state changes that draw() reads
		void snake;
		void food;
		void gameOver;
		draw();
	});

	// Fire the page's game-over choreography once when the local snake
	// dies. handleGameOver() guards against re-entry, so this fires once
	// per game; nothing else needs to happen when gameOver flips back to
	// false (the whole component re-mounts on restart with a fresh state).
	$effect(() => {
		if (gameOver) gameMode.handleGameOver();
	});
</script>

<!-- touch-action: none disables the browser's default panning + pinch +
     edge-swipe handlers so our swipe direction logic is the only thing
     reading the gesture. overscroll-behavior: none belt-and-suspenders
     for the elastic-bounce that html-overflow lock already kills. -->
<div
	class="fixed inset-0 z-40 grid place-items-center bg-[var(--coin)] [overscroll-behavior:none] [touch-action:none]"
	role="application"
	aria-label="snake game"
	ontouchstart={onTouchStart}
	ontouchmove={onTouchMove}
	ontouchend={onTouchEnd}
>
	<canvas bind:this={canvas}></canvas>
	<!-- Bare score, top-left. Stays put across the whole session — game
	     play, dead-snake pause, and the replay countdown all read against
	     the same number. The bottom-left wordmark slot is where the page
	     stages "game over" → "again?" → countdown digits. -->
	<div
		class="pointer-events-none absolute left-6 top-6 font-mono text-3xl font-bold text-black md:left-8 md:top-8 md:text-4xl"
	>
		{score}
	</div>
</div>

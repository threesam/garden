<script lang="ts">
	import { onMount } from 'svelte';
	import { gameMode } from '$lib/game-mode.svelte';

	// Space Invaders — the tagline alien, multiplied into a marching horde, so
	// the thing you clicked is literally what you're shooting. Same arcade
	// semantics as snake (countdown → fade gallery → play → game over →
	// again?), wired through gameMode. Black shapes on a transparent canvas;
	// the --coin page bg shines through. The cannon AUTO-FIRES — you just move
	// (arrow keys / A-D, or drag on touch) to aim. Escape quits.

	let canvas: HTMLCanvasElement | undefined = $state();
	let score = $state(0);
	let gameOver = $state(false);

	// The tagline alien head (viewBox 0..32) reused as the invader sprite.
	const ALIEN_PATH = new Path2D(
		'M16 3c5.7 0 9.5 3.6 9.5 9 0 5.6-4 16-9.5 16S6.5 17.6 6.5 12c0-5.4 3.8-9 9.5-9z',
	);
	const COIN = '#e8a317';
	const BLACK = '#1a1a14';

	type Alien = { x: number; y: number; alive: boolean };
	type Shot = { x: number; y: number };

	const ROWS = 4;
	const COLS = 8;
	const ALIEN = 26; // sprite box (px)
	const GAP_X = 22;
	const GAP_Y = 20;
	const STEP_X = 14; // horizontal march step
	const STEP_DOWN = 22; // drop at edges
	const MARGIN = 14; // edge padding the formation turns at
	const PLAYER_W = 38;
	const PLAYER_H = 18;
	const PLAYER_SPEED = 380; // px/s
	const BULLET_SPEED = 820; // px/s up
	const BOMB_SPEED = 260; // px/s down
	const BULLET_W = 3;
	const BULLET_H = 14;
	const BOMB_W = 4;
	const BOMB_H = 12;
	const BOMB_INTERVAL_MS = 1500;
	const FIRE_INTERVAL_MS = 260; // auto-cannon cadence

	// Imperative game state (mutated in the rAF loop; not Svelte-reactive —
	// the loop redraws every frame, so reactivity would be wasted work).
	let W = 0;
	let H = 0;
	let aliens: Alien[] = [];
	let marchDir = 1; // 1 → right, -1 → left
	let baseMarchMs = 600; // step cadence at full horde; shrinks per wave + as it thins
	let marchTimer = 0;
	let bombTimer = 0;
	let fireTimer = 0;
	let player = 0; // ship left edge x
	let bullets: Shot[] = [];
	let bombs: Shot[] = [];
	let wave = 1;
	const keys = new Set<string>();

	const playerY = () => H - 54;
	const formationWidth = () => COLS * ALIEN + (COLS - 1) * GAP_X;
	const aliveAliens = () => aliens.filter((a) => a.alive);

	function newWave() {
		const startX = (W - formationWidth()) / 2;
		const startY = 70;
		aliens = [];
		for (let r = 0; r < ROWS; r++) {
			for (let c = 0; c < COLS; c++) {
				aliens.push({
					x: startX + c * (ALIEN + GAP_X),
					y: startY + r * (ALIEN + GAP_Y),
					alive: true,
				});
			}
		}
		marchDir = 1;
		baseMarchMs = Math.max(180, 700 - (wave - 1) * 90);
		marchTimer = 0;
		bombTimer = 0;
		fireTimer = 0;
		bombs = [];
		bullets = [];
	}

	function reset() {
		score = 0;
		gameOver = false;
		wave = 1;
		player = W / 2 - PLAYER_W / 2;
		newWave();
	}

	function endGame() {
		if (gameOver) return;
		gameOver = true;
		gameMode.handleGameOver();
	}

	function marchStep() {
		const alive = aliveAliens();
		if (alive.length === 0) return;
		let minX = Infinity;
		let maxX = -Infinity;
		for (const a of alive) {
			minX = Math.min(minX, a.x);
			maxX = Math.max(maxX, a.x + ALIEN);
		}
		const hitRight = marchDir === 1 && maxX + STEP_X >= W - MARGIN;
		const hitLeft = marchDir === -1 && minX - STEP_X <= MARGIN;
		if (hitRight || hitLeft) {
			marchDir *= -1;
			for (const a of alive) a.y += STEP_DOWN;
		} else {
			for (const a of alive) a.x += STEP_X * marchDir;
		}
		// Horde reached the player's row → defenses overrun.
		for (const a of alive) {
			if (a.y + ALIEN >= playerY()) {
				endGame();
				return;
			}
		}
	}

	function dropBomb() {
		const alive = aliveAliens();
		if (alive.length === 0) return;
		const a = alive[Math.floor(Math.random() * alive.length)];
		bombs.push({ x: a.x + ALIEN / 2 - BOMB_W / 2, y: a.y + ALIEN });
	}

	function update(dt: number) {
		if (gameOver) return;

		// Player (held keys).
		const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
		const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
		if (left) player -= PLAYER_SPEED * dt;
		if (right) player += PLAYER_SPEED * dt;
		player = Math.max(8, Math.min(W - PLAYER_W - 8, player));

		// Auto-cannon: fire on a fixed cadence, no input needed.
		fireTimer += dt * 1000;
		if (fireTimer >= FIRE_INTERVAL_MS) {
			fireTimer = 0;
			bullets.push({ x: player + PLAYER_W / 2 - BULLET_W / 2, y: playerY() - BULLET_H });
		}
		// Advance bullets; drop those off the top.
		for (const b of bullets) b.y -= BULLET_SPEED * dt;
		bullets = bullets.filter((b) => b.y + BULLET_H > 0);
		// Resolve bullet↔alien hits (each bullet kills at most one alien).
		const survivors: Shot[] = [];
		for (const b of bullets) {
			let hit = false;
			for (const a of aliens) {
				if (!a.alive) continue;
				if (
					b.x < a.x + ALIEN &&
					b.x + BULLET_W > a.x &&
					b.y < a.y + ALIEN &&
					b.y + BULLET_H > a.y
				) {
					a.alive = false;
					score += 10;
					hit = true;
					break;
				}
			}
			if (!hit) survivors.push(b);
		}
		bullets = survivors;

		// March on a cadence that quickens as the horde thins (and per wave).
		const alive = aliveAliens().length;
		if (alive === 0) {
			wave += 1;
			newWave();
			return;
		}
		const total = ROWS * COLS;
		const interval = Math.max(110, baseMarchMs * (0.35 + 0.65 * (alive / total)));
		marchTimer += dt * 1000;
		if (marchTimer >= interval) {
			marchTimer = 0;
			marchStep();
			if (gameOver) return;
		}

		// Enemy bombs.
		bombTimer += dt * 1000;
		if (bombTimer >= BOMB_INTERVAL_MS) {
			bombTimer = 0;
			dropBomb();
		}
		for (const b of bombs) b.y += BOMB_SPEED * dt;
		bombs = bombs.filter((b) => b.y < H);
		const py = playerY();
		for (const b of bombs) {
			if (
				b.x < player + PLAYER_W &&
				b.x + BOMB_W > player &&
				b.y + BOMB_H > py &&
				b.y < py + PLAYER_H
			) {
				endGame();
				return;
			}
		}
	}

	function drawAlien(ctx: CanvasRenderingContext2D, a: Alien) {
		ctx.save();
		ctx.translate(a.x, a.y);
		ctx.scale(ALIEN / 32, ALIEN / 32);
		ctx.fillStyle = BLACK;
		ctx.fill(ALIEN_PATH);
		ctx.fillStyle = COIN;
		for (const [ex, rot] of [
			[12, -18],
			[20, 18],
		] as const) {
			ctx.beginPath();
			ctx.ellipse(ex, 15, 2.4, 4.2, (rot * Math.PI) / 180, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
	}

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const dpr = window.devicePixelRatio || 1;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, W, H);

		for (const a of aliens) if (a.alive) drawAlien(ctx, a);

		// Player cannon: base bar + a short turret.
		const py = playerY();
		ctx.fillStyle = BLACK;
		ctx.fillRect(player, py + 6, PLAYER_W, PLAYER_H - 6);
		ctx.fillRect(player + PLAYER_W / 2 - 3, py, 6, 8);

		for (const b of bullets) ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);
		for (const b of bombs) ctx.fillRect(b.x, b.y, BOMB_W, BOMB_H);
	}

	function onKey(e: KeyboardEvent) {
		if (!gameMode.active) return;
		if (e.key === 'Escape') {
			gameMode.stop();
			return;
		}
		const k = e.key;
		// Movement only — the cannon auto-fires, so there's no fire key.
		if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'A' || k === 'd' || k === 'D') {
			keys.add(k);
			e.preventDefault();
		}
	}
	function onKeyUp(e: KeyboardEvent) {
		keys.delete(e.key);
	}

	// Touch: drag the ship to the finger (auto-fire handles shooting).
	// Interactive descendants (the "again?" button) keep their synthetic
	// click — see SnakeGame.
	function isInteractiveTarget(target: EventTarget | null): boolean {
		const el = target as HTMLElement | null;
		return !!el?.closest('button, a, [role="button"]');
	}
	function onTouchStart(e: TouchEvent) {
		if (isInteractiveTarget(e.target)) return;
		e.preventDefault();
	}
	function onTouchMove(e: TouchEvent) {
		if (isInteractiveTarget(e.target)) return;
		e.preventDefault();
		const t = e.touches[0];
		if (!t) return;
		player = Math.max(8, Math.min(W - PLAYER_W - 8, t.clientX - PLAYER_W / 2));
	}

	function resize() {
		if (!canvas) return;
		W = window.innerWidth;
		H = window.innerHeight;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = W * dpr;
		canvas.height = H * dpr;
		canvas.style.width = `${W}px`;
		canvas.style.height = `${H}px`;
		if (aliens.length === 0) reset();
		else player = Math.max(8, Math.min(W - PLAYER_W - 8, player));
		draw();
	}

	let rafId: number | undefined;
	let lastT = 0;

	function frame(t: number) {
		const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
		lastT = t;
		// Freeze on either end-edge (local death, or user quit mid-fade) so the
		// horde doesn't keep marching through the 400 ms outro — mirrors snake.
		if (!gameOver && gameMode.gameMounted) {
			update(dt);
			draw();
			rafId = requestAnimationFrame(frame);
		} else {
			draw();
			rafId = undefined;
		}
	}

	onMount(() => {
		resize();
		window.addEventListener('keydown', onKey);
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('resize', resize);
		// Lock document scroll while mounted so iOS / Arc can't elastic-scroll
		// the page underneath a gesture.
		const prevHtmlOverflow = document.documentElement.style.overflow;
		const prevBodyOverflow = document.body.style.overflow;
		const prevOverscroll = document.body.style.overscrollBehavior;
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
		document.body.style.overscrollBehavior = 'none';

		rafId = requestAnimationFrame(frame);
		return () => {
			if (rafId !== undefined) cancelAnimationFrame(rafId);
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('resize', resize);
			document.documentElement.style.overflow = prevHtmlOverflow;
			document.body.style.overflow = prevBodyOverflow;
			document.body.style.overscrollBehavior = prevOverscroll;
		};
	});
</script>

<!-- touch-action: none so our drag logic owns the gesture; overscroll none
     belt-and-suspenders for elastic bounce the overflow lock already kills. -->
<div
	class="fixed inset-0 z-40 grid place-items-center bg-[var(--coin)] [overscroll-behavior:none] [touch-action:none]"
	role="application"
	aria-label="space invaders game"
	ontouchstart={onTouchStart}
	ontouchmove={onTouchMove}
>
	<canvas bind:this={canvas}></canvas>
	<div
		class="pointer-events-none absolute left-6 top-6 font-mono text-3xl font-bold text-black md:left-8 md:top-8 md:text-4xl"
	>
		{score}
	</div>
</div>

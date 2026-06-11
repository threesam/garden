<script lang="ts">
	import { onMount } from 'svelte';
	import { gameMode } from '$lib/game-mode.svelte';

	// Space Invaders, swarm edition — the tagline alien multiplied into a
	// flocking horde (boids: separation + alignment + cohesion) that pours down
	// at you instead of marching in a grid. Same arcade semantics as snake
	// (countdown → fade gallery → play → game over → again?), wired through
	// gameMode. Black shapes on a transparent canvas; the --coin page bg shines
	// through. The cannon AUTO-FIRES — you just move (arrow keys / A-D, or drag
	// on touch) to aim the stream into the swarm. Escape quits.

	let canvas: HTMLCanvasElement | undefined = $state();
	let score = $state(0);
	let gameOver = $state(false);

	// The tagline alien head (viewBox 0..32) reused as the swarm sprite.
	const ALIEN_PATH = new Path2D(
		'M16 3c5.7 0 9.5 3.6 9.5 9 0 5.6-4 16-9.5 16S6.5 17.6 6.5 12c0-5.4 3.8-9 9.5-9z',
	);
	const COIN = '#e8a317';
	const BLACK = '#1a1a14';

	type Alien = { x: number; y: number; vx: number; vy: number; alive: boolean };
	type Shot = { x: number; y: number };

	const ALIEN_N = 56; // a real swarm
	const ALIEN = 24; // sprite box (px)
	const MARGIN = 16;
	const PLAYER_W = 38;
	const PLAYER_H = 18;
	const PLAYER_SPEED = 380; // px/s
	const BULLET_SPEED = 820; // px/s up
	const BOMB_SPEED = 280; // px/s down
	const BULLET_W = 3;
	const BULLET_H = 14;
	const BOMB_W = 4;
	const BOMB_H = 12;
	const BOMB_INTERVAL_MS = 1500;
	const FIRE_INTERVAL_MS = 200; // auto-cannon cadence (faster, for more aliens)

	// Boids tuning. Forces are accelerations (px/s²); velocity is clamped to
	// maxSpeed so the flock flies fast laterally while descending steadily.
	const NEIGHBOR_R = 64;
	const SEP_R = 30;
	const A_SEP = 240; // separation (avoid crowding) — dominant, keeps them spread
	const A_ALI = 70; // alignment (match neighbours' heading)
	const A_COH = 55; // cohesion (steer toward the local centre)
	const A_EDGE = 400; // bounce off the side/top walls
	const DOWN_ACCEL = 36; // steady downward pressure (the threat)
	const HUNT_ACCEL = 16; // mild drift toward the cannon's column
	const MAX_DESCENT = 55; // cap downward drift — fast lateral flock, steady (winnable) descent

	// Imperative game state (mutated in the rAF loop; not Svelte-reactive —
	// the loop redraws every frame, so reactivity would be wasted work).
	let W = 0;
	let H = 0;
	let aliens: Alien[] = [];
	let maxSpeed = 175; // "fly faster"; bumps a touch per wave
	let bombTimer = 0;
	let fireTimer = 0;
	let player = 0; // ship left edge x
	let bullets: Shot[] = [];
	let bombs: Shot[] = [];
	let wave = 1;
	const keys = new Set<string>();

	const playerY = () => H - 54;
	const aliveAliens = () => aliens.filter((a) => a.alive);

	function spawnSwarm() {
		const spread = Math.min(W * 0.72, 580);
		aliens = [];
		for (let i = 0; i < ALIEN_N; i++) {
			aliens.push({
				x: W / 2 + (Math.random() - 0.5) * spread,
				y: 20 + Math.random() * 110,
				vx: (Math.random() - 0.5) * 60,
				vy: 25 + Math.random() * 30,
				alive: true,
			});
		}
	}

	function newWave() {
		maxSpeed = 175 + (wave - 1) * 20;
		bombTimer = 0;
		fireTimer = 0;
		bombs = [];
		bullets = [];
		spawnSwarm();
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

	function dropBomb() {
		const alive = aliveAliens();
		if (alive.length === 0) return;
		const a = alive[Math.floor(Math.random() * alive.length)];
		bombs.push({ x: a.x + ALIEN / 2 - BOMB_W / 2, y: a.y + ALIEN });
	}

	// One boids step. O(n²) neighbour scan — n≈56, trivial at 60fps.
	function flock(dt: number): boolean {
		const alive = aliveAliens();
		const cx = player + PLAYER_W / 2;
		for (const a of alive) {
			let sepX = 0;
			let sepY = 0;
			let aliX = 0;
			let aliY = 0;
			let cohX = 0;
			let cohY = 0;
			let n = 0;
			for (const b of alive) {
				if (b === a) continue;
				const dx = a.x - b.x;
				const dy = a.y - b.y;
				const d2 = dx * dx + dy * dy;
				if (d2 > NEIGHBOR_R * NEIGHBOR_R) continue;
				const d = Math.sqrt(d2) || 0.001;
				if (d < SEP_R) {
					sepX += dx / d;
					sepY += dy / d;
				}
				aliX += b.vx;
				aliY += b.vy;
				cohX += b.x;
				cohY += b.y;
				n++;
			}
			let ax = 0;
			let ay = 0;
			if (n > 0) {
				aliX /= n;
				aliY /= n;
				cohX /= n;
				cohY /= n;
				const al = Math.hypot(aliX, aliY) || 1;
				ax += A_ALI * (aliX / al);
				ay += A_ALI * (aliY / al);
				const tcx = cohX - a.x;
				const tcy = cohY - a.y;
				const cl = Math.hypot(tcx, tcy) || 1;
				ax += A_COH * (tcx / cl);
				ay += A_COH * (tcy / cl);
			}
			const sl = Math.hypot(sepX, sepY);
			if (sl > 0) {
				ax += A_SEP * (sepX / sl);
				ay += A_SEP * (sepY / sl);
			}
			// Goal: steady descent + a mild hunt toward the cannon's column.
			ax += HUNT_ACCEL * Math.sign(cx - a.x);
			ay += DOWN_ACCEL;
			// Walls: stay on screen horizontally, off the top.
			if (a.x < MARGIN) ax += A_EDGE;
			else if (a.x > W - MARGIN) ax -= A_EDGE;
			if (a.y < MARGIN) ay += A_EDGE;
			// Integrate + clamp speed.
			a.vx += ax * dt;
			a.vy += ay * dt;
			const sp = Math.hypot(a.vx, a.vy);
			if (sp > maxSpeed) {
				a.vx = (a.vx / sp) * maxSpeed;
				a.vy = (a.vy / sp) * maxSpeed;
			}
			// Keep the flock zippy sideways but only inching down — the cap on
			// downward speed is what makes the wave clearable.
			if (a.vy > MAX_DESCENT) a.vy = MAX_DESCENT;
			a.x += a.vx * dt;
			a.y += a.vy * dt;
			// Reached the cannon's row → defenses overrun.
			if (a.y + ALIEN >= playerY()) return true;
		}
		return false;
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

		// Flock the swarm; a boid reaching the cannon's row ends the game.
		if (flock(dt)) {
			endGame();
			return;
		}

		// Cleared the swarm → next wave (faster).
		if (aliveAliens().length === 0) {
			wave += 1;
			newWave();
			return;
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
		// swarm doesn't keep flying through the 400 ms outro — mirrors snake.
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

<script lang="ts">
	import { onMount } from 'svelte';
	import { gameMode } from '$lib/game-mode.svelte';

	// Space Invaders, swarm edition — the tagline alien multiplied into a
	// flocking horde (boids: separation + alignment + cohesion) that pours down
	// at you. Same arcade semantics as snake (countdown → fade gallery → play →
	// game over → again?), wired through gameMode. Black shapes on a transparent
	// canvas; the --coin page bg shines through.
	//
	// The ship is a clean triangle and AUTO-FIRES — you just move (arrow keys /
	// A-D, or drag on touch) to aim. Intensity scales with time survived: the
	// ship powers up (more lasers, faster lasers, quicker cadence, nimbler ship)
	// while the swarm flies faster — a rising arms race. Escape quits.

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
	type Bullet = { x: number; y: number; vx: number; vy: number };
	type Bomb = { x: number; y: number };

	const ALIEN_N = 56; // a real swarm
	const ALIEN = 24; // sprite box (px)
	const MARGIN = 16;
	const PLAYER_W = 40;
	const PLAYER_H = 22;
	const BOMB_SPEED = 280; // px/s down
	const BULLET_W = 3;
	const BULLET_H = 14;
	const BOMB_W = 4;
	const BOMB_H = 12;
	const BOMB_INTERVAL_MS = 1500;

	// --- Intensity scaling (by time survived) -------------------------------
	// A rising crescendo: every LEVEL_SECS the ship powers up (more lasers,
	// faster lasers, quicker cadence, nimbler ship) AND the swarm flies faster.
	// Time-based (not clear-gated) so the ramp is always felt, however you play.
	const LEVEL_SECS = 7;
	const GUNS_MAX = 6;
	const FAN = 0.2; // half-spread (radians) of the multi-laser fan
	const level = () => 1 + Math.floor(gameTime / LEVEL_SECS);
	const guns = () => Math.min(GUNS_MAX, level()); // level 1 → 1 laser … 6+ → 6
	const fireMs = () => Math.max(60, 200 - (level() - 1) * 22); // quicker cadence
	const bulletSpeed = () => 820 + (level() - 1) * 80; // faster lasers
	const playerSpeed = () => 360 + (level() - 1) * 42; // nimbler ship
	const swarmSpeed = () => 175 + (level() - 1) * 16; // faster swarm

	// Imperative game state (mutated in the rAF loop; not Svelte-reactive —
	// the loop redraws every frame, so reactivity would be wasted work).
	let W = 0;
	let H = 0;
	let aliens: Alien[] = [];
	let gameTime = 0; // seconds survived — drives the intensity level
	let bombTimer = 0;
	let fireTimer = 0;
	let player = 0; // ship left edge x
	let bullets: Bullet[] = [];
	let bombs: Bomb[] = [];
	const keys = new Set<string>();

	// Boids tuning. Forces are accelerations (px/s²); velocity is clamped to
	// maxSpeed, and downward speed is capped so the flock flies fast laterally
	// while descending steadily (and clearably).
	const NEIGHBOR_R = 64;
	const SEP_R = 30;
	const A_SEP = 240; // separation (avoid crowding) — dominant
	const A_ALI = 70; // alignment (match neighbours' heading)
	const A_COH = 55; // cohesion (steer toward the local centre)
	const DOWN_ACCEL = 36; // steady downward pressure (the threat)
	const HUNT_ACCEL = 16; // mild drift toward the cannon's column
	const MAX_DESCENT = 55; // cap downward drift — keeps the swarm survivable

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
		bombTimer = 0;
		fireTimer = 0;
		bombs = [];
		bullets = [];
		spawnSwarm();
	}

	function reset() {
		score = 0;
		gameOver = false;
		gameTime = 0;
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

	// Auto-cannon: fire a fan of `guns()` lasers from the ship's nose.
	function fireVolley() {
		const g = guns();
		const sp = bulletSpeed();
		const x = player + PLAYER_W / 2 - BULLET_W / 2;
		const y = playerY() - 4 - BULLET_H; // from the triangle apex
		if (g === 1) {
			bullets.push({ x, y, vx: 0, vy: -sp });
			return;
		}
		for (let i = 0; i < g; i++) {
			const t = (i - (g - 1) / 2) / ((g - 1) / 2); // -1 … 1
			const ang = t * FAN;
			bullets.push({ x, y, vx: Math.sin(ang) * sp, vy: -Math.cos(ang) * sp });
		}
	}

	// One boids step. O(n²) neighbour scan — n≈56, trivial at 60fps. Returns
	// true if a head reached the ship's row (game over).
	function flock(dt: number): boolean {
		const alive = aliveAliens();
		const cx = player + PLAYER_W / 2;
		const ms = swarmSpeed();
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
			// Integrate + clamp speed.
			a.vx += ax * dt;
			a.vy += ay * dt;
			const sp = Math.hypot(a.vx, a.vy);
			if (sp > ms) {
				a.vx = (a.vx / sp) * ms;
				a.vy = (a.vy / sp) * ms;
			}
			if (a.vy > MAX_DESCENT) a.vy = MAX_DESCENT;
			a.x += a.vx * dt;
			a.y += a.vy * dt;
			// Hard walls — a head can NEVER leave the screen (you must always be
			// able to shoot it). Bounce off the sides + top instead of looping.
			if (a.x < MARGIN) {
				a.x = MARGIN;
				if (a.vx < 0) a.vx = -a.vx * 0.7;
			} else if (a.x + ALIEN > W - MARGIN) {
				a.x = W - MARGIN - ALIEN;
				if (a.vx > 0) a.vx = -a.vx * 0.7;
			}
			if (a.y < MARGIN) {
				a.y = MARGIN;
				if (a.vy < 0) a.vy = -a.vy * 0.7;
			}
			// Reached the ship's row → defenses overrun.
			if (a.y + ALIEN >= playerY()) return true;
		}
		return false;
	}

	function update(dt: number) {
		if (gameOver) return;
		gameTime += dt;

		// Player (held keys) — speed scales up with the ship's power.
		const speed = playerSpeed();
		const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
		const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
		if (left) player -= speed * dt;
		if (right) player += speed * dt;
		player = Math.max(8, Math.min(W - PLAYER_W - 8, player));

		// Auto-cannon.
		fireTimer += dt * 1000;
		if (fireTimer >= fireMs()) {
			fireTimer = 0;
			fireVolley();
		}
		for (const b of bullets) {
			b.x += b.vx * dt;
			b.y += b.vy * dt;
		}
		bullets = bullets.filter((b) => b.y + BULLET_H > 0 && b.x + BULLET_W > 0 && b.x < W);
		// Resolve laser↔alien hits (each laser kills at most one alien).
		const survivors: Bullet[] = [];
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

		// Flock the swarm; a boid reaching the ship's row ends the game.
		if (flock(dt)) {
			endGame();
			return;
		}

		// Cleared the swarm → a fresh one (intensity keeps climbing by time).
		if (aliveAliens().length === 0) {
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

		// Player: a clean upward triangle, nose where the lasers emit.
		const py = playerY();
		const cx = player + PLAYER_W / 2;
		ctx.fillStyle = BLACK;
		ctx.beginPath();
		ctx.moveTo(cx, py - 4);
		ctx.lineTo(player, py + PLAYER_H);
		ctx.lineTo(player + PLAYER_W, py + PLAYER_H);
		ctx.closePath();
		ctx.fill();

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
		// Touch must be NON-passive so preventDefault() actually suppresses the
		// page scroll/overscroll — Svelte 5 inline ontouch* attributes register
		// as passive, which silently no-ops preventDefault.
		window.addEventListener('touchstart', onTouchStart, { passive: false });
		window.addEventListener('touchmove', onTouchMove, { passive: false });
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
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchmove', onTouchMove);
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
>
	<canvas bind:this={canvas}></canvas>
	<div
		class="pointer-events-none absolute left-6 top-6 font-mono text-3xl font-bold text-black md:left-8 md:top-8 md:text-4xl"
	>
		{score}
	</div>
</div>

<script lang="ts">
  // Renders a fruiting body and grows it. three.js is dynamically imported so
  // it only ships to whoever opens this — it is ~150KB and nothing else in the
  // site uses it.
  //
  // The geometry is rebuilt every frame while growing. That is deliberately the
  // expensive path: it is what a timelapse actually requires, and the
  // rebuild timing recorded here is the baseline the eventual Rust/wasm port
  // gets measured against. Sub-project 2 does that port.
  import { onMount } from 'svelte';
  import { buildFruitingBody } from '$lib/mushroom/generator';
  import { SPECIES, pleurotusOstreatus } from '$lib/mushroom/species';
  import type { Blueprint } from '$lib/mushroom/types';

  let { seconds = 8 }: { seconds?: number } = $props();

  /**
   * Fixed so the specimen on screen is reproducible.
   *
   * Chosen, not arbitrary: a seed drives every dimension through one shared
   * stream, so an unlucky one lands each species at the same extreme of its
   * published range. Seed 7 gave every species its smallest cap AND its
   * thickest stipe — all legal, all unrepresentative. 14 sits mid-range
   * across the set.
   */
  const SEED = 14;

  let host = $state<HTMLDivElement | null>(null);
  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let current = $state(0);
  let growth = $state(0);
  let rebuildMs = $state(0);
  let failed = $state(false);

  // SPECIES is readonly Blueprint[], so indexing is Blueprint | undefined under
  // noUncheckedIndexedAccess. Falling back to a concrete species keeps the type
  // honest without an assertion.
  const species = $derived<Blueprint>(SPECIES[current] ?? pleurotusOstreatus);

  /**
   * Bounding sphere of the MATURE specimen, centred on the Y axis.
   *
   * Centred on the axis rather than on the true bounding-box centre because the
   * mesh spins about Y: an axis-centred sphere has the same silhouette at every
   * angle, so the specimen cannot rotate out of frame. Y is a real min/max —
   * taking only the maximum would miss everything hanging below the origin,
   * which is exactly where a hydnoid's spines live.
   */
  function matureFit(bp: Blueprint): { cx: number; cy: number; cz: number; radius: number } {
    const { positions } = buildFruitingBody(bp, 1, SEED);
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
      for (let a = 0; a < 3; a++) {
        const v = positions[i + a]!;
        if (v < lo[a]!) lo[a] = v;
        if (v > hi[a]!) hi[a] = v;
      }
    }
    const cx = (lo[0]! + hi[0]!) / 2;
    const cy = (lo[1]! + hi[1]!) / 2;
    const cz = (lo[2]! + hi[2]!) / 2;
    let radius = 1;
    for (let i = 0; i < positions.length; i += 3) {
      const d = Math.hypot(positions[i]! - cx, positions[i + 1]! - cy, positions[i + 2]! - cz);
      if (d > radius) radius = d;
    }
    return { cx, cy, cz, radius };
  }

  onMount(() => {
    // Object rather than a bare boolean: the async body below reads this after
    // an await, and a plain `let` narrows to its initialiser there.
    const mounted = { yes: true };
    let cleanup: (() => void) | undefined;

    void (async () => {
      let THREE: typeof import('three');
      try {
        THREE = await import('three');
      } catch {
        failed = true;
        return;
      }
      // Captured once as consts so the narrowing holds inside every closure
      // below instead of needing a repeated null check in each one.
      const el = host;
      const canvas = canvasEl;
      if (!mounted.yes || !el || !canvas) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0b0b08');

      const camera = new THREE.PerspectiveCamera(38, 1, 1, 4000);
      // Svelte owns the canvas element; three just draws into it.
      const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

      // Key from above, plus a bounce from BELOW. The bounce is not decorative:
      // gills, pores and teeth all face downward, so with only overhead lights
      // the one feature that distinguishes these species renders as a black
      // void. Warm, dim, and low — a substrate bouncing the key back up.
      scene.add(new THREE.AmbientLight('#6b6a5f', 1.0));
      const key = new THREE.DirectionalLight('#fff6e0', 2.2);
      key.position.set(1, 1.6, 0.8);
      scene.add(key);
      const bounce = new THREE.DirectionalLight('#e8a317', 1.15);
      bounce.position.set(-0.5, -1, 0.6);
      scene.add(bounce);

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.86,
        metalness: 0.0,
        side: THREE.DoubleSide, // gills and spines are single-sided blades
        flatShading: false,
      });

      let geometry = new THREE.BufferGeometry();
      const mesh = new THREE.Mesh(geometry, material);
      // The mesh is shifted inside a pivot so that spinning the pivot turns the
      // specimen about its own centre. Rotating the mesh directly would turn it
      // about the model origin — fine for a centred stipe, but a lateral one
      // sits off-axis and would swing around the scene like a fairground ride.
      const pivot = new THREE.Group();
      pivot.add(mesh);
      scene.add(pivot);
      let lastHud = 0;

      // Three-quarter view from slightly above: shows the cap's profile and
      // enough of the underside to read the hymenophore, which is the whole
      // point of modelling gills vs pores vs teeth.
      const DIR = [0.42, 0.34, 0.84];
      const DIR_LEN = Math.hypot(DIR[0]!, DIR[1]!, DIR[2]!);
      let fit = { cx: 0, cy: 0, cz: 0, radius: 1 };

      // The pivot sits at the world origin with the specimen recentred onto it,
      // so the camera always aims at 0 and only the distance changes.
      const frameCamera = (): void => {
        const vFov = (camera.fov * Math.PI) / 180;
        // A wide viewport is limited by vertical fov, a tall one by horizontal.
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
        const d = (fit.radius * 1.12) / Math.sin(Math.min(vFov, hFov) / 2);
        camera.position.set(
          (DIR[0]! / DIR_LEN) * d,
          (DIR[1]! / DIR_LEN) * d,
          (DIR[2]! / DIR_LEN) * d,
        );
        camera.lookAt(0, 0, 0);
      };

      // Rebuild is the hot path: once per frame while growing. The builder
      // already supplies normals, so we do NOT call computeVertexNormals here —
      // that would redo per-frame what the generator did once.
      const show = (bp: Blueprint, t: number): void => {
        const started = performance.now();
        const m = buildFruitingBody(bp, t, SEED);
        const took = performance.now() - started;

        geometry.dispose();
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
        geometry.setIndex(new THREE.BufferAttribute(m.indices, 1));
        mesh.geometry = geometry;

        // Throttled: writing $state every frame would re-render the HUD at 60Hz
        // to show a number the eye cannot read that fast.
        if (started - lastHud > 200) {
          lastHud = started;
          rebuildMs = took;
          growth = t;
        }
      };

      const resize = (): void => {
        const { clientWidth: w, clientHeight: h } = el;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        frameCamera(); // aspect feeds the fit, so re-frame whenever it changes
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let start = performance.now();
      let raf = 0;
      let running = true;
      let framedFor = '';

      const tick = (now: number): void => {
        if (!running) return;
        const bp = species;

        // Switching species restarts the timelapse and re-frames the camera on
        // the MATURE size, so the specimen grows into shot rather than the
        // camera chasing it. Driven off the rendered species rather than the
        // click handler, so there is one path instead of two.
        if (bp.species !== framedFor) {
          framedFor = bp.species;
          start = now;
          fit = matureFit(bp);
          // Recentre on the MATURE centroid and leave it there for the whole
          // timelapse: recentring per frame would slide the specimen around as
          // it grows, which reads as drift rather than growth.
          mesh.position.set(-fit.cx, -fit.cy, -fit.cz);
          frameCamera();
        }

        const t = reduced ? 1 : Math.min(1, (now - start) / (seconds * 1000));
        show(bp, t);
        pivot.rotation.y = reduced ? 0.6 : ((now - start) / 1000) * 0.25;
        renderer.render(scene, camera);
        // Hold the mature specimen for a beat, then grow it again.
        if (!reduced && now - start > seconds * 1000 + 2500) start = now;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      const onVisibility = (): void => {
        if (document.hidden) {
          running = false;
          cancelAnimationFrame(raf);
        } else if (!running) {
          running = true;
          raf = requestAnimationFrame(tick);
        }
      };
      document.addEventListener('visibilitychange', onVisibility);

      cleanup = () => {
        running = false;
        cancelAnimationFrame(raf);
        document.removeEventListener('visibilitychange', onVisibility);
        ro.disconnect();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      mounted.yes = false;
      cleanup?.();
    };
  });
</script>

<div class="viewer">
  <div class="stage" bind:this={host}>
    <canvas bind:this={canvasEl}></canvas>
  </div>

  {#if failed}
    <p class="note">Couldn't load the 3D renderer.</p>
  {/if}

  <div class="hud">
    <div class="picker">
      {#each SPECIES as s, i (s.species)}
        <button type="button" class:on={i === current} onclick={() => { current = i; }}>
          {s.common}
        </button>
      {/each}
    </div>
    <p class="meta">
      <em>{species.species}</em>
      <span>{species.bodyPlan} · {species.hymenophore.kind}</span>
      {#if rebuildMs > 0}
        <span class="nums">growth {Math.round(growth * 100)}% · rebuild {rebuildMs.toFixed(1)}ms</span>
      {/if}
    </p>
  </div>
</div>

<style>
  .viewer {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    height: 100%;
    color: #ece9e0;
  }
  .stage {
    flex: 1;
    min-height: 22rem;
    border-radius: 2px;
    overflow: hidden;
    background: #0b0b08;
  }
  .stage canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .hud {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.75rem;
  }
  .picker {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  .picker button {
    font: inherit;
    background: transparent;
    color: #928c7c;
    border: 1px solid rgba(236, 233, 224, 0.16);
    border-radius: 3px;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
  }
  .picker button:hover {
    color: #ece9e0;
  }
  .picker button.on {
    background: #e8a317;
    border-color: #e8a317;
    color: #1a1a14;
    font-weight: 700;
  }
  .picker button:focus-visible {
    outline: 2px solid #e8a317;
    outline-offset: 1px;
  }
  .meta {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    text-align: right;
    color: #928c7c;
  }
  .meta em {
    color: #ece9e0;
    font-style: italic;
  }
  .nums {
    font-variant-numeric: tabular-nums;
  }
  .note {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    color: #928c7c;
  }
</style>

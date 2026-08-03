<script lang="ts">
  // Renders an oyster cluster. three.js is dynamically imported so it only
  // ships to whoever opens this page — nothing else on the site uses it.
  //
  // No timelapse yet, on purpose. Growth is only worth animating once both
  // ends of it look right, so this shows a chosen stage and lets you reroll
  // the specimen, which is what makes the shape iterable.
  import { onMount } from 'svelte';
  import { buildFruitingBody } from '$lib/mushroom/generator';
  import { buildSubstrate } from '$lib/mushroom/substrate';
  import { pleurotusOstreatus } from '$lib/mushroom/species';

  const STAGES = [
    { label: 'mature', t: 1 },
    { label: 'young', t: 0.55 },
    { label: 'pins', t: 0.12 },
  ] as const;

  let host = $state<HTMLDivElement | null>(null);
  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let stage = $state(0);
  let seed = $state(14);
  let spin = $state(true);
  let rebuildMs = $state(0);
  let failed = $state(false);

  const growth = $derived(STAGES[stage]?.t ?? 1);

  onMount(() => {
    // Object rather than a bare boolean: the async body reads this after an
    // await, where a plain `let` narrows to its initialiser.
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
      // Captured as consts so the narrowing holds inside every closure below.
      const el = host;
      const canvas = canvasEl;
      if (!mounted.yes || !el || !canvas) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0d0e0b');

      const camera = new THREE.PerspectiveCamera(32, 1, 1, 6000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      // ACES with the previous light rig clipped everything to white and threw
      // away the grey-cap / tan-rim / cream-gill separation that the vertex
      // colours exist to carry. Lower exposure buys that separation back.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      // Shadows are load-bearing here, not polish. A shelved cluster is a stack
      // of similarly-coloured caps; with flat lighting they merge into one
      // dough-like mass, and the tiers only separate once each cap casts onto
      // the one beneath it.
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Ambient kept low for the same reason — it is what was washing the
      // forms flat.
      scene.add(new THREE.AmbientLight('#8a8d82', 0.3));
      const key = new THREE.DirectionalLight('#fff1db', 1.5);
      key.position.set(0.65, 1.35, 0.45);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      // DoubleSide geometry self-shadows badly without a normal bias.
      key.shadow.normalBias = 0.6;
      scene.add(key);
      // Bounce from BELOW. Not decorative: the gills face downward, and under
      // overhead-only light the feature that most identifies an oyster renders
      // as a black void.
      const bounce = new THREE.DirectionalLight('#e8cfa6', 0.7);
      bounce.position.set(-0.45, -1, 0.75);
      scene.add(bounce);
      // Cool fill from behind, to keep the shadowed sides from going muddy.
      const fill = new THREE.DirectionalLight('#a8bdc7', 0.22);
      fill.position.set(-0.9, 0.5, -0.8);
      scene.add(fill);
      // Sky/ground wrap, which is what actually lifts a shaded underside.
      scene.add(new THREE.HemisphereLight('#e2e8ec', '#8a7758', 0.55));
      // Headlight, tracked to the camera in the render loop. Gill blades are
      // vertical, so their normals point sideways and BOTH the overhead key and
      // the upward bounce graze them at almost zero incidence — the gills, the
      // one feature that identifies the species, rendered as a black void until
      // something lit them from where the viewer stands.
      const headlight = new THREE.DirectionalLight('#fff6e8', 0.35);
      scene.add(headlight);

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.96,
        metalness: 0,
        // Gills are single-sided blades, so both faces must light.
        side: THREE.DoubleSide,
      });

      let geometry = new THREE.BufferGeometry();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // The mesh is recentred inside a pivot so spinning turns the cluster
      // about its own centre rather than swinging it around the world origin.
      // The wood is its own mesh so the cluster's bounding box — which drives
      // the camera fit — is not swollen by a log that is meant to run off the
      // bottom of frame.
      let woodGeom = new THREE.BufferGeometry();
      const wood = new THREE.Mesh(woodGeom, material);
      wood.castShadow = true;
      wood.receiveShadow = true;
      const pivot = new THREE.Group();
      pivot.add(mesh);
      pivot.add(wood);
      scene.add(pivot);

      // Three-quarter view from ~25° up: high enough to read the shingled
      // tiers, low enough that the gills under the front caps stay visible.
      const DIR = [0.34, 0.19, 0.9];
      const DIR_LEN = Math.hypot(DIR[0]!, DIR[1]!, DIR[2]!);
      /** Half-extents of the cluster: horizontal (worst case while spinning) and vertical. */
      let fit = { half: 1, halfY: 1 };

      // Fits the BOX, not a bounding sphere. A cluster is a flat wide slab, and
      // a sphere around it is dominated by the diagonal — fitting that left the
      // subject at about half the size the frame could hold.
      const frameCamera = (): void => {
        const vFov = (camera.fov * Math.PI) / 180;
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
        const dv = fit.halfY / Math.tan(vFov / 2);
        const dh = fit.half / Math.tan(hFov / 2);
        const d = Math.max(dv, dh) * 1.2;
        camera.position.set(
          (DIR[0]! / DIR_LEN) * d,
          (DIR[1]! / DIR_LEN) * d,
          (DIR[2]! / DIR_LEN) * d,
        );
        camera.lookAt(0, 0, 0);
      };

      /** Rebuild geometry and refit. Normals are recomputed from the displaced
       * triangles — the builder cannot know them, since the surface is noised
       * after the fact, and shading lumps with un-displaced normals renders
       * them perfectly flat. */
      const rebuild = (): void => {
        const started = performance.now();
        const m = buildFruitingBody(pleurotusOstreatus, growth, seed);
        rebuildMs = performance.now() - started;

        geometry.dispose();
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
        geometry.setIndex(new THREE.BufferAttribute(m.indices, 1));
        geometry.computeVertexNormals();
        mesh.geometry = geometry;

        geometry.computeBoundingBox();
        const bb = geometry.boundingBox;
        if (bb) {
          mesh.position.set(
            -(bb.min.x + bb.max.x) / 2,
            -(bb.min.y + bb.max.y) / 2,
            -(bb.min.z + bb.max.z) / 2,
          );
          const sx = bb.max.x - bb.min.x;
          const sy = bb.max.y - bb.min.y;
          const sz = bb.max.z - bb.min.z;

          // Log sized from the cluster and topped just under its lowest point,
          // so the caps read as emerging from the wood rather than resting on
          // a plinth. Built after the cluster because it needs those bounds.
          const spanXZ = Math.max(sx, sz);
          const sub = buildSubstrate({
            radius: spanXZ * 0.62,
            depth: spanXZ * 1.5,
            topY: bb.min.y + sy * 0.06,
            seed,
          });
          woodGeom.dispose();
          woodGeom = new THREE.BufferGeometry();
          woodGeom.setAttribute('position', new THREE.BufferAttribute(sub.positions, 3));
          woodGeom.setAttribute('color', new THREE.BufferAttribute(sub.colors, 3));
          woodGeom.setIndex(new THREE.BufferAttribute(sub.indices, 1));
          woodGeom.computeVertexNormals();
          wood.geometry = woodGeom;
          wood.position.copy(mesh.position);
          // Worst-case horizontal extent across a full turn is the X/Z
          // diagonal, so the framing holds at every angle of the spin.
          fit = { half: Math.max(1, Math.hypot(sx, sz) / 2), halfY: Math.max(1, sy / 2) };
          // A directional light's shadow camera is orthographic and has no
          // idea how big the subject is; left at its default it either misses
          // the cluster entirely or wastes the whole depth map around it.
          const sc = key.shadow.camera;
          const pad = fit.half * 1.3;
          sc.left = -pad;
          sc.right = pad;
          sc.top = pad;
          sc.bottom = -pad;
          sc.near = 1;
          sc.far = pad * 8;
          sc.updateProjectionMatrix();
          key.position.set(0.75, 1.6, 0.55).normalize().multiplyScalar(pad * 3);
        }
        frameCamera();
      };

      const resize = (): void => {
        const { clientWidth: w, clientHeight: h } = el;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        frameCamera(); // aspect feeds the fit, so re-frame when it changes
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let raf = 0;
      let running = true;
      let lastKey = '';
      let angle = 0.35;
      let prev = performance.now();

      const tick = (now: number): void => {
        if (!running) return;
        const dt = Math.min(0.05, (now - prev) / 1000);
        prev = now;

        // Rebuild only when an input actually changed — the geometry is static
        // within a stage, so rebuilding per frame would burn CPU for nothing.
        const key = `${String(seed)}:${String(growth)}`;
        if (key !== lastKey) {
          lastKey = key;
          rebuild();
        }

        if (spin && !reduced) angle += dt * 0.22;
        pivot.rotation.y = angle;
        headlight.position.copy(camera.position);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      const onVisibility = (): void => {
        if (document.hidden) {
          running = false;
          cancelAnimationFrame(raf);
        } else if (!running) {
          running = true;
          prev = performance.now();
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
        woodGeom.dispose();
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
    <div class="controls">
      {#each STAGES as s, i (s.label)}
        <button type="button" class:on={i === stage} onclick={() => { stage = i; }}>
          {s.label}
        </button>
      {/each}
      <button type="button" onclick={() => { seed = (seed + 1) % 9973; }}>reroll</button>
      <button type="button" class:on={spin} onclick={() => { spin = !spin; }}>spin</button>
    </div>
    <p class="meta">
      <em>Pleurotus ostreatus</em>
      <span class="nums">seed {seed} · {rebuildMs.toFixed(1)}ms</span>
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
    min-height: 24rem;
    border-radius: 2px;
    overflow: hidden;
    background: #0d0e0b;
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
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  .controls button {
    font: inherit;
    background: transparent;
    color: #928c7c;
    border: 1px solid rgba(236, 233, 224, 0.16);
    border-radius: 3px;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
  }
  .controls button:hover {
    color: #ece9e0;
  }
  .controls button.on {
    background: #e8a317;
    border-color: #e8a317;
    color: #1a1a14;
    font-weight: 700;
  }
  .controls button:focus-visible {
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

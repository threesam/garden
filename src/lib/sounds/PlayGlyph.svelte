<script lang="ts">
  // Three-state transport glyph, sized in `em` to its host button's font-size.
  //   play     — equilateral triangle (circumcenter = centroid, so it's optically
  //              centred AND its 3 vertices sit at 0°/120°/240° for a symmetric spin)
  //   loading  — those 3 vertices become comet heads orbiting with a trailing arc
  //              (a loading swirl) while el.play() is still pending
  //   playing  — snaps to the two pause bars
  // The vertices and the comet heads share the same circumradius (34), so the
  // triangle dissolving into the swirl is continuous.
  interface Props {
    state: "play" | "loading" | "playing";
  }
  let { state }: Props = $props();
</script>

<span class="glyph" data-state={state} aria-hidden="true">
  <svg viewBox="0 0 100 100">
    <!-- play: equilateral triangle pointing right -->
    <polygon class="tri" points="84,50 33,79.44 33,20.56" />

    <!-- loading: 3 comets (trailing arc + head dot) at 120° apart, group spins -->
    <g class="swirl" fill="currentColor">
      {#each [0, 120, 240] as a (a)}
        <g transform="rotate({a} 50 50)">
          <path
            d="M61.63,18.05 A34,34 0 0 1 84,50"
            fill="none"
            stroke="currentColor"
            stroke-width="9"
            stroke-linecap="round"
            stroke-opacity="0.4"
          />
          <circle cx="84" cy="50" r="7" />
        </g>
      {/each}
    </g>

    <!-- playing: pause bars -->
    <g class="bars" fill="currentColor">
      <rect x="35" y="27" width="11" height="46" rx="3" />
      <rect x="54" y="27" width="11" height="46" rx="3" />
    </g>
  </svg>
</span>

<style>
  .glyph {
    display: inline-grid;
    place-items: center;
    line-height: 0;
  }
  .glyph svg {
    display: block;
    width: 1em;
    height: 1em;
  }

  .tri,
  .swirl,
  .bars {
    opacity: 0;
    transition: opacity 0.22s ease;
  }
  /* spin around the viewBox centre regardless of how the SVG is scaled */
  .swirl {
    transform-box: view-box;
    transform-origin: 50% 50%;
  }

  [data-state="play"] .tri {
    opacity: 1;
  }
  [data-state="loading"] .swirl {
    opacity: 1;
    animation: pg-spin 0.8s linear infinite;
  }
  /* "snaps immediately to the pause button" — no fade in/out at playback start */
  [data-state="playing"] .bars {
    opacity: 1;
    transition: none;
  }
  [data-state="playing"] .swirl {
    opacity: 0;
    transition: none;
  }

  @keyframes pg-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-state="loading"] .swirl {
      animation: none; /* show the 3 static points instead of spinning them */
    }
  }
</style>

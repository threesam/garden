<script lang="ts">
  // Sliding-thumb segmented control.
  //
  // The thumb is positioned by left/right insets rather than width + translate,
  // which is what keeps it flush at the first and last segment instead of
  // leaving a hairline gap at the ends. Ported from the same control in duet.
  //
  // Items with an href render as links, for a switch between pages: the
  // active one is the current page. Items without one are buttons, and
  // buttons need an onselect, so the types make it one or the other.
  type Props = { active: number; ariaLabel?: string } & (
    | {
        items: readonly { readonly label: string; readonly href: string }[];
        onselect?: undefined;
      }
    | {
        items: readonly { readonly label: string; readonly href?: undefined }[];
        onselect: (index: number) => void;
      }
  );

  let { items, active, onselect, ariaLabel = 'Options' }: Props = $props();
</script>

<div class="seg" role="group" aria-label={ariaLabel} style:--n={items.length}>
  <span class="thumb" aria-hidden="true" style:--i={active < 0 ? 0 : active}></span>
  {#each items as item, i (item.label)}
    {#if item.href}
      <a
        class="seg-btn"
        class:on={active === i}
        href={item.href}
        aria-current={active === i ? 'page' : undefined}
        data-sveltekit-noscroll
      >
        {item.label}
      </a>
    {:else}
      <button
        type="button"
        class="seg-btn"
        class:on={active === i}
        aria-pressed={active === i}
        onclick={() => {
          onselect?.(i);
        }}
      >
        {item.label}
      </button>
    {/if}
  {/each}
</div>

<style>
  .seg {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--n), 1fr);
    border: 1px solid rgb(255 255 255 / 0.16);
    border-radius: 3px;
    overflow: hidden;
  }
  .thumb {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--i) * 100% / var(--n));
    right: calc((var(--n) - 1 - var(--i)) * 100% / var(--n));
    background: #e8a317;
    transition:
      left 0.35s ease,
      right 0.35s ease;
    z-index: 0;
  }
  .seg-btn {
    position: relative;
    z-index: 1;
    appearance: none;
    border: 0;
    background: transparent;
    color: rgb(255 255 255 / 0.55);
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.75rem;
    padding: 0.3rem 0.9rem;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.35s ease;
  }
  .seg-btn:hover:not(.on) {
    color: rgb(255 255 255 / 0.9);
  }
  .seg-btn.on {
    color: #14140f;
    font-weight: 700;
  }
  /* Drawn inside the segment, in its own text colour: .seg clips anything
     outside it, and a coin ring would vanish on the coin thumb. */
  .seg-btn:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: -4px;
  }
  @media (prefers-reduced-motion: reduce) {
    .thumb {
      transition: none;
    }
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    /**
     * How early to mount before visible. Snapshot on mount — prop
     * changes after mount have no effect (mirrors React original's
     * rootMarginRef snapshot).
     */
    rootMargin?: string;
    /**
     * Min height reserved while the child isn't yet mounted. Leave
     * unset when the parent already reserves space (e.g. min-h-dvh
     * section). Cleared once mounted.
     */
    placeholderMinHeight?: string;
    /** Optional class on the wrapping div. */
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    rootMargin = '400px',
    placeholderMinHeight,
    class: klass = '',
    children,
  }: Props = $props();

  let visible = $state(false);
  let host: HTMLDivElement | undefined = $state();

  onMount(() => {
    if (!host) return;
    if (typeof IntersectionObserver === 'undefined') {
      visible = true;
      return;
    }
    // Capture rootMargin in a closure-local variable so prop identity
    // changes after mount have no effect (mirrors React original's
    // rootMarginRef snapshot).
    const margin = rootMargin;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          visible = true;
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(host);
    return () => io.disconnect();
  });
</script>

<div
  bind:this={host}
  class={klass}
  style={visible || !placeholderMinHeight ? undefined : `min-height: ${placeholderMinHeight}`}
>
  {#if visible && children}{@render children()}{/if}
</div>

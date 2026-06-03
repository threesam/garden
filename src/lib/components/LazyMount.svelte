<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    /**
     * How early to mount before visible. Snapshotted on mount — prop
     * changes after mount have no effect.
     */
    rootMargin?: string;
    /**
     * Min height reserved while the child isn't yet mounted. Leave
     * unset when the parent already reserves space (e.g. min-h-dvh
     * section). Cleared once mounted.
     */
    placeholderMinHeight?: string;
    /**
     * When true, the visibility flip is wrapped in requestIdleCallback
     * (with a 2 s timeout fallback) so heavy child mounts land in idle
     * slots between scroll frames instead of competing with scroll.
     * Defaults to false to preserve existing callers' behaviour.
     */
    useIdle?: boolean;
    /** Optional class on the wrapping div. */
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    rootMargin = '400px',
    placeholderMinHeight,
    useIdle = false,
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
    // Snapshot rootMargin + useIdle so prop changes after mount have no effect.
    const margin = rootMargin;
    const ric =
      useIdle && typeof requestIdleCallback === 'function'
        ? requestIdleCallback
        : null;
    const cancelRic =
      typeof cancelIdleCallback === 'function' ? cancelIdleCallback : null;
    let idleHandle: number | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (ric) {
          // 2 s upper bound so the mount fires even on a device that
          // never goes truly idle (busy main thread during long scrolls).
          idleHandle = ric(
            () => {
              idleHandle = null;
              visible = true;
            },
            { timeout: 2000 } as IdleRequestOptions,
          );
        } else {
          // Falls through here when useIdle is off OR the browser doesn't
          // support rIC — same behaviour as before the prop existed.
          visible = true;
        }
      },
      { rootMargin: margin },
    );
    io.observe(host);
    return () => {
      io.disconnect();
      if (idleHandle != null && cancelRic) cancelRic(idleHandle);
    };
  });
</script>

<div
  bind:this={host}
  class={klass}
  style={visible || !placeholderMinHeight ? undefined : `min-height: ${placeholderMinHeight}`}
>
  {#if visible && children}{@render children()}{/if}
</div>

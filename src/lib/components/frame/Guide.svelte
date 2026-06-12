<script lang="ts">
  import { preloadCode } from '$app/navigation';
  import { NAV_ROUTES } from '$lib/nav';
  import { gameMode } from '$lib/game-mode.svelte';
  import { messageMode } from '$lib/message-mode.svelte';

  let open = $state(false);
  let hovered = $state(false);
  let locked = $state(false);
  // The back-face "+" already renders as an "x" once rotated, so any
  // homepage easter-egg mode (snake game, "message me?" letter) borrows
  // it: the coin flips to the x glyph and a click quits that mode
  // instead of opening the nav menu.
  const inMode = $derived(gameMode.active || messageMode.active || messageMode.revealing);

  function handleCoinClick() {
    if (gameMode.active) {
      gameMode.stop();
      return;
    }
    if (messageMode.active) {
      messageMode.stop();
      return;
    }
    if (messageMode.revealing) {
      // "message me?" is revealed but the letter isn't open yet — the x
      // cancels the reveal (restores the gallery) instead of opening the menu.
      messageMode.revealing = false;
      return;
    }
    open = !open;
    if (!open) {
      hovered = false;
      locked = true;
    }
  }

  function handleCoinMouseEnter() {
    if (inMode) return;
    if (!locked) hovered = true;
    // Warm all route JS chunks on first coin hover — no-op on subsequent calls.
    for (const r of NAV_ROUTES) {
      void preloadCode(r.href);
    }
  }

  function handleCoinMouseLeave() {
    hovered = false;
    locked = false;
  }

  // Derived coin transform — no nested ternary.
  const coinTransform = $derived((() => {
    if (inMode || open) return 'rotateY(180deg) rotate(45deg)';
    if (hovered) return 'rotateY(180deg)';
    return 'rotateY(0deg)';
  })());

  const coinBoxShadow = $derived(
    hovered
      ? 'inset 0 0 0 1.5px var(--black), 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
      : 'inset 0 0 0 1.5px var(--black), 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  );
</script>

<!-- Coin — fixed top-right -->
<button
  onclick={handleCoinClick}
  onmouseenter={handleCoinMouseEnter}
  onmouseleave={handleCoinMouseLeave}
  aria-label="Menu"
  style="border:0;outline:0;background:none;padding:0;margin:0;appearance:none;-webkit-appearance:none;box-shadow:none;transform:translateZ(0)"
  class="fixed top-5 right-5 z-[9999] cursor-pointer md:top-6 md:right-8"
>
  <div
    style="
      width:40px;
      height:40px;
      border-radius:50%;
      background-color:var(--coin);
      box-shadow:{coinBoxShadow};
      transition:transform 300ms ease-in-out, box-shadow 300ms ease-in-out;
      transform-style:preserve-3d;
      transform:{coinTransform};
      position:relative;
    "
  >
    <!-- Front face — hamburger -->
    <span
      style="position:absolute;left:50%;top:50%;width:14px;display:block;transform:translate(-50%,-50%);backface-visibility:hidden"
    >
      <span
        style="display:block;height:2px;width:100%;background-color:var(--black);transform:translateY(-3px)"
      ></span>
      <span
        style="display:block;height:2px;width:100%;background-color:var(--black);transform:translateY(3px)"
      ></span>
    </span>
    <!-- Back face — plus -->
    <span
      style="position:absolute;left:50%;top:50%;width:14px;display:block;transform:translate(-50%,-50%) rotateY(180deg);backface-visibility:hidden"
    >
      <span style="display:block;height:2px;width:100%;background-color:var(--black)"></span>
      <span
        style="position:absolute;top:50%;left:50%;height:14px;width:2px;background-color:var(--black);transform:translate(-50%,-50%)"
      ></span>
    </span>
  </div>
</button>

<!-- Menu overlay -->
<nav
  class="fixed inset-0 z-[9998] flex items-center justify-center backdrop-blur-md transition-all duration-300"
  class:opacity-100={open}
  class:pointer-events-none={!open}
  class:opacity-0={!open}
  style="background-color:var(--coin);transform:translateZ(0)"
>
  <a
    href="/"
    onclick={() => (open = false)}
    data-sveltekit-preload-code="hover"
    class="font-mono text-2xl font-bold tracking-pill transition-transform duration-300 hover:scale-110 hover:duration-[4000ms] hover:ease-out"
    style="color:var(--black)"
  >
    go home
  </a>
</nav>

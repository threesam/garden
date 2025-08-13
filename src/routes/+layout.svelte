<script lang="ts">
  import AuthModal from '$lib/components/AuthModal.svelte';
  export let data: { isAuthenticated: boolean };

  let showAuth = false;

  function openAuth() {
    showAuth = true;
  }
  function closeAuth() {
    showAuth = false;
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
  }
</script>

<header style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;border-bottom:1px solid #eee;">
  <strong>Site</strong>
  {#if data.isAuthenticated}
    <div style="display:flex;gap:0.5rem;align-items:center;">
      <span title="Vercel Draft Mode is active via ISR bypass">Draft Mode</span>
      <button on:click={logout}>Log out</button>
    </div>
  {:else}
    <button on:click={openAuth}>Log in</button>
  {/if}
</header>

<main style="padding: 1rem;">
  <slot />
</main>

<AuthModal open={showAuth} on:close={closeAuth} on:success={closeAuth} />

<style>
  button { cursor: pointer; padding: 0.4rem 0.7rem; border: 1px solid #ddd; border-radius: 8px; background: #f8f8f8; }
  button:hover { background: #f0f0f0; }
</style>
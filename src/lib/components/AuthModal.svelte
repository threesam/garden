<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  const dispatch = createEventDispatcher();

  let password = '';
  let error = '';
  let loading = false;

  async function submit() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        dispatch('success');
        // Reload to ensure cookies take effect for SSR & Draft Mode
        location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        error = data?.error || 'Authentication failed';
      }
    } catch (e) {
      error = 'Network error';
    } finally {
      loading = false;
    }
  }

  function close() {
    dispatch('close');
  }
</script>

{#if open}
  <div class="backdrop" on:click|self={close}>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <h2 id="auth-title">Sign in</h2>
      <form on:submit|preventDefault={submit}>
        <input
          type="password"
          placeholder="Password"
          bind:value={password}
          autocomplete="current-password"
          required
        />
        {#if error}
          <p class="error">{error}</p>
        {/if}
        <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: color-mix(in oklab, black 50%, transparent);
    display: grid;
    place-items: center;
    z-index: 1000;
  }
  .modal {
    background: white;
    color: black;
    border-radius: 12px;
    padding: 1.25rem;
    width: min(92vw, 360px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  form {
    display: grid;
    gap: 0.75rem;
  }
  input[type='password'] {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid #dadada;
    border-radius: 8px;
    outline: none;
  }
  input[type='password']:focus {
    border-color: #5b9dff;
    box-shadow: 0 0 0 3px rgba(91, 157, 255, 0.2);
  }
  .error {
    color: #b00020;
    font-size: 0.9rem;
    margin: 0;
  }
  button[type='submit'] {
    background: black;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    cursor: pointer;
  }
  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
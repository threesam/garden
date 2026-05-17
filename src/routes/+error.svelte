<script lang="ts">
  import { page } from '$app/state';
</script>

<main
  class="flex min-h-dvh flex-col items-center justify-center gap-6 px-6"
  style="background: var(--black); color: var(--white)"
>
  <div
    class="font-mono text-xs uppercase tracking-[0.3em]"
    style="color: var(--coin)"
  >
    {page.status === 404 ? '404' : page.status}
  </div>
  <h1 class="text-3xl font-bold leading-tight md:text-4xl">
    {page.status === 404 ? 'nothing here.' : (page.error?.message ?? 'something broke.')}
  </h1>
  <a
    href="/"
    class="font-mono text-xs uppercase tracking-[0.2em] underline underline-offset-4 transition-opacity hover:opacity-70"
    style="color: var(--coin)"
  >
    back home
  </a>
</main>

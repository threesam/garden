<script lang="ts">
  // The quiet list ("guestbook, not billboard"): one line and one field at the
  // very END of a content page — /thoughts essays, /sounds. Deliberately not a
  // CTA: no benefit bullets, no subscriber counts, never above the content,
  // never on the homepage, /self, /benny or /dad. The garden list is double
  // opt-in, so the success state points at the confirmation mail.
  import { EMAIL_RX, MAX_EMAIL_LEN } from "$lib/message-schema";

  let { line, placement }: { line: string; placement: string } = $props();

  let email = $state("");
  let website = $state(""); // honeypot — same trick as the message form
  let status = $state<"idle" | "sending" | "sent" | "error">("idle");

  const valid = $derived(
    EMAIL_RX.test(email.trim()) && email.trim().length <= MAX_EMAIL_LEN,
  );

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!valid || status === "sending") return;
    status = "sending";
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), website, placement }),
      });
      if (!res.ok) throw new Error(String(res.status));
      status = "sent";
      window.umami?.track("quiet-list", { placement });
    } catch {
      status = "error";
    }
  }
</script>

<div class="font-mono">
  {#if status === "sent"}
    <p class="text-xs text-zinc-500 md:text-sm">
      sent. confirm in your inbox and you're in.
    </p>
  {:else}
    <p class="text-xs text-zinc-500 md:text-sm">{line}</p>
    <form onsubmit={submit} class="mt-3 flex items-baseline gap-3">
      <input
        type="text"
        name="website"
        tabindex="-1"
        autocomplete="off"
        bind:value={website}
        class="hidden"
        aria-hidden="true"
      />
      <input
        type="email"
        bind:value={email}
        maxlength={MAX_EMAIL_LEN}
        placeholder="address"
        aria-label="email address"
        class="w-48 max-w-full border-b border-zinc-700 bg-transparent pb-1 text-sm text-white placeholder:text-zinc-600 focus:border-coin focus:outline-none"
      />
      <button
        type="submit"
        disabled={!valid || status === "sending"}
        class="cursor-pointer text-xs uppercase tracking-section text-zinc-500 transition-colors hover:text-coin disabled:cursor-default disabled:opacity-40"
      >
        {status === "sending" ? "…" : "ok"}
      </button>
    </form>
    {#if status === "error"}
      <p class="mt-2 text-xs text-zinc-600">didn't take. try again?</p>
    {/if}
  {/if}
</div>

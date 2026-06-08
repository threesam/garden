<script lang="ts">
	import { fade } from 'svelte/transition';
	import { messageMode } from '$lib/message-mode.svelte';

	// Bottom-right action label. Two letter sets sit in the same flex row,
	// one collapsed at a time — same trick the wordmark uses for
	// threesam ↔ snake / threesam ↔ message me?:
	//
	//   .ready  → form is filled & valid → "send it?" expands, "message
	//             me?" collapses, click submits
	//   default → "message me?" reads as a label, no-op click
	const MESSAGE_CHARS = ['m', 'e', 's', 's', 'a', 'g', 'e', ' ', 'm', 'e', '?'];
	const SEND_CHARS = ['s', 'e', 'n', 'd', ' ', 'i', 't', '?'];

	const ready = $derived(messageMode.formValid && !messageMode.sending && !messageMode.sent);

	function onClick() {
		if (!ready) return;
		void messageMode.send();
	}

	function onKey(e: KeyboardEvent) {
		if (!ready) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			void messageMode.send();
		}
	}
</script>

<div
	class="action"
	class:ready
	class:clickable={ready}
	role="button"
	tabindex={ready ? 0 : -1}
	aria-disabled={!ready}
	aria-label={ready ? 'send the message' : 'message Sam — fill in the message and your email'}
	onclick={onClick}
	onkeydown={onKey}
	transition:fade={{ duration: 350 }}
>
	{#each MESSAGE_CHARS as l, i (`msg-${i}`)}
		<span class="msg" style="--d: {i * 60}ms">{l}</span>
	{/each}
	{#each SEND_CHARS as l, i (`snd-${i}`)}
		<span class="snd" style="--d: {i * 70}ms">{l}</span>
	{/each}
</div>

<style>
	.action {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 50;
		display: flex;
		align-items: baseline;
		font-family: 'Recursive Mono', ui-monospace, monospace;
		font-weight: 700;
		font-size: 1.875rem;
		letter-spacing: 0.04em;
		color: var(--black);
		user-select: none;
		cursor: default;
	}
	@media (min-width: 768px) {
		.action {
			bottom: 2rem;
			right: 2rem;
			font-size: 2.25rem;
		}
	}
	.action.clickable {
		cursor: pointer;
	}
	.msg,
	.snd {
		display: inline-block;
		overflow: hidden;
		white-space: pre;
		transition:
			max-width 450ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 350ms ease-out;
		max-width: 1em;
		opacity: 1;
		transition-delay: 0ms;
	}
	/* "send it?" is the alt set — collapsed by default. */
	.snd {
		max-width: 0;
		opacity: 0;
	}
	/* READY (form valid): "message me?" collapses, "send it?" expands,
	   both staggered so the morph reads as a transformation rather than
	   a swap. */
	.ready .msg {
		max-width: 0;
		opacity: 0;
		transition-delay: var(--d, 0ms);
	}
	.ready .snd {
		max-width: 1em;
		opacity: 1;
		transition-delay: var(--d, 0ms);
	}
	@media (prefers-reduced-motion: reduce) {
		.msg,
		.snd {
			transition: none;
		}
	}
</style>

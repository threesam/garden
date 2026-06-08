<script lang="ts">
	import { fade } from 'svelte/transition';
	import { messageMode } from '$lib/message-mode.svelte';

	// Bottom-right "send message" action. Muted + disabled until the letter is
	// filled out — message + name + a valid email — then it lights up and
	// submits on click / Enter / Space (native <button> handles the keys).
	const ready = $derived(messageMode.formValid && !messageMode.sending && !messageMode.sent);
	const label = $derived(messageMode.sending ? 'sending...' : 'send message');

	// Keep the action visible above the on-screen keyboard. iOS Safari leaves
	// position:fixed pinned to the layout viewport (i.e. behind the keyboard),
	// so track the visual viewport and lift the button by the covered height.
	$effect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const root = document.documentElement;
		const update = () => {
			const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
			root.style.setProperty('--kb-inset', `${inset}px`);
		};
		update();
		vv.addEventListener('resize', update);
		vv.addEventListener('scroll', update);
		return () => {
			vv.removeEventListener('resize', update);
			vv.removeEventListener('scroll', update);
			root.style.removeProperty('--kb-inset');
		};
	});

	function onClick() {
		if (!ready) return;
		void messageMode.send();
	}
</script>

<button
	type="button"
	class="action"
	class:ready
	disabled={!ready}
	onclick={onClick}
	transition:fade={{ duration: 350 }}
>
	{label}
</button>

<style>
	.action {
		position: fixed;
		right: 1.5rem;
		bottom: calc(1.5rem + var(--kb-inset, 0px));
		z-index: 50;
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		font-family: 'Recursive Mono', ui-monospace, monospace;
		font-weight: 700;
		font-size: 1.875rem;
		letter-spacing: 0.04em;
		color: var(--black);
		white-space: nowrap;
		opacity: 0.3;
		cursor: not-allowed;
		user-select: none;
		transition: opacity 300ms ease-out;
	}
	@media (min-width: 768px) {
		.action {
			right: 2rem;
			bottom: calc(2rem + var(--kb-inset, 0px));
			font-size: 2.25rem;
		}
	}
	.action.ready {
		opacity: 1;
		cursor: pointer;
	}
	@media (prefers-reduced-motion: reduce) {
		.action {
			transition: none;
		}
	}
</style>

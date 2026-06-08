<script lang="ts">
	import { fade } from 'svelte/transition';
	import { messageMode } from '$lib/message-mode.svelte';

	// Imitates a handwritten letter: "hey Sam," at the top, an invisible
	// textarea where the cursor starts (no placeholder — the blinking
	// caret IS the affordance), then "sincerely," and a borderless email
	// input. Fullscreen on mobile; centered card on desktop.

	// `use:autofocus` — drop the cursor into the textarea the moment the
	// card mounts so the user can start typing without an extra tap. The
	// action runs once per node, which is exactly when we want focus.
	const autofocus = (node: HTMLTextAreaElement) => {
		node.focus({ preventScroll: true });
	};

	// Escape closes the letter. role="dialog" carries this expectation;
	// without it keyboard users have no exit path (the coin x is the
	// pointer path).
	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') messageMode.stop();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div
	class="card"
	role="dialog"
	aria-modal="true"
	aria-label="message Sam"
	transition:fade={{ duration: 350 }}
>
	<form
		class="sheet"
		onsubmit={(e) => {
			e.preventDefault();
			messageMode.send();
		}}
	>
		<p class="line greeting">hey Sam,</p>
		<textarea
			class="body"
			use:autofocus
			bind:value={messageMode.body}
			rows="6"
			maxlength="5000"
			aria-label="your message"
		></textarea>
		<p class="line signoff">sincerely,</p>
		<input
			class="email"
			type="email"
			autocomplete="email"
			inputmode="email"
			maxlength="200"
			placeholder="your email?"
			aria-label="your email"
			bind:value={messageMode.email}
		/>
		<!-- Honeypot: invisible to humans, irresistible to bots. Server
		     silently 200s if it's non-empty. tabindex=-1 + autocomplete=off
		     so a real user tabbing through doesn't accidentally land on it.
		     Enter on the email input submits the form natively — no
		     visible button needed; SendAction (bottom-right) is the
		     pointer/keyboard target. -->
		<input
			class="honeypot"
			type="text"
			name="website"
			tabindex="-1"
			autocomplete="off"
			aria-hidden="true"
		/>
		{#if messageMode.error}
			<p class="error" role="alert">{messageMode.error}</p>
		{/if}
		{#if messageMode.sent}
			<p class="sent" role="status">sent — talk soon.</p>
		{/if}
	</form>
</div>

<style>
	.card {
		position: fixed;
		z-index: 35;
		inset: 0;
		display: grid;
		place-items: center;
		background: var(--white);
		padding: 6rem 1.5rem 8rem;
	}
	@media (min-width: 768px) {
		.card {
			inset: auto;
			top: 50%;
			left: 50%;
			width: min(560px, calc(100vw - 4rem));
			max-height: calc(100dvh - 8rem);
			padding: 0;
			background: transparent;
			transform: translate(-50%, -50%);
			place-items: stretch;
		}
	}
	.sheet {
		width: 100%;
		max-width: 560px;
		color: var(--black);
		font-family: 'Recursive Mono', ui-monospace, monospace;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	@media (min-width: 768px) {
		.sheet {
			background: var(--white);
			border-radius: 14px;
			padding: 2.4rem 2.2rem 2.6rem;
			box-shadow:
				0 30px 70px -10px rgba(0, 0, 0, 0.35),
				0 10px 20px -10px rgba(0, 0, 0, 0.25);
		}
	}
	.line {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		letter-spacing: 0.01em;
	}
	.greeting {
		margin-bottom: 0.4rem;
	}
	.signoff {
		margin-top: 1.2rem;
	}
	.body,
	.email {
		width: 100%;
		background: transparent;
		border: 0;
		padding: 0;
		margin: 0;
		font: inherit;
		color: inherit;
		resize: none;
		caret-color: var(--black);
	}
	.body {
		min-height: 8rem;
		line-height: 1.55;
	}
	.email {
		padding-left: 0;
	}
	.body::placeholder,
	.email::placeholder {
		color: rgba(0, 0, 0, 0.35);
	}
	.body:focus,
	.email:focus {
		outline: none;
	}
	.honeypot {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
	.error,
	.sent {
		margin: 0.4rem 0 0;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.error {
		color: #b00020;
	}
	.sent {
		color: var(--black);
		opacity: 0.7;
	}
</style>

<script lang="ts">
	interface Props {
		src: string;
		srcset?: string;
		sizes?: string;
		alt?: string;
		/** When true: load eager, fetchpriority high, AND start visible (no fade
		 *  gate). The fade would otherwise hide the LCP candidate behind itself. */
		eager?: boolean;
		decoding?: 'sync' | 'async' | 'auto';
		width?: number | string;
		height?: number | string;
		fadeMs?: number;
		draggable?: boolean;
		onerror?: (e: Event) => void;
		class?: string;
		style?: string;
	}

	let {
		src,
		srcset,
		sizes,
		alt = '',
		eager = false,
		decoding = 'async',
		width,
		height,
		fadeMs = 700,
		draggable,
		onerror,
		class: className = '',
		style = '',
	}: Props = $props();

	// Eager (LCP candidate) always shows; lazy gates the reveal on the img's
	// load event so a scrolled-to image never flashes a half-decoded frame.
	let hasLoaded = $state(false);
	let visible = $derived(eager || hasLoaded);
</script>

<img
	{src}
	{srcset}
	{sizes}
	{alt}
	{decoding}
	{width}
	{height}
	{draggable}
	{onerror}
	loading={eager ? 'eager' : 'lazy'}
	fetchpriority={eager ? 'high' : 'auto'}
	onload={() => (hasLoaded = true)}
	class="transition-opacity ease-out {className}"
	style="opacity: {visible ? 1 : 0}; transition-duration: {fadeMs}ms; {style}"
/>

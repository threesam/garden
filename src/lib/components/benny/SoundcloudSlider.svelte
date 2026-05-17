<script lang="ts">
	import LazyMount from '$lib/components/LazyMount.svelte';

	const TRACKS = [
		{
			user: 'sixtomidnightproductions',
			slug: 'possumkingdomcover-by-benjamin-porawski',
			title: 'Possum Kingdom (cover) by Benjamin Porawski',
		},
		{
			user: 'sixtomidnightproductions',
			slug: 'scraptheep',
			title: 'Scrap the Eep',
		},
		{
			user: 'threesam',
			slug: 'the-hey-blinkins',
			title: 'The Hey Blinkins',
		},
	];

	const CARD_HEIGHT = 380;

	function trackEmbed(user: string, slug: string): string {
		const url = `https://soundcloud.com/${user}/${slug}`;
		const params = new URLSearchParams({
			url,
			color: '#e8a317',
			auto_play: 'false',
			hide_related: 'true',
			show_comments: 'false',
			show_user: 'true',
			show_reposts: 'false',
			show_teaser: 'false',
			visual: 'true',
		});
		return `https://w.soundcloud.com/player/?${params.toString()}`;
	}
</script>

<div
	class="flex snap-x snap-mandatory overflow-x-auto scroll-pl-6 pb-3 pr-6 [scrollbar-color:var(--coin)_transparent] [scrollbar-width:thin] md:gap-9 md:overflow-x-visible md:pb-0 md:pl-9 md:pr-9"
>
	{#each TRACKS as t (`${t.user}/${t.slug}`)}
		<div
			class="ml-6 flex-[0_0_69vw] snap-start overflow-hidden rounded-xl bg-zinc-800 md:ml-0 md:min-w-0 md:flex-1"
			style="height: {CARD_HEIGHT}px;"
		>
			<LazyMount rootMargin="200px" class="h-full w-full">
				<iframe
					src={trackEmbed(t.user, t.slug)}
					loading="lazy"
					allow="autoplay"
					title={t.title}
					class="block h-full w-full border-0"
				></iframe>
			</LazyMount>
		</div>
	{/each}
</div>

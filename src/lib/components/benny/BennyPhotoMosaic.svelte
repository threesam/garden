<script lang="ts">
	const PHOTO_COUNT = 57;

	const photos = Array.from({ length: PHOTO_COUNT }, (_, i) => {
		const idx = String(i + 1).padStart(3, '0');
		return `/assets/benny-photos/${idx}.jpg`;
	});
</script>

<div class="max-h-dvh overflow-hidden">
	<div class="mosaic">
		{#each photos as src (src)}
			<img
				{src}
				alt=""
				width="400"
				height="600"
				loading="lazy"
				sizes="(min-width: 1280px) 9vw, (min-width: 1024px) 12vw, (min-width: 640px) 16vw, 24vw"
				class="block w-full"
			/>
		{/each}
	</div>
</div>

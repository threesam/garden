<script lang="ts">
	// Written out whole so the build can fingerprint each one (asset-version.ts).
	const photos = [
		'/assets/benny-photos/001.jpg',
		'/assets/benny-photos/002.jpg',
		'/assets/benny-photos/003.jpg',
		'/assets/benny-photos/004.jpg',
		'/assets/benny-photos/005.jpg',
		'/assets/benny-photos/006.jpg',
		'/assets/benny-photos/007.jpg',
		'/assets/benny-photos/008.jpg',
		'/assets/benny-photos/009.jpg',
		'/assets/benny-photos/010.jpg',
		'/assets/benny-photos/011.jpg',
		'/assets/benny-photos/012.jpg',
		'/assets/benny-photos/013.jpg',
		'/assets/benny-photos/014.jpg',
		'/assets/benny-photos/015.jpg',
		'/assets/benny-photos/016.jpg',
		'/assets/benny-photos/017.jpg',
		'/assets/benny-photos/018.jpg',
		'/assets/benny-photos/019.jpg',
		'/assets/benny-photos/020.jpg',
		'/assets/benny-photos/021.jpg',
		'/assets/benny-photos/022.jpg',
		'/assets/benny-photos/023.jpg',
		'/assets/benny-photos/024.jpg',
		'/assets/benny-photos/025.jpg',
		'/assets/benny-photos/026.jpg',
		'/assets/benny-photos/027.jpg',
		'/assets/benny-photos/028.jpg',
		'/assets/benny-photos/029.jpg',
		'/assets/benny-photos/030.jpg',
		'/assets/benny-photos/031.jpg',
		'/assets/benny-photos/032.jpg',
		'/assets/benny-photos/033.jpg',
		'/assets/benny-photos/034.jpg',
		'/assets/benny-photos/035.jpg',
		'/assets/benny-photos/036.jpg',
		'/assets/benny-photos/037.jpg',
		'/assets/benny-photos/038.jpg',
		'/assets/benny-photos/039.jpg',
		'/assets/benny-photos/040.jpg',
		'/assets/benny-photos/041.jpg',
		'/assets/benny-photos/042.jpg',
		'/assets/benny-photos/043.jpg',
		'/assets/benny-photos/044.jpg',
		'/assets/benny-photos/045.jpg',
		'/assets/benny-photos/046.jpg',
		'/assets/benny-photos/047.jpg',
		'/assets/benny-photos/048.jpg',
		'/assets/benny-photos/049.jpg',
		'/assets/benny-photos/050.jpg',
		'/assets/benny-photos/051.jpg',
		'/assets/benny-photos/052.jpg',
		'/assets/benny-photos/053.jpg',
		'/assets/benny-photos/054.jpg',
		'/assets/benny-photos/055.jpg',
		'/assets/benny-photos/056.jpg',
		'/assets/benny-photos/057.jpg',
	];
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

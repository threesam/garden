
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>
		};
		Pathname(): "/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/assets/adventure.png" | "/assets/anything-but-analog.png" | "/assets/benny/the_podcast-poster.jpg" | "/assets/benny/the_podcast.mp4" | "/assets/benny/the_podcast.vtt" | "/assets/benny-photos/001.jpg" | "/assets/benny-photos/002.jpg" | "/assets/benny-photos/003.jpg" | "/assets/benny-photos/004.jpg" | "/assets/benny-photos/005.jpg" | "/assets/benny-photos/006.jpg" | "/assets/benny-photos/007.jpg" | "/assets/benny-photos/008.jpg" | "/assets/benny-photos/009.jpg" | "/assets/benny-photos/010.jpg" | "/assets/benny-photos/011.jpg" | "/assets/benny-photos/012.jpg" | "/assets/benny-photos/013.jpg" | "/assets/benny-photos/014.jpg" | "/assets/benny-photos/015.jpg" | "/assets/benny-photos/016.jpg" | "/assets/benny-photos/017.jpg" | "/assets/benny-photos/018.jpg" | "/assets/benny-photos/019.jpg" | "/assets/benny-photos/020.jpg" | "/assets/benny-photos/021.jpg" | "/assets/benny-photos/022.jpg" | "/assets/benny-photos/023.jpg" | "/assets/benny-photos/024.jpg" | "/assets/benny-photos/025.jpg" | "/assets/benny-photos/026.jpg" | "/assets/benny-photos/027.jpg" | "/assets/benny-photos/028.jpg" | "/assets/benny-photos/029.jpg" | "/assets/benny-photos/030.jpg" | "/assets/benny-photos/031.jpg" | "/assets/benny-photos/032.jpg" | "/assets/benny-photos/033.jpg" | "/assets/benny-photos/034.jpg" | "/assets/benny-photos/035.jpg" | "/assets/benny-photos/036.jpg" | "/assets/benny-photos/037.jpg" | "/assets/benny-photos/038.jpg" | "/assets/benny-photos/039.jpg" | "/assets/benny-photos/040.jpg" | "/assets/benny-photos/041.jpg" | "/assets/benny-photos/042.jpg" | "/assets/benny-photos/043.jpg" | "/assets/benny-photos/044.jpg" | "/assets/benny-photos/045.jpg" | "/assets/benny-photos/046.jpg" | "/assets/benny-photos/047.jpg" | "/assets/benny-photos/048.jpg" | "/assets/benny-photos/049.jpg" | "/assets/benny-photos/050.jpg" | "/assets/benny-photos/051.jpg" | "/assets/benny-photos/052.jpg" | "/assets/benny-photos/053.jpg" | "/assets/benny-photos/054.jpg" | "/assets/benny-photos/055.jpg" | "/assets/benny-photos/056.jpg" | "/assets/benny-photos/057.jpg" | "/assets/blondie.png" | "/assets/chip-malt-new-address.png" | "/assets/clouds.webp" | "/assets/dad-1.jpg" | "/assets/deana-5.webp" | "/assets/deana-6.jpg" | "/assets/deana-hero-3.webp" | "/assets/deana-hero-5.webp" | "/assets/deana-hero-6.webp" | "/assets/deana-hero.webp" | "/assets/dissonance.png" | "/assets/fault-lines.webp" | "/assets/piece-of-paper.webp" | "/assets/self-hero-mobile.webp" | "/assets/self-hero.webp" | "/assets/sixtomidnight-banner.jpg" | "/assets/sixtomidnight-logo.svg" | "/assets/sixtomidnight-tribute-poster.jpg" | "/assets/sixtomidnight-tribute.mp4" | "/assets/sixtomidnight-tribute.webm" | "/assets/velvet-door.png" | "/audio/README.md" | "/audio/identity_theft_is_not_a_joke.mp3" | "/audio/natural_causes.mp3" | "/audio/silent.mp3" | "/file.svg" | "/globe.svg" | "/next.svg" | "/og/anything-but-analog.png" | "/og/benny.png" | "/og/dad.png" | "/og/deana.png" | "/og/default.png" | "/og/self.png" | "/vercel.svg" | "/wasm/README.md" | "/wasm/garden_math.wasm" | "/window.svg" | string & {};
	}
}
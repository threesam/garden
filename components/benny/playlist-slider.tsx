import type { BennyPlaylist } from "@/app/benny/playlists";
import { LazyMount } from "@/components/lazy-mount";

type Props = {
  playlists: BennyPlaylist[];
};

const CARD_HEIGHT = 380;

export function PlaylistSlider({ playlists }: Props) {
  return (
    <div className="relative">
      <div className="flex snap-x snap-mandatory overflow-x-auto scroll-pl-6 pb-3 pr-6 [scrollbar-color:var(--coin)_transparent] [scrollbar-width:thin] md:scroll-pl-9 md:pr-9">
        {playlists.map((p) => (
          <div
            key={p.id}
            className="ml-6 flex-[0_0_69vw] snap-start overflow-hidden rounded-xl bg-zinc-800 md:ml-9 md:flex-[0_0_352px]"
            style={{ height: `${CARD_HEIGHT}px` }}
          >
            <LazyMount rootMargin="200px" className="h-full w-full">
              <iframe
                src={`https://open.spotify.com/embed/playlist/${p.id}?theme=0`}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                title={p.name}
                className="block h-full w-full border-0"
              />
            </LazyMount>
          </div>
        ))}
      </div>
    </div>
  );
}

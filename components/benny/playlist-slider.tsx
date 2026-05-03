import type { BennyPlaylist } from "@/app/benny/playlists";
import { LazyPlaylistCard } from "./lazy-playlist-card";

type Props = {
  playlists: BennyPlaylist[];
};

const CARD_WIDTH = 352;
const CARD_HEIGHT = 380;

export function PlaylistSlider({ playlists }: Props) {
  return (
    <div className="relative">
      <div
        className="flex snap-x snap-mandatory overflow-x-auto scroll-pl-6 pb-3 pr-6 md:scroll-pl-9 md:pr-9"
        style={{ scrollbarWidth: "thin", scrollbarColor: "var(--coin) transparent" }}
      >
        {playlists.map((p) => (
          <div
            key={p.id}
            className="snap-start overflow-hidden rounded-xl bg-zinc-800 ml-6 md:ml-9"
            style={{ flex: `0 0 ${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
          >
            <LazyPlaylistCard id={p.id} name={p.name} />
          </div>
        ))}
      </div>
    </div>
  );
}

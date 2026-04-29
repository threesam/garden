import type { BennyPlaylist } from "@/app/benny/playlists";

type Props = {
  playlists: BennyPlaylist[];
};

const CARD_WIDTH = 352;
const CARD_HEIGHT = 380;

export function PlaylistSlider({ playlists }: Props) {
  return (
    <div className="relative">
      <div
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:px-8"
        style={{ scrollbarWidth: "thin", scrollbarColor: "var(--coin) transparent" }}
      >
        {playlists.map((p) => (
          <div
            key={p.id}
            className="snap-start overflow-hidden rounded-xl bg-zinc-800"
            style={{ flex: `0 0 ${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
          >
            <iframe
              src={`https://open.spotify.com/embed/playlist/${p.id}?theme=0`}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              title={p.name}
              className="block h-full w-full"
              style={{ border: 0 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

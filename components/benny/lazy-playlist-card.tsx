"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  id: string;
  name: string;
};

// IntersectionObserver-driven mount: the iframe (and its ~150KB of
// Spotify chunks) only fetches when the card scrolls into the
// observer's `rootMargin` window. The fixed-height parent div keeps
// the layout stable so swapping in the iframe doesn't trigger CLS.
// Once mounted, the iframe stays mounted to avoid re-fetch flicker.
export function LazyPlaylistCard({ id, name }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMounted(true);
            obs.disconnect();
            return;
          }
        }
      },
      // 200px margin = start fetching just before the card enters view
      // so the iframe has a head start on its handshake.
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [mounted]);

  return (
    <div ref={ref} className="h-full w-full">
      {mounted ? (
        <iframe
          src={`https://open.spotify.com/embed/playlist/${id}?theme=0`}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          title={name}
          className="block h-full w-full"
          style={{ border: 0 }}
        />
      ) : null}
    </div>
  );
}

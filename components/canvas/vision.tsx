interface VisionProps {
  src: string;
  poster?: string;
}

/**
 * Something the author filmed. A place they went. A moment they kept.
 * It plays. That's all it needs to do.
 */
export function Vision({ src, poster }: VisionProps) {
  return (
    <section className="w-full">
      <video
        className="h-auto w-full"
        src={src}
        poster={poster}
        controls={false}
        autoPlay
        muted
        loop
        playsInline
      />
    </section>
  );
}

import Image from "next/image";

interface CloudSpriteProps {
  mirror?: boolean;
}

// Source is already an optimal 13 KB WebP, so `unoptimized` skips a
// pointless `/_next/image` re-encode pass. `priority` is on because
// every placement (homepage header + footer, canvas hero, Anchor) is
// either above-the-fold or LazyMount-gated to "about to enter viewport"
// — no instance benefits from the default lazy-load.
export function CloudSprite({ mirror = false }: CloudSpriteProps) {
  return (
    <Image
      src="/assets/clouds.webp"
      alt=""
      fill
      sizes="100vw"
      priority
      unoptimized
      className="object-cover"
      style={mirror ? { transform: "scaleY(-1)" } : undefined}
    />
  );
}

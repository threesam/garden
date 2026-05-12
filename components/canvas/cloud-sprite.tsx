import Image from "next/image";

interface CloudSpriteProps {
  /**
   * Flip the strip vertically so the darker gradient end meets the page
   * edge ("header" placement). Unmirrored renders dark-end-down, which
   * fits "footer" placements where the page edge sits below the strip.
   */
  mirror?: boolean;
}

// Static replacement for the live cloud shader in production builds.
// 3840×360 WebP (~13 KB) baked once by scripts/bake-clouds.mjs at t=0.
// The shader's sin(π·x) horizontal window already fades the strip's
// left/right edges to bg color, so this composites cleanly over any
// container without seams — no JS, no canvas, no per-frame work.
export function CloudSprite({ mirror = false }: CloudSpriteProps) {
  return (
    <Image
      src="/assets/clouds.webp"
      alt=""
      fill
      sizes="100vw"
      className="object-cover"
      style={mirror ? { transform: "scaleY(-1)" } : undefined}
    />
  );
}

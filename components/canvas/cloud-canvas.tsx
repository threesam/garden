import { CloudSprite } from "./cloud-sprite";
import { CloudCanvasDev } from "./cloud-canvas-dev";

interface CloudCanvasProps {
  /**
   * Flip the strip vertically so the gradient's darker end sits against
   * the page edge ("header" placement). Unmirrored leaves the darker end
   * at the bottom, fitting "footer" placements.
   */
  mirror?: boolean;
}

// Public entry. Dev renders the live WebGL shader (lazy-loaded so HMR
// stays snappy and the shader can be tuned in real time). Production
// renders a 3840×360 WebP baked from the shader — same gradient, same
// cloud layers, zero per-frame canvas work and ~13 KB on the wire.
// `process.env.NODE_ENV` is a build-time constant in Next.js, so the
// dev branch is dead-code-eliminated from the prod bundle.
export function CloudCanvas({ mirror = false }: CloudCanvasProps) {
  if (process.env.NODE_ENV === "development") {
    return <CloudCanvasDev mirror={mirror} />;
  }
  return <CloudSprite mirror={mirror} />;
}

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

// NODE_ENV is a build-time constant in Next.js, so the dev branch
// dead-code-eliminates from prod — the live shader and noise generator
// never enter the production runtime path.
export function CloudCanvas({ mirror = false }: CloudCanvasProps) {
  if (process.env.NODE_ENV === "development") {
    return <CloudCanvasDev mirror={mirror} />;
  }
  return <CloudSprite mirror={mirror} />;
}

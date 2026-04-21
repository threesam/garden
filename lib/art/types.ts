export interface SketchAPI {
  ctx: CanvasRenderingContext2D;
  w: number; // CSS pixels
  h: number; // CSS pixels
  dpr: number;
  rng: () => number; // deterministic seeded [0,1)
  noise: (x: number, y?: number, z?: number) => number; // seeded value noise [0,1]
  lerp: (a: number, b: number, t: number) => number;
  map: (v: number, a1: number, a2: number, b1: number, b2: number) => number;
  dist: (x1: number, y1: number, x2: number, y2: number) => number;
}

export interface SketchResult {
  tick?: (api: SketchAPI, frame: number) => void;
  cleanup?: () => void;
}

export interface Sketch {
  slug: string;
  title: string;
  date: string;
  // 2d sketches use the ctx directly; 3d sketches return three.js renderer via cleanup
  setup: (api: SketchAPI, canvas: HTMLCanvasElement) => SketchResult | void;
  // When true, host skips 2d setup (sketch manages its own canvas/context, e.g. webgl/three)
  manualCanvas?: boolean;
}

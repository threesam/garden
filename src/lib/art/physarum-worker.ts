/// <reference lib="webworker" />
//
// Physarum render loop, off the main thread.
//
// This worker is where the actual performance claim lives. Wasm alone does not
// improve Lighthouse — it adds a binary to fetch and compile. The win is that
// `OffscreenCanvas` plus a worker takes the main-thread cost of running this to
// zero; wasm is what makes the worker fast enough to be worth moving. Fast wasm
// on the main thread would still block.

export type SimName = 'physarum' | 'dicty';

interface WasmExports {
  memory: WebAssembly.Memory;
  physarum_init: (count: number, seed: number) => number;
  physarum_add_food: (x: number, y: number) => number;
  physarum_clear_food: () => void;
  physarum_vitality: () => number;
  physarum_food_left: () => number;
  physarum_alive: () => number;
  physarum_wall_buffer: () => number;
  physarum_apply_walls: () => void;
  physarum_clear_walls: () => void;
  physarum_walls_intact: () => number;
  dicty_init: (count: number, seed: number) => number;
  dicty_step: () => void;
  dicty_pixels: () => number;
  physarum_tune: (
    dist: number,
    sensorAngle: number,
    turnAngle: number,
    speed: number,
    deposit: number,
    decay: number,
    diffuse: number,
  ) => void;
  physarum_step: () => void;
  physarum_pixels: () => number;
  physarum_grid: () => number;
}

export interface StartMessage {
  type: 'start';
  canvas: OffscreenCanvas;
  sim: SimName;
  agents: number;
  seed: number;
  wasmUrl: string;
}

export type InboundMessage =
  | StartMessage
  | { type: 'switch'; sim: SimName; agents: number; seed: number }
  | { type: 'food'; x: number; y: number }
  | { type: 'clearFood' }
  | { type: 'contain'; text: string }
  | { type: 'release' }
  | { type: 'pause' }
  | { type: 'resume' };

let running = false;
let raf = 0;
/** Set by start(); the loop cannot be restarted from outside its own closure. */
let resumeLoop: (() => void) | null = null;
/** Set by start(); swaps which simulation the loop is stepping. */
let switchSim: ((sim: SimName, agents: number, seed: number) => void) | null = null;
let addFood: ((x: number, y: number) => void) | null = null;
let clearFood: (() => void) | null = null;
let contain: ((text: string) => void) | null = null;
let release: (() => void) | null = null;

async function start(msg: StartMessage): Promise<void> {
  const ctx = msg.canvas.getContext('2d');
  if (!ctx) {
    self.postMessage({ type: 'error', message: 'no 2d context on OffscreenCanvas' });
    return;
  }

  let exports: WasmExports;
  try {
    // instantiateStreaming compiles while the bytes are still arriving.
    const source = await WebAssembly.instantiateStreaming(fetch(msg.wasmUrl), {});
    exports = source.instance.exports as unknown as WasmExports;
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error) });
    return;
  }

  const grid = exports.physarum_grid();
  msg.canvas.width = grid;
  msg.canvas.height = grid;

  let step: () => void = exports.physarum_step;
  let image: ImageData;

  /**
   * (Re)initialise a simulation and REBUILD the pixel view.
   *
   * The rebuild is mandatory, not tidiness. Each sim owns its own buffers, so
   * initialising the second one allocates and wasm memory grows — and growing
   * detaches every TypedArray view the host is holding. Detached views do not
   * throw; they read zero, so a stale view renders a black canvas forever and
   * looks exactly like a broken simulation. The view is therefore derived fresh
   * from memory.buffer after every init call, never cached across one.
   */
  const load = (sim: SimName, agents: number, seed: number): void => {
    if (sim === 'dicty') {
      exports.dicty_init(agents, seed);
      step = exports.dicty_step;
      image = new ImageData(
        new Uint8ClampedArray(exports.memory.buffer, exports.dicty_pixels(), grid * grid * 4),
        grid,
        grid,
      );
    } else {
      exports.physarum_init(agents, seed);
      step = exports.physarum_step;
      image = new ImageData(
        new Uint8ClampedArray(exports.memory.buffer, exports.physarum_pixels(), grid * grid * 4),
        grid,
        grid,
      );
    }
  };

  load(msg.sim, msg.agents, msg.seed);
  switchSim = load;
  addFood = (x, y) => { exports.physarum_add_food(x, y); };
  clearFood = () => { exports.physarum_clear_food(); };
  release = () => { exports.physarum_clear_walls(); };

  /**
   * Rasterise text into the wall mask.
   *
   * Canvas `fillText` is available in a worker via OffscreenCanvas and does this
   * natively, so no text-layout dependency is pulled in. That would start to
   * earn its place if this ever needed real multiline paragraph layout; for a
   * word or two, measureText plus a scale-to-fit is the whole job.
   *
   * The colony is confined INSIDE the glyphs, so the mask is inverted: solid
   * everywhere the letters are not.
   */
  contain = (text: string) => {
    const mask = new OffscreenCanvas(grid, grid);
    const m = mask.getContext('2d', { willReadFrequently: true });
    if (!m) return;
    m.fillStyle = '#000';
    m.fillRect(0, 0, grid, grid);

    const words = text.trim().split(/\s+/).filter(Boolean).slice(0, 4);
    if (!words.length) return;
    const lineHeight = grid / (words.length + 0.6);

    m.fillStyle = '#fff';
    m.textAlign = 'center';
    m.textBaseline = 'middle';
    words.forEach((word, i) => {
      // Fit each line to the plate, then back off so glyphs are fat enough to
      // hold a colony — thin strokes leave no interior to live in.
      let size = lineHeight * 0.95;
      m.font = `900 ${String(size)}px ui-sans-serif, system-ui, sans-serif`;
      const w = m.measureText(word).width;
      if (w > grid * 0.92) size *= (grid * 0.92) / w;
      m.font = `900 ${String(size)}px ui-sans-serif, system-ui, sans-serif`;
      const y = lineHeight * (i + 0.8);
      m.fillText(word, grid / 2, y);
    });

    const px = m.getImageData(0, 0, grid, grid).data;
    const walls = new Uint8Array(exports.memory.buffer, exports.physarum_wall_buffer(), grid * grid);
    for (let i = 0; i < grid * grid; i++) {
      // Inverted: white glyph = open, everything else = wall.
      // noUncheckedIndexedAccess: the read is in range by construction, but the
      // compiler cannot see that through a DataView-backed array.
      walls[i] = (px[i * 4] ?? 0) > 127 ? 0 : 255;
    }
    exports.physarum_apply_walls();
  };

  let frames = 0;
  let lastReport = performance.now();
  running = true;

  const tick = (): void => {
    if (!running) return;
    step();
    ctx.putImageData(image, 0, 0);

    frames++;
    const now = performance.now();
    if (now - lastReport >= 1000) {
      self.postMessage({
        type: 'fps',
        fps: Math.round((frames * 1000) / (now - lastReport)),
        vitality: exports.physarum_vitality(),
        foodLeft: exports.physarum_food_left(),
        alive: exports.physarum_alive(),
        walls: exports.physarum_walls_intact(),
      });
      frames = 0;
      lastReport = now;
    }
    raf = requestAnimationFrame(tick);
  };
  resumeLoop = () => {
    running = true;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  self.postMessage({ type: 'ready', grid });
}

self.onmessage = (event: MessageEvent<InboundMessage>) => {
  const msg = event.data;
  if (msg.type === 'start') {
    void start(msg);
  } else if (msg.type === 'switch') {
    switchSim?.(msg.sim, msg.agents, msg.seed);
  } else if (msg.type === 'food') {
    addFood?.(msg.x, msg.y);
  } else if (msg.type === 'clearFood') {
    clearFood?.();
  } else if (msg.type === 'contain') {
    contain?.(msg.text);
  } else if (msg.type === 'release') {
    release?.();
  } else if (msg.type === 'pause') {
    running = false;
    cancelAnimationFrame(raf);
  } else if (!running) {
    // Only 'resume' is left in the union here, so testing msg.type again would
    // be a comparison that is always true.
    resumeLoop?.();
  }
};

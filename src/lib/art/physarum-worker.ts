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
  physarum_food_total: () => number;
  physarum_state: () => number;
  physarum_active: () => number;
  dicty_init: (count: number, seed: number) => number;
  dicty_step: () => void;
  dicty_pixels: () => number;
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
        flakes: exports.physarum_food_total(),
        state: exports.physarum_state(),
        agents: exports.physarum_active(),
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
  } else if (msg.type === 'pause') {
    running = false;
    cancelAnimationFrame(raf);
  } else if (!running) {
    // Only 'resume' is left in the union here, so testing msg.type again would
    // be a comparison that is always true.
    resumeLoop?.();
  }
};

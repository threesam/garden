/// <reference lib="webworker" />
//
// Physarum render loop, off the main thread.
//
// This worker is where the actual performance claim lives. Wasm alone does not
// improve Lighthouse — it adds a binary to fetch and compile. The win is that
// `OffscreenCanvas` plus a worker takes the main-thread cost of running this to
// zero; wasm is what makes the worker fast enough to be worth moving. Fast wasm
// on the main thread would still block.

interface WasmExports {
  memory: WebAssembly.Memory;
  physarum_init: (count: number, seed: number) => number;
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
  agents: number;
  seed: number;
  wasmUrl: string;
}

export type InboundMessage = StartMessage | { type: 'pause' } | { type: 'resume' };

let running = false;
let raf = 0;
/** Set by start(); the loop cannot be restarted from outside its own closure. */
let resumeLoop: (() => void) | null = null;

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

  exports.physarum_init(msg.agents, msg.seed);
  const grid = exports.physarum_grid();

  // Zero-copy view straight into wasm linear memory. Valid only because the
  // module allocates once and never grows — growing detaches every view
  // silently, and a detached view reads zero rather than throwing.
  const pixels = new Uint8ClampedArray(
    exports.memory.buffer,
    exports.physarum_pixels(),
    grid * grid * 4,
  );
  const image = new ImageData(pixels, grid, grid);

  msg.canvas.width = grid;
  msg.canvas.height = grid;

  let frames = 0;
  let lastReport = performance.now();
  running = true;

  const tick = (): void => {
    if (!running) return;
    exports.physarum_step();
    ctx.putImageData(image, 0, 0);

    frames++;
    const now = performance.now();
    if (now - lastReport >= 1000) {
      self.postMessage({ type: 'fps', fps: Math.round((frames * 1000) / (now - lastReport)) });
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
  } else if (msg.type === 'pause') {
    running = false;
    cancelAnimationFrame(raf);
  } else if (!running) {
    // Only 'resume' is left in the union here, so testing msg.type again would
    // be a comparison that is always true.
    resumeLoop?.();
  }
};

type WaveFunction = (
  x: number,
  y: number,
  time: number,
  audioLevel: number,
) => number;

export interface GardenMathApi {
  wave: WaveFunction;
}

const jsFallback: GardenMathApi = {
  wave: (x, y, time, audioLevel) => {
    const waveA = Math.sin(x * 1.7 + time * 0.7);
    const waveB = Math.cos(y * 1.9 - time * 0.55);
    return (waveA + waveB) * (0.35 + audioLevel * 0.5);
  },
};

let apiPromise: Promise<GardenMathApi> | null = null;

async function loadWasmApi(): Promise<GardenMathApi> {
  if (typeof window === "undefined") {
    return jsFallback;
  }

  const response = await fetch("/wasm/garden_math.wasm", { cache: "no-store" });
  if (!response.ok) throw new Error("WASM module not found");

  const bytes = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const wasmExports = instance.exports as Record<string, unknown>;
  const wave = wasmExports.wave;

  if (typeof wave !== "function") {
    throw new Error("WASM export `wave` missing");
  }

  return {
    wave: (x, y, time, audioLevel) =>
      Number((wave as CallableFunction)(x, y, time, audioLevel)),
  };
}

export async function loadGardenMathApi(): Promise<GardenMathApi> {
  if (!apiPromise) {
    apiPromise = loadWasmApi().catch(() => jsFallback);
  }
  return apiPromise;
}

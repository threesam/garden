type WaveFunction = (
  x: number,
  y: number,
  time: number,
  audioLevel: number,
) => number;

type CloudFunction = (x: number, y: number, time: number, layer: number) => number;

export interface GardenMathApi {
  wave: WaveFunction;
  cloud_density: CloudFunction;
}

const jsFallback: GardenMathApi = {
  wave: (x, y, time, audioLevel) => {
    const waveA = Math.sin(x * 1.7 + time * 0.7);
    const waveB = Math.cos(y * 1.9 - time * 0.55);
    return (waveA + waveB) * (0.35 + audioLevel * 0.5);
  },
  cloud_density: (x, y, time, _layer) => {
    const drift = time * 0.03;
    const n = Math.sin(x * 3 + drift) * Math.cos(y * 2) * 0.5 + 0.5;
    return Math.max(0, (n - 0.35) * 3.5) ** 2;
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
  const cloud_density = wasmExports.cloud_density;

  if (typeof wave !== "function" || typeof cloud_density !== "function") {
    throw new Error("WASM exports missing");
  }

  return {
    wave: (x, y, time, audioLevel) =>
      Number((wave as CallableFunction)(x, y, time, audioLevel)),
    cloud_density: (x, y, time, layer) =>
      Number((cloud_density as CallableFunction)(x, y, time, layer)),
  };
}

export async function loadGardenMathApi(): Promise<GardenMathApi> {
  if (!apiPromise) {
    apiPromise = loadWasmApi().catch(() => jsFallback);
  }
  return apiPromise;
}

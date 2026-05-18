import type { Action } from 'svelte/action';
import { compileShader } from '$lib/canvas/gl-utils';
import { parseHex } from '$lib/canvas/color';

// ─── GLSL ────────────────────────────────────────────────────────────────────

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

// Live shader — 3 texture lookups/pixel instead of 64 hash calls.
// Pre-baked noise texture is tileable Perlin fbm; sampling it at
// fract(uv * scale + offset) with REPEAT wrap = seamless drift.
const FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uTopColor;
  uniform vec3 uBotColor;
  uniform sampler2D uNoise;

  varying vec2 vUv;

  float cloudDensity(vec2 uv, float scale, vec2 offset, float threshold) {
    float n = texture2D(uNoise, uv * scale + offset).r;
    float shaped = clamp((n - threshold) * 3.0, 0.0, 1.0);
    return shaped * shaped;
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);

    float fade = uv.y;
    float easedFade = fade * fade;
    vec3 base = mix(uTopColor, uBotColor, easedFade);

    float cloudWindow = sin(uv.y * 3.14159265) * sin(vUv.x * 3.14159265);

    float baseSpeed = 0.005;
    float t = uTime * baseSpeed;

    // Layer A: pink, deep background
    float dA = cloudDensity(uv, 0.25, vec2(t * 1.0 * 0.25 + 0.137, 0.241), 0.32);
    float iA = dA * cloudWindow * 0.45;
    vec3 colA = vec3(230.0, 100.0, 140.0) / 255.0;
    base = mix(base, colA, iA);

    // Layer B: orange, midground
    float dB = cloudDensity(uv, 0.5, vec2(t * 3.0 * 0.5 + 0.274, 0.482), 0.32);
    float iB = dB * cloudWindow * 0.45;
    vec3 colB = vec3(235.0, 150.0, 50.0) / 255.0;
    base = mix(base, colB, iB);

    // Layer C: yellow, foreground
    float dC = cloudDensity(uv, 1.0, vec2(t * 6.0 * 1.0 + 0.411, 0.723), 0.32);
    float iC = dC * cloudWindow * 0.45;
    vec3 colC = vec3(250.0, 220.0, 60.0) / 255.0;
    base = mix(base, colC, iC);

    gl_FragColor = vec4(base, 1.0);
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const NOISE_SIZE = 256;
// 0.75 keeps the offscreen-to-display upscale at 1.33×; faster than 0.5
// because the wider ratio pushes Chrome onto a slower drawImage path.
const RENDER_SCALE = 0.75;
// 15 Hz render cadence: eye can't distinguish from 60 fps for this slow
// content, but per-second cost drops to a third of a 30 fps cadence.
const MIN_FRAME_INTERVAL = 66;

// ─── Noise generation ────────────────────────────────────────────────────────

function buildTileableFbmTexture(size: number): Uint8Array {
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  let seed = 1337;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];

  function grad(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    const a = (h & 1) === 0 ? u : -u;
    const b = (h & 2) === 0 ? v : -v;
    return a + b;
  }

  function fadeCurve(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a: number, b: number, t: number) {
    return a + t * (b - a);
  }

  function perlin(x: number, y: number, period: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const px = ((xi % period) + period) % period;
    const py = ((yi % period) + period) % period;
    const px1 = (px + 1) % period;
    const py1 = (py + 1) % period;
    const fx = x - xi;
    const fy = y - yi;
    const aa = grad(perm[(perm[px] + py) & 255], fx, fy);
    const ba = grad(perm[(perm[px1] + py) & 255], fx - 1, fy);
    const ab = grad(perm[(perm[px] + py1) & 255], fx, fy - 1);
    const bb = grad(perm[(perm[px1] + py1) & 255], fx - 1, fy - 1);
    const u = fadeCurve(fx);
    const v = fadeCurve(fy);
    return Math.max(0, Math.min(1, lerp(lerp(aa, ba, u), lerp(ab, bb, u), v) * 0.5 + 0.5));
  }

  function fbm(x: number, y: number, basePeriod: number, octaves: number) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * perlin(x * frequency, y * frequency, basePeriod * frequency);
      amplitude *= 0.5;
      frequency *= 2;
    }
    return Math.max(0, Math.min(1, value));
  }

  const data = new Uint8Array(size * size);
  const NOISE_CELLS = 8;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * NOISE_CELLS;
      const ny = (y / size) * NOISE_CELLS;
      data[y * size + x] = Math.floor(fbm(nx, ny, NOISE_CELLS, 4) * 255);
    }
  }
  return data;
}

// ─── Shared WebGL pipeline ────────────────────────────────────────────────────

interface SubscriberEntry {
  ctx: CanvasRenderingContext2D | null;
  visible: boolean;
  /** Cached layout size refreshed by ResizeObserver — avoids per-frame layout reads. */
  w: number;
  h: number;
  ro: ResizeObserver;
}

class CloudPipeline {
  private gl: WebGLRenderingContext | null = null;
  private offscreen: HTMLCanvasElement | null = null;
  private program: WebGLProgram | null = null;
  private vert: WebGLShader | null = null;
  private frag: WebGLShader | null = null;
  private buf: WebGLBuffer | null = null;
  private noiseTex: WebGLTexture | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private subscribers = new Map<HTMLCanvasElement, SubscriberEntry>();
  private rafId = 0;
  private startTime = 0;
  private lastRender = 0;

  subscribe(canvas: HTMLCanvasElement) {
    if (!this.gl) {
      if (!this.init()) return () => {};
    }
    const ctx = canvas.getContext('2d');
    const entry: SubscriberEntry = {
      ctx,
      visible: true,
      w: canvas.offsetWidth,
      h: canvas.offsetHeight,
      ro: new ResizeObserver(() => {
        entry.w = canvas.offsetWidth;
        entry.h = canvas.offsetHeight;
      }),
    };
    entry.ro.observe(canvas);
    this.subscribers.set(canvas, entry);
    this.maybeStart();
    return () => {
      const e = this.subscribers.get(canvas);
      if (e) e.ro.disconnect();
      this.subscribers.delete(canvas);
      if (this.subscribers.size === 0) this.teardown();
    };
  }

  setVisibility(canvas: HTMLCanvasElement, visible: boolean) {
    const entry = this.subscribers.get(canvas);
    if (!entry) return;
    entry.visible = visible;
    if (visible) this.maybeStart();
  }

  private init(): boolean {
    this.startTime = performance.now();
    this.lastRender = 0;
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = 1;
    this.offscreen.height = 1;

    const gl = this.offscreen.getContext('webgl', {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) return false;
    this.gl = gl;

    this.vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    this.frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!this.vert || !this.frag) return false;

    const program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, this.vert);
    gl.attachShader(program, this.frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Cloud program link failed:', gl.getProgramInfoLog(program));
      return false;
    }
    this.program = program;
    gl.useProgram(program);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    this.uTime = gl.getUniformLocation(program, 'uTime');
    const uTopColor = gl.getUniformLocation(program, 'uTopColor');
    const uBotColor = gl.getUniformLocation(program, 'uBotColor');
    const uNoise = gl.getUniformLocation(program, 'uNoise');

    const rootStyle = getComputedStyle(document.documentElement);
    const whiteColor = parseHex(rootStyle.getPropertyValue('--white').trim() || '#f5f4f0');
    const blackColor = parseHex(rootStyle.getPropertyValue('--black').trim() || '#1a1a14');
    gl.uniform3fv(uTopColor, whiteColor);
    gl.uniform3fv(uBotColor, blackColor);

    // Pre-bake tileable Perlin fbm — ~50ms one-shot CPU work to replace
    // billions of live GPU hash ops. pixelStorei avoids padding errors on
    // R8 rows not divisible by 4.
    this.noiseTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const noiseData = buildTileableFbmTexture(NOISE_SIZE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      NOISE_SIZE,
      NOISE_SIZE,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      noiseData,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(uNoise, 0);

    return true;
  }

  private teardown() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.vert) this.gl.deleteShader(this.vert);
      if (this.frag) this.gl.deleteShader(this.frag);
      if (this.buf) this.gl.deleteBuffer(this.buf);
      if (this.noiseTex) this.gl.deleteTexture(this.noiseTex);
    }
    this.gl = null;
    this.offscreen = null;
    this.program = null;
    this.vert = null;
    this.frag = null;
    this.buf = null;
    this.noiseTex = null;
    this.uTime = null;
  }

  private hasVisibleSubscriber() {
    for (const entry of this.subscribers.values()) {
      if (entry.visible) return true;
    }
    return false;
  }

  private maybeStart() {
    if (this.rafId) return;
    if (!this.hasVisibleSubscriber()) return;
    this.rafId = requestAnimationFrame(this.render);
  }

  private syncOffscreenSize() {
    if (!this.gl || !this.offscreen) return;
    let maxW = 0;
    let maxH = 0;
    for (const [, entry] of this.subscribers) {
      if (!entry.visible) continue;
      if (entry.w > maxW) maxW = entry.w;
      if (entry.h > maxH) maxH = entry.h;
    }
    const w = Math.max(1, Math.round(maxW * RENDER_SCALE));
    const h = Math.max(1, Math.round(maxH * RENDER_SCALE));
    if (this.offscreen.width !== w || this.offscreen.height !== h) {
      this.offscreen.width = w;
      this.offscreen.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  private render = (now: number) => {
    this.rafId = 0;
    if (!this.hasVisibleSubscriber() || !this.gl || !this.uTime || !this.offscreen) return;

    if (now - this.lastRender >= MIN_FRAME_INTERVAL) {
      this.syncOffscreenSize();
      const time = (now - this.startTime) / 1000;
      this.gl.uniform1f(this.uTime, time);
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
      this.lastRender = now;

      for (const [canvas, entry] of this.subscribers) {
        if (!entry.visible || !entry.ctx) continue;
        const { w, h } = entry;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        entry.ctx.drawImage(this.offscreen, 0, 0, w, h);
      }
    }

    this.rafId = requestAnimationFrame(this.render);
  };
}

// Module-level singleton — shared across all CloudCanvas instances.
const pipeline = new CloudPipeline();

// ─── Svelte action ────────────────────────────────────────────────────────────

export interface CloudShaderOptions {
  mirror?: boolean;
}

export const cloudShader: Action<HTMLCanvasElement, CloudShaderOptions | undefined> = (
  node,
) => {
  const unsubscribe = pipeline.subscribe(node);

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry) pipeline.setVisibility(node, entry.isIntersecting);
    },
    { threshold: 0 },
  );
  io.observe(node);

  return {
    destroy() {
      io.disconnect();
      unsubscribe();
    },
  };
};

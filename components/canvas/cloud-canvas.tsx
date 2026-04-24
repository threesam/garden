"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

// Sin-free hash (Dave Hoskins variant). The classic
// fract(sin(dot(p, ...)) * big) calls sin() 64× per pixel (4 layers ×
// 4 octaves × 4 corner samples) and sin compiles to a multi-cycle
// transcendental op. This variant uses only mul / add / fract — all
// single-cycle on modern GPUs. The vec3 lift keeps the operands small
// even at the fbm's highest octave, where the simpler IQ hash develops
// visible tiling artifacts.
const FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uTopColor;
  uniform vec3 uBotColor;

  varying vec2 vUv;

  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 s = f * f * (3.0 - 2.0 * f);

    float n00 = hash(i);
    float n10 = hash(i + vec2(1.0, 0.0));
    float n01 = hash(i + vec2(0.0, 1.0));
    float n11 = hash(i + vec2(1.0, 1.0));

    float nx0 = n00 + s.x * (n10 - n00);
    float nx1 = n01 + s.x * (n11 - n01);

    return nx0 + s.y * (nx1 - nx0);
  }

  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      value += amplitude * smoothNoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  float cloudDensity(vec2 uv, float time, float speed, float scale, float yScale, int octaves, float threshold, float seedX, float seedY) {
    // Negative drift so sampling walks in -p.x over time; visually that
    // translates to cloud features moving in +x (left → right).
    float drift = -time * speed * scale;
    vec2 p = vec2(uv.x * scale + drift + seedX, uv.y * yScale + seedY);
    float n = fbm(p, octaves);
    float shaped = clamp((n - threshold) * 3.0, 0.0, 1.0);
    return shaped * shaped;
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float fade = uv.y;

    // Quadratic ease — tighter transition near the lighter end.
    float easedFade = fade * fade;

    vec3 base = mix(uTopColor, uBotColor, easedFade);
    float cloudWindow = sin(fade * 3.14159265);
    float cloudTime = uTime;

    float baseSpeed = 0.01;

    // Layer 0: red, deep background (1x speed)
    float d0 = cloudDensity(uv, cloudTime, baseSpeed, 2.0, 1.2, 4, 0.32, 0.0, 0.0);
    float i0 = d0 * cloudWindow * 0.35;
    vec3 col0 = vec3(190.0, 50.0, 60.0) / 255.0;
    base = mix(base, col0, i0);

    // Layer 1: pink (2x speed)
    float d1 = cloudDensity(uv, cloudTime, baseSpeed * 2.0, 2.8, 1.6, 4, 0.32, 137.0, 241.0);
    float i1 = d1 * cloudWindow * 0.35;
    vec3 col1 = vec3(230.0, 100.0, 140.0) / 255.0;
    base = mix(base, col1, i1);

    // Layer 2: orange (3x speed)
    float d2 = cloudDensity(uv, cloudTime, baseSpeed * 3.0, 3.8, 2.2, 4, 0.32, 274.0, 482.0);
    float i2 = d2 * cloudWindow * 0.35;
    vec3 col2 = vec3(235.0, 150.0, 50.0) / 255.0;
    base = mix(base, col2, i2);

    // Layer 3: yellow, foreground (4x speed)
    float d3 = cloudDensity(uv, cloudTime, baseSpeed * 4.0, 5.0, 3.0, 4, 0.32, 411.0, 723.0);
    float i3 = d3 * cloudWindow * 0.35;
    vec3 col3 = vec3(250.0, 220.0, 60.0) / 255.0;
    base = mix(base, col3, i3);

    gl_FragColor = vec4(base, 1.0);
  }
`;

const RENDER_SCALE = 0.5;
const MIN_FRAME_INTERVAL = 33; // ~30fps; clouds drift slowly enough that 60fps is wasted.

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function parseHex(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

interface SubscriberEntry {
  ctx: CanvasRenderingContext2D | null;
  visible: boolean;
}

/**
 * Module-level shared cloud pipeline. One offscreen WebGL canvas runs the
 * fragment shader once per frame; every mounted CloudCanvas subscriber
 * gets a 2D drawImage of that single render. Halves cloud GPU cost on the
 * homepage (was: two independent WebGL contexts each running the full
 * fbm shader; now: one shader run, two cheap blits).
 */
class CloudPipeline {
  private gl: WebGLRenderingContext | null = null;
  private offscreen: HTMLCanvasElement | null = null;
  private program: WebGLProgram | null = null;
  private vert: WebGLShader | null = null;
  private frag: WebGLShader | null = null;
  private buf: WebGLBuffer | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private subscribers = new Map<HTMLCanvasElement, SubscriberEntry>();
  private rafId = 0;
  private startTime = 0;
  private lastRender = 0;

  subscribe(canvas: HTMLCanvasElement) {
    if (!this.gl) {
      if (!this.init()) return () => {};
    }
    const ctx = canvas.getContext("2d");
    this.subscribers.set(canvas, { ctx, visible: true });
    this.maybeStart();

    return () => {
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
    this.offscreen = document.createElement("canvas");
    this.offscreen.width = 1;
    this.offscreen.height = 1;

    // preserveDrawingBuffer so a 2D drawImage from this canvas reliably
    // sees the latest WebGL contents — without it, WebGL is allowed to
    // clear the buffer between frames and the blit would catch garbage.
    const gl = this.offscreen.getContext("webgl", {
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
      console.error("Cloud program link failed:", gl.getProgramInfoLog(program));
      return false;
    }
    this.program = program;
    gl.useProgram(program);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    this.uTime = gl.getUniformLocation(program, "uTime");
    const uTopColor = gl.getUniformLocation(program, "uTopColor");
    const uBotColor = gl.getUniformLocation(program, "uBotColor");

    // Pull palette from the document root so theme tokens flow through.
    const rootStyle = getComputedStyle(document.documentElement);
    const whiteColor = parseHex(rootStyle.getPropertyValue("--white").trim() || "#f5f4f0");
    const blackColor = parseHex(rootStyle.getPropertyValue("--black").trim() || "#1a1a14");
    gl.uniform3fv(uTopColor, whiteColor);
    gl.uniform3fv(uBotColor, blackColor);

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
    }
    this.gl = null;
    this.offscreen = null;
    this.program = null;
    this.vert = null;
    this.frag = null;
    this.buf = null;
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
    // Size the offscreen from the largest visible subscriber so its blit
    // never has to upscale. Smaller subscribers downscale via drawImage,
    // which is cheap and visually fine for soft cloud noise.
    let maxW = 0;
    let maxH = 0;
    for (const [canvas, entry] of this.subscribers) {
      if (!entry.visible) continue;
      if (canvas.offsetWidth > maxW) maxW = canvas.offsetWidth;
      if (canvas.offsetHeight > maxH) maxH = canvas.offsetHeight;
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

      // Blit to each visible subscriber. drawImage handles scaling, so
      // subscribers can be any size and the offscreen is rendered at
      // the largest of them (×0.5 for the existing render-scale win).
      for (const [canvas, entry] of this.subscribers) {
        if (!entry.visible || !entry.ctx) continue;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
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

const pipeline = new CloudPipeline();

interface CloudCanvasProps {
  /**
   * CSS-flip the canvas vertically. Use for the "top" placement so the
   * sky gradient goes dark-at-page-edge → light-toward-content; bottom
   * placement (no mirror) does the opposite. The shader output is
   * identical in both — only the paint direction changes.
   */
  mirror?: boolean;
}

export function CloudCanvas({ mirror = false }: CloudCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const unsubscribe = pipeline.subscribe(canvas);

    const observer = new IntersectionObserver(
      ([entry]) => pipeline.setVisibility(canvas, entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={mirror ? { transform: "scaleY(-1)" } : undefined}
    />
  );
}

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

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform float uInvert;
  uniform vec3 uTopColor;
  uniform vec3 uBotColor;

  varying vec2 vUv;

  // --- hash & FBM ---

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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
    float drift = time * speed * scale;
    vec2 p = vec2(uv.x * scale + drift + seedX, uv.y * yScale + seedY);
    float n = fbm(p, octaves);
    float shaped = clamp((n - threshold) * 3.0, 0.0, 1.0);
    return shaped * shaped;
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float fade = uv.y;

    float easedFade = uInvert > 0.5
      ? 1.0 - (1.0 - fade) * (1.0 - fade)
      : fade * fade;

    vec3 base = mix(uTopColor, uBotColor, easedFade);
    float cloudWindow = sin(fade * 3.14159265);
    float cloudTime = uInvert > 0.5 ? -uTime : uTime;

    float baseSpeed = 0.01;

    // Layer 0: red, deep background (1x speed)
    float d0 = cloudDensity(uv, cloudTime, baseSpeed, 2.0, 1.2, 6, 0.32, 0.0, 0.0);
    float i0 = d0 * cloudWindow * 0.35;
    vec3 col0 = vec3(190.0, 50.0, 60.0) / 255.0;
    base = mix(base, col0, i0);

    // Layer 1: pink (2x speed)
    float d1 = cloudDensity(uv, cloudTime, baseSpeed * 2.0, 2.8, 1.6, 6, 0.32, 137.0, 241.0);
    float i1 = d1 * cloudWindow * 0.35;
    vec3 col1 = vec3(230.0, 100.0, 140.0) / 255.0;
    base = mix(base, col1, i1);

    // Layer 2: orange (3x speed)
    float d2 = cloudDensity(uv, cloudTime, baseSpeed * 3.0, 3.8, 2.2, 6, 0.32, 274.0, 482.0);
    float i2 = d2 * cloudWindow * 0.35;
    vec3 col2 = vec3(235.0, 150.0, 50.0) / 255.0;
    base = mix(base, col2, i2);

    // Layer 3: yellow, foreground (4x speed)
    float d3 = cloudDensity(uv, cloudTime, baseSpeed * 4.0, 5.0, 3.0, 6, 0.32, 411.0, 723.0);
    float i3 = d3 * cloudWindow * 0.35;
    vec3 col3 = vec3(250.0, 220.0, 60.0) / 255.0;
    base = mix(base, col3, i3);

    gl_FragColor = vec4(base, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
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

interface CloudCanvasProps {
  invert?: boolean;
}

function parseHex(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function CloudCanvas({ invert = false }: CloudCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    let raf: number;
    let visible = true;
    const startTime = performance.now();

    const style = getComputedStyle(canvas);
    const whiteColor = parseHex(
      style.getPropertyValue("--white").trim() || "#f5f4f0",
    );
    const blackColor = parseHex(
      style.getPropertyValue("--black").trim() || "#1a1a14",
    );

    const topColor = invert ? blackColor : whiteColor;
    const botColor = invert ? whiteColor : blackColor;

    // Compile shaders & link program
    const vert = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vert || !frag) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full-screen quad
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(program, "uTime");
    const uInvert = gl.getUniformLocation(program, "uInvert");
    const uTopColor = gl.getUniformLocation(program, "uTopColor");
    const uBotColor = gl.getUniformLocation(program, "uBotColor");

    gl.uniform1f(uInvert, invert ? 1.0 : 0.0);
    gl.uniform3fv(uTopColor, topColor);
    gl.uniform3fv(uBotColor, botColor);

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener("resize", resize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    function render(now: number) {
      raf = requestAnimationFrame(render);
      if (!visible) return;

      const time = (now - startTime) / 1000;
      gl!.uniform1f(uTime, time);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buf);
    };
  }, [invert]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
    />
  );
}

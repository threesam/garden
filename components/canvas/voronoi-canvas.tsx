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
  uniform vec2 uResolution;
  uniform vec3 uTopColor;
  uniform vec3 uBotColor;

  varying vec2 vUv;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  // Returns (F1 distance, F2 distance, cell id)
  vec3 voronoi(vec2 p) {
    vec2 ip = floor(p);
    vec2 fp = fract(p);

    float d1 = 8.0;
    float d2 = 8.0;
    float id = 0.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 o = hash2(ip + neighbor);
        // Animate cell centers
        o = 0.5 + 0.4 * sin(uTime * 0.4 + 6.2831 * o);
        vec2 diff = neighbor + o - fp;
        float dist = length(diff);

        if (dist < d1) {
          d2 = d1;
          d1 = dist;
          id = dot(ip + neighbor, vec2(7.0, 113.0));
        } else if (dist < d2) {
          d2 = dist;
        }
      }
    }

    return vec3(d1, d2, id);
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float aspect = uResolution.x / uResolution.y;

    // Scale UV for voronoi — more cells horizontally
    vec2 p = vec2(uv.x * aspect, uv.y) * 5.0;

    // Two layers at different scales for depth
    vec3 v1 = voronoi(p);
    vec3 v2 = voronoi(p * 2.0 + 50.0);

    // Edge detection from F2 - F1
    float edge1 = smoothstep(0.0, 0.08, v1.y - v1.x);
    float edge2 = smoothstep(0.0, 0.06, v2.y - v2.x);

    // Cell shading from F1
    float cell1 = smoothstep(0.0, 0.6, v1.x);
    float cell2 = smoothstep(0.0, 0.5, v2.x);

    // Background gradient
    float fade = uv.y;
    float easedFade = uInvert > 0.5
      ? 1.0 - (1.0 - fade) * (1.0 - fade)
      : fade * fade;
    vec3 base = mix(uTopColor, uBotColor, easedFade);

    // Color palette
    vec3 warm1 = vec3(200.0, 60.0, 80.0) / 255.0;   // red-pink
    vec3 warm2 = vec3(230.0, 130.0, 60.0) / 255.0;   // orange
    vec3 warm3 = vec3(245.0, 210.0, 70.0) / 255.0;   // yellow

    // Color cells by their id
    float hue1 = fract(v1.z * 0.0671);
    vec3 cellColor1 = mix(warm1, mix(warm2, warm3, smoothstep(0.3, 0.7, hue1)), smoothstep(0.0, 0.3, hue1));

    float hue2 = fract(v2.z * 0.0671);
    vec3 cellColor2 = mix(warm1, mix(warm2, warm3, smoothstep(0.3, 0.7, hue2)), smoothstep(0.0, 0.3, hue2));

    // Compose: cells tinted, edges dark
    vec3 layer1 = mix(cellColor1 * 0.3, cellColor1, edge1) * (0.6 + cell1 * 0.4);
    vec3 layer2 = mix(cellColor2 * 0.3, cellColor2, edge2) * (0.6 + cell2 * 0.4);

    // Blend layers onto background
    float window = sin(fade * 3.14159265);
    base = mix(base, layer1, window * 0.4);
    base = mix(base, layer2, window * 0.2);

    // Subtle edge lines
    float edgeLine = (1.0 - edge1) * 0.15 + (1.0 - edge2) * 0.08;
    base -= edgeLine * window;

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

interface VoronoiCanvasProps {
  invert?: boolean;
}

function parseHex(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function VoronoiCanvas({ invert = false }: VoronoiCanvasProps) {
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

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uInvert = gl.getUniformLocation(program, "uInvert");
    const uResolution = gl.getUniformLocation(program, "uResolution");
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
      gl!.uniform2f(uResolution, canvas.width, canvas.height);
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

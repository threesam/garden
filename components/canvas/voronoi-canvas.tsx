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

  uniform float uInvert;
  uniform float uInfluence;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec3 uTopColor;
  uniform vec3 uBotColor;

  varying vec2 vUv;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  vec3 voronoi(vec2 p, vec2 mouse, float influence) {
    vec2 ip = floor(p);
    vec2 fp = fract(p);

    float d1 = 8.0;
    float d2 = 8.0;
    float id = 0.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 o = hash2(ip + neighbor);

        // Static cell centers — gently push away from mouse
        vec2 cellWorld = ip + neighbor + o;
        vec2 toMouse = cellWorld - mouse;
        float mouseDist = length(toMouse);
        float push = influence * smoothstep(5.0, 0.0, mouseDist) * 0.2;
        o += normalize(toMouse + 0.001) * push;

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

    vec2 p = vec2(uv.x * aspect, uv.y) * 7.0;
    vec2 mouse = vec2(uMouse.x * aspect, uMouse.y) * 7.0;

    vec3 v1 = voronoi(p, mouse, uInfluence);

    float edge1 = smoothstep(0.0, 0.08, v1.y - v1.x);
    float cell1 = smoothstep(0.0, 0.6, v1.x);

    // Monochromatic
    vec3 light = uInvert > 0.5 ? uBotColor : uTopColor;
    vec3 dark = uInvert > 0.5 ? uTopColor : uBotColor;
    vec3 cellColor = mix(dark, light, cell1);
    vec3 layer1 = mix(cellColor * 0.7, cellColor, edge1);

    // Background gradient
    float fade = uv.y;
    float easedFade = uInvert > 0.5
      ? 1.0 - (1.0 - fade) * (1.0 - fade)
      : fade * fade;
    vec3 base = mix(uTopColor, uBotColor, easedFade);

    float window = sin(fade * 3.14159265);
    base = mix(base, layer1, window * 0.4);

    float edgeLine = (1.0 - edge1) * 0.15;
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
    let hovering = false;
    let dragging = false;
    let influence = 0;
    const mouseUv = { x: -10, y: -10 };
    const smoothMouse = { x: -10, y: -10 };

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

    const uInvert = gl.getUniformLocation(program, "uInvert");
    const uInfluence = gl.getUniformLocation(program, "uInfluence");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uTopColor = gl.getUniformLocation(program, "uTopColor");
    const uBotColor = gl.getUniformLocation(program, "uBotColor");

    gl.uniform1f(uInvert, invert ? 1.0 : 0.0);
    gl.uniform3fv(uTopColor, topColor);
    gl.uniform3fv(uBotColor, botColor);

    function updateMouseUv(e: MouseEvent | Touch) {
      const rect = canvas!.getBoundingClientRect();
      mouseUv.x = (e.clientX - rect.left) / rect.width;
      mouseUv.y = 1.0 - (e.clientY - rect.top) / rect.height;
    }

    const onMouseEnter = () => { hovering = true; };
    const onMouseLeave = () => { hovering = false; dragging = false; };
    const onMouseMove = (e: MouseEvent) => updateMouseUv(e);
    const onMouseDown = () => { dragging = true; };
    const onMouseUp = () => { dragging = false; };
    const onTouchStart = (e: TouchEvent) => {
      hovering = true; dragging = true;
      if (e.touches[0]) updateMouseUv(e.touches[0]);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updateMouseUv(e.touches[0]);
    };
    const onTouchEnd = () => { hovering = false; dragging = false; };

    canvas.addEventListener("mouseenter", onMouseEnter);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

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
      ([entry]) => { visible = entry.isIntersecting; },
      { threshold: 0 },
    );
    observer.observe(canvas);

    let needsRender = true;

    function render() {
      raf = requestAnimationFrame(render);
      if (!visible) return;

      const targetInfluence = (hovering || dragging) ? 1.0 : 0.0;
      const prevInfluence = influence;
      influence += (targetInfluence - influence) * 0.08;
      if (Math.abs(influence) < 0.001) influence = 0;

      const prevMx = smoothMouse.x;
      const prevMy = smoothMouse.y;
      smoothMouse.x += (mouseUv.x - smoothMouse.x) * 0.1;
      smoothMouse.y += (mouseUv.y - smoothMouse.y) * 0.1;

      const changed = Math.abs(influence - prevInfluence) > 0.0005
        || Math.abs(smoothMouse.x - prevMx) > 0.0005
        || Math.abs(smoothMouse.y - prevMy) > 0.0005;

      if (changed || needsRender) {
        needsRender = false;
        gl!.uniform1f(uInfluence, influence);
        gl!.uniform2f(uMouse, smoothMouse.x, smoothMouse.y);
        gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      }
    }

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseenter", onMouseEnter);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
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

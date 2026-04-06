"use client";

import { useEffect, useRef } from "react";

const NUM_BALLS = 12;
const PIXEL_SIZE = 6.0;

const VERT = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uBalls[${NUM_BALLS}];
  uniform float uRadii[${NUM_BALLS}];

  varying vec2 vUv;

  void main() {
    vec2 pixel = vec2(${PIXEL_SIZE.toFixed(1)});
    vec2 coord = floor(vUv * uResolution / pixel) * pixel + pixel * 0.5;

    float sum = 0.0;
    for (int i = 0; i < ${NUM_BALLS}; i++) {
      vec2 d = coord - uBalls[i];
      float r = uRadii[i];
      sum += (r * r) / dot(d, d);
    }

    if (sum > 1.0) {
      float intensity = clamp(sum - 1.0, 0.0, 1.0);
      vec3 color = vec3(232.0 / 255.0, 163.0 / 255.0, 23.0 / 255.0);
      float alpha = (180.0 + intensity * 75.0) / 255.0;
      gl_FragColor = vec4(color * alpha, alpha);
    } else {
      gl_FragColor = vec4(0.0);
    }
  }
`;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  return s;
}

export function MetaballCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPosition");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "uTime");
    const uRes = gl.getUniformLocation(prog, "uResolution");
    const uBalls: (WebGLUniformLocation | null)[] = [];
    const uRadii: (WebGLUniformLocation | null)[] = [];
    for (let i = 0; i < NUM_BALLS; i++) {
      uBalls.push(gl.getUniformLocation(prog, `uBalls[${i}]`));
      uRadii.push(gl.getUniformLocation(prog, `uRadii[${i}]`));
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let w = 0, h = 0;
    let rectLeft = 0, rectTop = 0;
    let pointerX = -1, pointerY = -1;
    let pointerActive = false;
    const balls: Ball[] = [];

    function resize() {
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w;
      canvas!.height = h;
      gl!.viewport(0, 0, w, h);
      const rect = canvas!.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      for (const b of balls) {
        b.x = Math.min(b.x, w);
        b.y = Math.min(b.y, h);
      }
    }

    function initBalls() {
      balls.length = 0;
      const scale = Math.max(w, h);
      const rMin = scale * 0.024;
      const rRange = scale * 0.048;
      for (let i = 0; i < NUM_BALLS; i++) {
        balls.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: rMin + Math.random() * rRange,
        });
      }
    }

    function updatePointer(clientX: number, clientY: number) {
      pointerX = clientX - rectLeft;
      pointerY = clientY - rectTop;
      pointerActive = true;
    }

    function onMouseMove(e: MouseEvent) { updatePointer(e.clientX, e.clientY); }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
    }
    function onPointerLeave() { pointerActive = false; }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onPointerLeave);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onPointerLeave);

    let raf = 0;
    const t0 = performance.now();

    function tick() {
      const t = (performance.now() - t0) / 1000;

      for (const b of balls) {
        if (pointerActive) {
          const dx = pointerX - b.x;
          const dy = pointerY - b.y;
          b.vx += dx * 0.002;
          b.vy += dy * 0.002;
        }

        b.x += b.vx;
        b.y += b.vy;
        b.vx *= pointerActive ? 0.96 : 0.99;
        b.vy *= pointerActive ? 0.96 : 0.99;
        if (b.x < 0 || b.x > w) b.vx *= -1;
        if (b.y < 0 || b.y > h) b.vy *= -1;
      }

      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, w, h);
      for (let i = 0; i < NUM_BALLS; i++) {
        gl!.uniform2f(uBalls[i], balls[i].x, h - balls[i].y);
        gl!.uniform1f(uRadii[i], balls[i].r);
      }

      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(tick);
    }

    resize();
    initBalls();
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onPointerLeave);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
    />
  );
}

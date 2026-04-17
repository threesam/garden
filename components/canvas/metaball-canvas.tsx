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
  uniform vec3 uColor;
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
      vec3 color = uColor;
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

interface MetaballProps {
  color?: [number, number, number]; // RGB 0-1
  trackCursor?: boolean;
  target?: { x: number; y: number } | null; // viewport coords
}

export function MetaballCanvas({
  color = [0.1, 0.1, 0.08],
  trackCursor = true,
  target = null,
}: MetaballProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(target);
  const trackCursorRef = useRef(trackCursor);
  const colorRef = useRef(color);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    trackCursorRef.current = trackCursor;
  }, [trackCursor]);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);

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
    const uColorLoc = gl.getUniformLocation(prog, "uColor");
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
          vx: (Math.random() - 0.5) * 1.3,
          vy: (Math.random() - 0.5) * 1.3,
          r: rMin + Math.random() * rRange,
        });
      }
    }

    function updatePointer(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      pointerX = clientX - rect.left;
      pointerY = clientY - rect.top;
      pointerActive = true;
    }

    function onPointerEvent(e: MouseEvent) {
      if (!trackCursorRef.current) return;
      updatePointer(e.clientX, e.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      if (!trackCursorRef.current) return;
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
    }
    function onPointerLeave() {
      pointerActive = false;
      if (!trackCursorRef.current) return;
      for (const b of balls) {
        // radial push away from cursor's last position
        const dx = b.x - pointerX;
        const dy = b.y - pointerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        b.vx += (dx / dist) * 0.8;
        b.vy += (dy / dist) * 0.8;
      }
    }

    canvas.addEventListener("mouseenter", onPointerEvent);
    canvas.addEventListener("mousemove", onPointerEvent);
    canvas.addEventListener("mouseleave", onPointerLeave);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onPointerLeave);

    let raf = 0;
    const t0 = performance.now();

    function tick() {
      const t = (performance.now() - t0) / 1000;

      // resolve attraction point (target prop wins over cursor)
      let attractX = 0;
      let attractY = 0;
      let attracting = false;
      const tgt = targetRef.current;
      if (tgt) {
        const rect = canvas!.getBoundingClientRect();
        attractX = tgt.x - rect.left;
        attractY = tgt.y - rect.top;
        attracting = true;
      } else if (trackCursorRef.current && pointerActive) {
        attractX = pointerX;
        attractY = pointerY;
        attracting = true;
      }

      for (const b of balls) {
        if (attracting) {
          const dx = attractX - b.x;
          const dy = attractY - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // radial pull toward attraction point
          b.vx += (dx / dist) * 0.15;
          b.vy += (dy / dist) * 0.15;

          // tangential force for orbiting (perpendicular to radial)
          b.vx += (-dy / dist) * 0.08;
          b.vy += (dx / dist) * 0.08;

          b.vx *= 0.95;
          b.vy *= 0.95;
        } else {
          // gentle drift back toward initial wandering speed
          const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (speed > 1.3) {
            b.vx *= 0.98;
            b.vy *= 0.98;
          }
        }

        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > w) b.vx *= -1;
        if (b.y < 0 || b.y > h) b.vy *= -1;
      }

      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, w, h);
      gl!.uniform3f(uColorLoc, colorRef.current[0], colorRef.current[1], colorRef.current[2]);
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
      canvas.removeEventListener("mouseenter", onPointerEvent);
      canvas.removeEventListener("mousemove", onPointerEvent);
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

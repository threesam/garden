"use client";

import { useEffect, useRef } from "react";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";

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
  uniform sampler2D uText;
  uniform float uHasText;

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

      // If text texture exists, reveal text through metaballs
      if (uHasText > 0.5) {
        vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
        float textAlpha = texture2D(uText, flippedUv).a;
        if (textAlpha > 0.5) {
          // Text pixel inside metaball — show inverted (background color showing through)
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
        }
      }

      gl_FragColor = vec4(color * alpha, alpha);
    } else {
      // Outside metaball — show text in a subtle color if present
      if (uHasText > 0.5) {
        vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
        float textAlpha = texture2D(uText, flippedUv).a;
        if (textAlpha > 0.5) {
          gl_FragColor = vec4(uColor * 0.15, 0.15);
          return;
        }
      }
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

function renderTextToCanvas(
  text: string,
  width: number,
  height: number,
  font: string,
): OffscreenCanvas {
  const offscreen = new OffscreenCanvas(width, height);
  const ctx = offscreen.getContext("2d")!;

  // Measure with pretext
  const fontSize = Math.min(width * 0.06, height * 0.18, 72);
  const fullFont = `700 ${fontSize}px ${font}`;
  const prepared = prepareWithSegments(text, fullFont);
  const lineHeight = fontSize * 1.15;
  const result = layoutWithLines(prepared, width * 0.8, lineHeight);

  // Center vertically
  const totalHeight = result.lines.length * lineHeight;
  const startY = (height - totalHeight) / 2 + fontSize * 0.85;

  // Render each line centered
  ctx.font = fullFont;
  ctx.fillStyle = "white";
  ctx.textBaseline = "alphabetic";

  for (let i = 0; i < result.lines.length; i++) {
    const line = result.lines[i];
    const x = (width - line.width) / 2;
    const y = startY + i * lineHeight;
    ctx.fillText(line.text, x, y);
  }

  return offscreen;
}

interface MetaballProps {
  color?: [number, number, number];
  text?: string;
  font?: string;
}

export function MetaballCanvas({
  color = [0.1, 0.1, 0.08],
  text,
  font = "system-ui, sans-serif",
}: MetaballProps) {
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
    const uColorLoc = gl.getUniformLocation(prog, "uColor");
    const uTextLoc = gl.getUniformLocation(prog, "uText");
    const uHasTextLoc = gl.getUniformLocation(prog, "uHasText");
    gl.uniform3f(uColorLoc, color[0], color[1], color[2]);
    gl.uniform1f(uHasTextLoc, text ? 1.0 : 0.0);

    const uBalls: (WebGLUniformLocation | null)[] = [];
    const uRadii: (WebGLUniformLocation | null)[] = [];
    for (let i = 0; i < NUM_BALLS; i++) {
      uBalls.push(gl.getUniformLocation(prog, `uBalls[${i}]`));
      uRadii.push(gl.getUniformLocation(prog, `uRadii[${i}]`));
    }

    // Text texture
    let textTexture: WebGLTexture | null = null;
    function updateTextTexture() {
      if (!text || !gl) return;
      const textCanvas = renderTextToCanvas(text, w, h, font);
      if (!textTexture) {
        textTexture = gl.createTexture();
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(uTextLoc, 0);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let w = 0, h = 0;
    let pointerX = -1, pointerY = -1;
    let pointerActive = false;
    const balls: Ball[] = [];

    function resize() {
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w;
      canvas!.height = h;
      gl!.viewport(0, 0, w, h);
      for (const b of balls) {
        b.x = Math.min(b.x, w);
        b.y = Math.min(b.y, h);
      }
      updateTextTexture();
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

    function onPointerEvent(e: MouseEvent) { updatePointer(e.clientX, e.clientY); }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
    }
    function onPointerLeave() {
      pointerActive = false;
      for (const b of balls) {
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

      for (const b of balls) {
        if (pointerActive) {
          const dx = pointerX - b.x;
          const dy = pointerY - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          b.vx += (dx / dist) * 0.15;
          b.vy += (dy / dist) * 0.15;
          b.vx += (-dy / dist) * 0.08;
          b.vy += (dx / dist) * 0.08;
          b.vx *= 0.95;
          b.vy *= 0.95;
        } else {
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

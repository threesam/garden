import type { Action } from 'svelte/action';
import { compileShader } from '$lib/canvas/gl-utils';

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

export interface MetaballParams {
  color?: [number, number, number];
  trackCursor?: boolean;
  target?: { x: number; y: number } | null;
}

export const metaball: Action<HTMLCanvasElement, MetaballParams> = (node, initialParams) => {
  let params: MetaballParams = initialParams;

  const glRaw = node.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!glRaw) return {};
  // Narrowed alias so nested functions don't see the nullable type.
  const gl: WebGLRenderingContext = glRaw;

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return {};
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPosition');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uRes = gl.getUniformLocation(prog, 'uResolution');
  const uColorLoc = gl.getUniformLocation(prog, 'uColor');
  // Single bulk-array location per uniform array — the `[0]` name addresses
  // the whole array in WebGL, so uniform2fv / uniform1fv can push all 12
  // entries in one call. Drops per-frame uniform updates 24 → 2 (~92 %).
  const uBallsLoc = gl.getUniformLocation(prog, 'uBalls[0]');
  const uRadiiLoc = gl.getUniformLocation(prog, 'uRadii[0]');
  const ballsBuf = new Float32Array(NUM_BALLS * 2);
  const radiiBuf = new Float32Array(NUM_BALLS);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let w = 0;
  let h = 0;
  let rectLeft = 0;
  let rectTop = 0;
  let pointerX = -1;
  let pointerY = -1;
  let pointerActive = false;
  const balls: Ball[] = [];

  const RES_SCALE = 0.5;
  function resize() {
    w = node.clientWidth;
    h = node.clientHeight;
    node.width = Math.max(1, Math.round(w * RES_SCALE));
    node.height = Math.max(1, Math.round(h * RES_SCALE));
    gl.viewport(0, 0, node.width, node.height);
    const rect = node.getBoundingClientRect();
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

  function updateRect() {
    const rect = node.getBoundingClientRect();
    rectLeft = rect.left;
    rectTop = rect.top;
  }

  function updatePointer(clientX: number, clientY: number) {
    // Re-read rect on every call: an ancestor may translate via
    // transform: translate3d (e.g. the Gallery auto-scroll strip), which
    // doesn't fire a scroll event and leaves a cached rect stale.
    // pointermove is browser-throttled so this read is cheap.
    const rect = node.getBoundingClientRect();
    rectLeft = rect.left;
    rectTop = rect.top;
    pointerX = clientX - rectLeft;
    pointerY = clientY - rectTop;
    pointerActive = true;
  }

  function onPointerEvent(e: MouseEvent) {
    if (!params.trackCursor) return;
    updatePointer(e.clientX, e.clientY);
  }
  function onTouchMove(e: TouchEvent) {
    if (!params.trackCursor) return;
    const t = e.touches[0];
    if (t) updatePointer(t.clientX, t.clientY);
  }
  function onPointerLeave() {
    pointerActive = false;
    if (!params.trackCursor) return;
    for (const b of balls) {
      const dx = b.x - pointerX;
      const dy = b.y - pointerY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      b.vx += (dx / dist) * 0.8;
      b.vy += (dy / dist) * 0.8;
    }
  }

  node.addEventListener('mouseenter', onPointerEvent);
  node.addEventListener('mousemove', onPointerEvent);
  node.addEventListener('mouseleave', onPointerLeave);
  node.addEventListener('touchmove', onTouchMove, { passive: true });
  node.addEventListener('touchend', onPointerLeave);
  window.addEventListener('scroll', updateRect, { passive: true });

  let raf = 0;
  let isVisible = true;
  const t0 = performance.now();
  let lastTickT = performance.now();

  function tick() {
    raf = 0;
    if (!isVisible) return;
    const now = performance.now();
    const t = (now - t0) / 1000;
    // dt expressed in 60fps-frame units, clamped so a tab-switch resume
    // doesn't fling balls across the canvas. Lets mobile (30fps) feel
    // as snappy as desktop (60fps): each tick integrates two frames'
    // worth of attract impulse + damping.
    const dt = Math.min((now - lastTickT) / 16.67, 3);
    lastTickT = now;

    let attractX = 0;
    let attractY = 0;
    let attracting = false;
    const tgt = params.target ?? null;
    if (tgt) {
      attractX = tgt.x - rectLeft;
      attractY = tgt.y - rectTop;
      attracting = true;
    } else if (params.trackCursor && pointerActive) {
      attractX = pointerX;
      attractY = pointerY;
      attracting = true;
    }

    for (const b of balls) {
      if (attracting) {
        const dx = attractX - b.x;
        const dy = attractY - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        // Stiffer attract + lower velocity damping so blobs coalesce
        // around the cursor in ~200 ms instead of the old ~600 ms drift.
        // Tangent stays gentler than radial — keeps the spiral readable.
        b.vx += (dx / dist) * 0.35 * dt;
        b.vy += (dy / dist) * 0.35 * dt;
        b.vx += (-dy / dist) * 0.14 * dt;
        b.vy += (dx / dist) * 0.14 * dt;
        const damp = Math.pow(0.88, dt);
        b.vx *= damp;
        b.vy *= damp;
      } else {
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > 1.3) {
          const d = Math.pow(0.98, dt);
          b.vx *= d;
          b.vy *= d;
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 0 || b.x > w) b.vx *= -1;
      if (b.y < 0 || b.y > h) b.vy *= -1;
    }

    const color = params.color ?? [0.1, 0.1, 0.08];
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, w, h);
    gl.uniform3f(uColorLoc, color[0], color[1], color[2]);
    for (let i = 0; i < NUM_BALLS; i++) {
      const b = balls[i]!;
      ballsBuf[i * 2] = b.x;
      ballsBuf[i * 2 + 1] = h - b.y;
      radiiBuf[i] = b.r;
    }
    gl.uniform2fv(uBallsLoc, ballsBuf);
    gl.uniform1fv(uRadiiLoc, radiiBuf);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(tick);
  }

  function startTick() {
    if (raf || !isVisible) return;
    raf = requestAnimationFrame(tick);
  }

  resize();
  initBalls();

  const ro = new ResizeObserver(() => { resize(); });
  ro.observe(node);

  const io = new IntersectionObserver(
    (entries) => {
      const wasVisible = isVisible;
      isVisible = entries[0]?.isIntersecting ?? true;
      if (isVisible && !wasVisible) startTick();
    },
    { threshold: 0 },
  );
  io.observe(node);
  startTick();

  return {
    update(next: MetaballParams) {
      params = next;
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      node.removeEventListener('mouseenter', onPointerEvent);
      node.removeEventListener('mousemove', onPointerEvent);
      node.removeEventListener('mouseleave', onPointerLeave);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onPointerLeave);
      window.removeEventListener('scroll', updateRect);
    },
  };
};

"use client";

import { useEffect, useRef } from "react";
import { shouldSkipThrottledFrame } from "@/lib/perf-flags";

// Physics constants — kept as shader uniforms / constants where used
const SPEED = 0.3;
const DEFAULT_REPEL_RADIUS = 180;
// Cursor force. Small — the cursor parts the field rather than shoves it.
const REPEL_STRENGTH = 1.0;
// Applied on text-collision reflections only; the rest of the field has
// no per-frame damping (motion is maintained by the minimum-speed clamp
// in the vertex shader so the field stays alive regardless of cursor).
const DAMPING = 0.85;

// Pick a particle count appropriate to the device. Mobile + low-mem devices
// get smaller counts so they don't blow memory on the GPU buffers; desktops
// scale up. prefers-reduced-motion gets a static, low-count snapshot.
//
// Tiers are sized below the original 450k / 700k ceiling because the
// physics pass runs every frame (ambient motion, not sand) and the 60fps
// budget can't absorb the full cost alongside the gallery's other
// canvases. 200k on mobile matches the last-known-good mobile tier the
// user explicitly called out as "pretty damn good on mobile."
function pickParticleCount(): { count: number; animate: boolean } {
  if (typeof window === "undefined") return { count: 120_000, animate: true };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return { count: 60_000, animate: false };

  const w = window.innerWidth;
  const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const isMobile = w < 768;
  const isLowMem = dm !== undefined && dm < 4;

  if (isMobile || isLowMem) return { count: 200_000, animate: true };
  if (w < 1280) return { count: 220_000, animate: true };
  if (w < 1920) return { count: 260_000, animate: true };
  return { count: 320_000, animate: true };
}

// GLSL requires explicit decimals on float literals. JS `${n}` drops the `.0`
// for integer-valued floats, breaking the shader. This guarantees a decimal.
const glf = (n: number): string => (Number.isInteger(n) ? `${n}.0` : `${n}`);

// Vertex shader: physics step. Reads position+velocity from input attribute
// buffers, applies cursor repulsion + text collision (via sampled alpha map) +
// edge bounce, writes new pos+vel to transform-feedback output varyings.
// Rasterizer is discarded — we never want this pass to draw fragments.
// Built per-instance so the repel radius can vary between component usages
// (thumbnail vs hero) without paying a uniform-read every vertex.
const buildUpdateVert = (repelRadius: number) => `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_velocity;

uniform vec2 u_resolution;
uniform vec2 u_mouse;       // (-1,-1) when inactive
uniform sampler2D u_collision;

out vec2 v_position;
out vec2 v_velocity;

void main() {
  vec2 pos = a_position;
  vec2 vel = a_velocity;

  // Cursor repulsion
  if (u_mouse.x >= 0.0) {
    vec2 diff = pos - u_mouse;
    float distSq = dot(diff, diff);
    float radiusSq = ${glf(repelRadius)} * ${glf(repelRadius)};
    if (distSq < radiusSq && distSq > 0.5) {
      float dist = sqrt(distSq);
      float falloff = 1.0 - dist / ${glf(repelRadius)};
      float force = falloff * falloff * ${glf(REPEL_STRENGTH)};
      vel += (diff / dist) * force;
    }
  }

  pos += vel;

  // Text collision via sampled alpha. Threshold 0.5 gives a crisp edge
  // at bilinear-sampled glyph boundaries; neighbor gradient yields a
  // surface normal to reflect against.
  vec2 uv = pos / u_resolution;
  if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
    float here = texture(u_collision, uv).r;
    if (here > 0.5) {
      vec2 step = 2.0 / u_resolution;
      float r = texture(u_collision, uv + vec2(step.x, 0.0)).r;
      float l = texture(u_collision, uv - vec2(step.x, 0.0)).r;
      float d = texture(u_collision, uv + vec2(0.0, step.y)).r;
      float u = texture(u_collision, uv - vec2(0.0, step.y)).r;
      vec2 normal = vec2(l - r, u - d);
      float nlen = length(normal);
      if (nlen > 0.001) {
        normal /= nlen;
        vel = reflect(vel, normal) * ${glf(DAMPING)};
        pos += normal * 2.0;
      }
    }
  }

  // Maintain minimum speed so the field stays alive — without this,
  // particles that bounce off text or lose energy to collisions gradually
  // settle and the scene looks dead. Reseeds a minimum velocity in the
  // current direction of travel.
  float speedSq = dot(vel, vel);
  float minSq = (${glf(SPEED)} * 0.3) * (${glf(SPEED)} * 0.3);
  if (speedSq < minSq) {
    float angle = atan(vel.y, vel.x);
    vel = vec2(cos(angle), sin(angle)) * (${glf(SPEED)} * 0.5);
  }

  // Edge bounce
  if (pos.x < 1.0)                    { pos.x = 1.0;                   vel.x =  abs(vel.x); }
  if (pos.x > u_resolution.x - 1.0)   { pos.x = u_resolution.x - 1.0;  vel.x = -abs(vel.x); }
  if (pos.y < 1.0)                    { pos.y = 1.0;                   vel.y =  abs(vel.y); }
  if (pos.y > u_resolution.y - 1.0)   { pos.y = u_resolution.y - 1.0;  vel.y = -abs(vel.y); }

  v_position = pos;
  v_velocity = vel;

  // gl_Position is required even with rasterizer discard
  gl_Position = vec4(0.0);
}
`;

// Fragment shader for the update pass — never executes (rasterizer-discarded)
// but WebGL still requires one for program linking.
const UPDATE_FRAG = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() { outColor = vec4(0.0); }
`;

// Vertex shader for render pass. The scene is a_color (light grays) by
// default; particles inside a circular window around ANALOG are pushed
// to u_goldColor (black) so the word sits inside a dark disc.
const RENDER_VERT = `#version 300 es
precision highp float;

in vec2 a_position;
in vec3 a_color;

uniform vec2 u_resolution;
uniform float u_pointSize;
uniform vec2 u_goldCenter;     // circle center (pixels)
uniform float u_goldRadius;    // circle radius (pixels) — 0 disables window
uniform vec3 u_goldColor;
uniform float u_goldVicinity;  // soft fade thickness outside the radius

out vec3 v_color;

void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  clip.y *= -1.0;
  gl_Position = vec4(clip, 0.0, 1.0);

  vec3 baseColor = a_color;
  float t = 0.0;
  if (u_goldRadius > 0.0) {
    float dist = distance(a_position, u_goldCenter);
    t = 1.0 - smoothstep(u_goldRadius, u_goldRadius + u_goldVicinity, dist);
    baseColor = mix(a_color, u_goldColor, t);
  }
  // Mild size boost inside the tint zone — just enough to let the
  // dark circle hold its shape at lower particle counts. Anything
  // larger visually blankets the ANALOG letter cutouts that the
  // collision texture carves into the disc.
  gl_PointSize = u_pointSize * (1.0 + t * 0.35);
  v_color = baseColor;
}
`;

const RENDER_FRAG = `#version 300 es
precision mediump float;
in vec3 v_color;
out vec4 outColor;
void main() {
  outColor = vec4(v_color, 0.85);
}
`;

// Grayscale range for per-particle color. Light grays that sit subtly on
// a white background — not invisible, but not competing with text either.
const GRAY_MIN = 170;
const GRAY_MAX = 215;

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function linkProgram(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
  transformFeedbackVaryings?: string[]
): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  if (transformFeedbackVaryings) {
    gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

interface ParticleTextCanvasProps {
  // Override adaptive sizing; used for gallery thumbnails etc.
  countOverride?: number;
  // Skip drawing the "ANYTHING BUT ANALOG" title and its collision texture
  // so particles drift freely. Useful for thumbnails where the title would
  // dominate the card.
  hideText?: boolean;
  // Device-pixel size of each particle. 1.0 on retina = ½ CSS pixel, which
  // is invisible at thumbnail scale — bump to 2–3 for card use.
  pointSize?: number;
  // Cursor repulsion radius in CSS pixels. Large hero values make the
  // cursor feel commanding; smaller values (~40–60) are right for thumbs.
  repelRadius?: number;
  // Render at 1× CSS pixels instead of devicePixelRatio. Right for
  // small thumbnails where retina sharpness isn't worth the 4× cost.
  lowDpr?: boolean;
}

export function ParticleTextCanvas({
  countOverride,
  hideText = false,
  pointSize = 1.0,
  repelRadius,
  lowDpr = false,
}: ParticleTextCanvasProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const textCanvas = textCanvasRef.current;
    const glCanvas = glCanvasRef.current;
    if (!container || !textCanvas || !glCanvas) return;

    const dpr = lowDpr ? 1 : (window.devicePixelRatio || 1);
    const picked = pickParticleCount();
    const PARTICLE_COUNT = countOverride ?? picked.count;
    const animate = picked.animate;
    const textBitmapCanvas = document.createElement("canvas");
    // Mobile gets a tighter cursor radius (30% smaller) so the hover zone
    // doesn't dominate the viewport on a phone. Desktop keeps the default.
    // Explicit caller override (thumbnail usage) always wins.
    const viewportDefault =
      window.innerWidth < 768 ? DEFAULT_REPEL_RADIUS * 0.7 : DEFAULT_REPEL_RADIUS;
    const effectiveRepelRadius = repelRadius ?? viewportDefault;

    // Mutable per-instance state (shared across init / context-restore cycles).
    let w = 0;
    let h = 0;
    let bufW = 0;
    let bufH = 0;
    let rafId = 0;
    let isVisible = false; // start false; IntersectionObserver flips on attach
    let textColor = "#f5f0e8";
    let mouseX = -1;
    let mouseY = -1;
    let activeIdx = 0;
    let particlesInitialized = false;
    let throttleFrame = 0;

    // R8 letter mask in CSS pixels. Consulted at particle spawn so no
    // particle starts inside a glyph — the collision shader can't push
    // out particles whose 4 neighbor samples are all inside the stroke
    // (gradient is zero, normal stays 0), so they'd sit there forever
    // and blot the letter. Null when hideText is true.
    let collisionMask: Uint8Array | null = null;

    // GL state — assigned by setupGL(), cleared by teardownGL().
    // Re-created on context-restore for iOS Safari compatibility.
    let gl: WebGL2RenderingContext | null = null;
    let updateVS: WebGLShader | null = null;
    let updateFS: WebGLShader | null = null;
    let renderVS: WebGLShader | null = null;
    let renderFS: WebGLShader | null = null;
    let updateProg: WebGLProgram | null = null;
    let renderProg: WebGLProgram | null = null;
    let posBuffers: WebGLBuffer[] = [];
    let velBuffers: WebGLBuffer[] = [];
    let colorBuffer: WebGLBuffer | null = null;
    let vaos: WebGLVertexArrayObject[] = [];
    let renderVaos: WebGLVertexArrayObject[] = [];
    let textTexture: WebGLTexture | null = null;
    let uA = { position: -1, velocity: -1 };
    let uU = {
      resolution: null as WebGLUniformLocation | null,
      mouse: null as WebGLUniformLocation | null,
      collision: null as WebGLUniformLocation | null,
    };
    let rA = { position: -1, color: -1 };
    let rU = {
      resolution: null as WebGLUniformLocation | null,
      pointSize: null as WebGLUniformLocation | null,
      goldCenter: null as WebGLUniformLocation | null,
      goldRadius: null as WebGLUniformLocation | null,
      goldColor: null as WebGLUniformLocation | null,
      goldVicinity: null as WebGLUniformLocation | null,
    };
    // Circular ANALOG window: center + radius in CSS pixels. Radius = 0
    // disables the window (thumbnail / hideText path). Vicinity is
    // computed per-rebuild as a fraction of the radius so the fade
    // reads the same across mobile / desktop breakpoints.
    const goldCircle = { cx: 0, cy: 0, r: 0 };
    const goldRGB: [number, number, number] = [0, 0, 0];
    let goldVicinity = 0;

    function setupGL(): boolean {
      gl = glCanvas!.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
      });
      if (!gl) return false;

      updateVS = compileShader(gl, gl.VERTEX_SHADER, buildUpdateVert(effectiveRepelRadius));
      updateFS = compileShader(gl, gl.FRAGMENT_SHADER, UPDATE_FRAG);
      updateProg = linkProgram(gl, updateVS, updateFS, ["v_position", "v_velocity"]);

      renderVS = compileShader(gl, gl.VERTEX_SHADER, RENDER_VERT);
      renderFS = compileShader(gl, gl.FRAGMENT_SHADER, RENDER_FRAG);
      renderProg = linkProgram(gl, renderVS, renderFS);

      uA = {
        position: gl.getAttribLocation(updateProg, "a_position"),
        velocity: gl.getAttribLocation(updateProg, "a_velocity"),
      };
      uU = {
        resolution: gl.getUniformLocation(updateProg, "u_resolution"),
        mouse: gl.getUniformLocation(updateProg, "u_mouse"),
        collision: gl.getUniformLocation(updateProg, "u_collision"),
      };
      rA = {
        position: gl.getAttribLocation(renderProg, "a_position"),
        color: gl.getAttribLocation(renderProg, "a_color"),
      };
      rU = {
        resolution: gl.getUniformLocation(renderProg, "u_resolution"),
        pointSize: gl.getUniformLocation(renderProg, "u_pointSize"),
        goldCenter: gl.getUniformLocation(renderProg, "u_goldCenter"),
        goldRadius: gl.getUniformLocation(renderProg, "u_goldRadius"),
        goldColor: gl.getUniformLocation(renderProg, "u_goldColor"),
        goldVicinity: gl.getUniformLocation(renderProg, "u_goldVicinity"),
      };

      posBuffers = [gl.createBuffer()!, gl.createBuffer()!];
      velBuffers = [gl.createBuffer()!, gl.createBuffer()!];
      colorBuffer = gl.createBuffer();
      vaos = [gl.createVertexArray()!, gl.createVertexArray()!];
      renderVaos = [gl.createVertexArray()!, gl.createVertexArray()!];

      // Reset state that depends on GL resources
      particlesInitialized = false;
      textTexture = null;
      activeIdx = 0;
      return true;
    }

    function teardownGL() {
      if (!gl) return;
      if (textTexture) gl.deleteTexture(textTexture);
      if (colorBuffer) gl.deleteBuffer(colorBuffer);
      posBuffers.forEach((b) => gl!.deleteBuffer(b));
      velBuffers.forEach((b) => gl!.deleteBuffer(b));
      vaos.forEach((v) => gl!.deleteVertexArray(v));
      renderVaos.forEach((v) => gl!.deleteVertexArray(v));
      if (updateProg) gl.deleteProgram(updateProg);
      if (renderProg) gl.deleteProgram(renderProg);
      if (updateVS) gl.deleteShader(updateVS);
      if (updateFS) gl.deleteShader(updateFS);
      if (renderVS) gl.deleteShader(renderVS);
      if (renderFS) gl.deleteShader(renderFS);
      gl = null;
      textTexture = null;
      posBuffers = [];
      velBuffers = [];
      colorBuffer = null;
      vaos = [];
      renderVaos = [];
      particlesInitialized = false;
    }

    if (!setupGL()) {
      console.warn("WebGL2 unavailable — particle canvas disabled.");
      return;
    }

    function initParticleBuffers() {
      // Position/velocity ping-pong (vec2 float32 each).
      const positions = new Float32Array(PARTICLE_COUNT * 2);
      const velocities = new Float32Array(PARTICLE_COUNT * 2);
      // Per-particle grayscale — R=G=B, Uint8 normalized to [0,1] in the
      // attribute pipeline. 3 bytes/particle = ~4.5MB at 1.5M particles.
      const colors = new Uint8Array(PARTICLE_COUNT * 3);

      const grayRange = GRAY_MAX - GRAY_MIN;
      const mask = collisionMask;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        let px = Math.random() * w;
        let py = Math.random() * h;
        // Reject spawns inside a glyph fill. Twelve random retries is
        // plenty for realistic letter-coverage ratios; the degenerate
        // fallback below guarantees we never accept a trapped position
        // even in pathological cases (text covers most of the canvas).
        if (mask) {
          let ok = false;
          for (let retry = 0; retry < 12; retry++) {
            const cx = Math.min(w - 1, Math.floor(px));
            const cy = Math.min(h - 1, Math.floor(py));
            if (mask[cy * w + cx] < 50) { ok = true; break; }
            px = Math.random() * w;
            py = Math.random() * h;
          }
          // Degenerate fallback: if 12 retries all landed inside glyph
          // pixels (only possible if text covers nearly the whole canvas),
          // hop left+down until we find a clear cell. Guaranteed to
          // terminate because the cursor wraps around.
          if (!ok) {
            let cx = Math.min(w - 1, Math.floor(px));
            let cy = Math.min(h - 1, Math.floor(py));
            for (let step = 0; step < w * h; step++) {
              if (mask[cy * w + cx] < 50) { px = cx + 0.5; py = cy + 0.5; break; }
              cx++;
              if (cx >= w) { cx = 0; cy = (cy + 1) % h; }
            }
          }
        }

        const angle = Math.random() * Math.PI * 2;
        const spd = SPEED * (0.5 + Math.random());
        positions[i * 2] = px;
        positions[i * 2 + 1] = py;
        velocities[i * 2] = Math.cos(angle) * spd;
        velocities[i * 2 + 1] = Math.sin(angle) * spd;

        const g = (GRAY_MIN + Math.random() * grayRange) | 0;
        colors[i * 3] = g;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = g;
      }

      for (let i = 0; i < 2; i++) {
        gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuffers[i]);
        gl!.bufferData(gl!.ARRAY_BUFFER, positions, gl!.DYNAMIC_COPY);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, velBuffers[i]);
        gl!.bufferData(gl!.ARRAY_BUFFER, velocities, gl!.DYNAMIC_COPY);
      }
      gl!.bindBuffer(gl!.ARRAY_BUFFER, colorBuffer);
      gl!.bufferData(gl!.ARRAY_BUFFER, colors, gl!.STATIC_DRAW);

      // Update VAOs (input attributes for the physics pass)
      for (let i = 0; i < 2; i++) {
        gl!.bindVertexArray(vaos[i]);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuffers[i]);
        gl!.enableVertexAttribArray(uA.position);
        gl!.vertexAttribPointer(uA.position, 2, gl!.FLOAT, false, 0, 0);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, velBuffers[i]);
        gl!.enableVertexAttribArray(uA.velocity);
        gl!.vertexAttribPointer(uA.velocity, 2, gl!.FLOAT, false, 0, 0);
      }

      // Render VAOs: position (ping-ponged) + color (static, same buffer for both)
      for (let i = 0; i < 2; i++) {
        gl!.bindVertexArray(renderVaos[i]);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuffers[i]);
        gl!.enableVertexAttribArray(rA.position);
        gl!.vertexAttribPointer(rA.position, 2, gl!.FLOAT, false, 0, 0);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, colorBuffer);
        gl!.enableVertexAttribArray(rA.color);
        gl!.vertexAttribPointer(rA.color, 3, gl!.UNSIGNED_BYTE, true, 0, 0); // normalized
      }

      gl!.bindVertexArray(null);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, null);
      particlesInitialized = true;
    }

    function rebuildText() {
      if (!gl) return;
      w = container!.offsetWidth;
      h = container!.offsetHeight;
      if (w === 0 || h === 0) return;

      bufW = w * dpr;
      bufH = h * dpr;

      // Visible text canvas (back layer)
      textCanvas!.width = bufW;
      textCanvas!.height = bufH;
      textCanvas!.style.width = `${w}px`;
      textCanvas!.style.height = `${h}px`;

      // GL canvas (front layer)
      glCanvas!.width = bufW;
      glCanvas!.height = bufH;
      glCanvas!.style.width = `${w}px`;
      glCanvas!.style.height = `${h}px`;
      gl!.viewport(0, 0, bufW, bufH);

      const containerStyle = getComputedStyle(container!);
      // On a white background "ANYTHING BUT" needs to be dark to be readable.
      textColor = containerStyle.getPropertyValue("--black").trim() || "#111";

      // Render text to visible 2D canvas. Skipped when hideText is set —
      // particles then have no obstacle and drift freely.
      const tCtx = textCanvas!.getContext("2d")!;
      tCtx.clearRect(0, 0, bufW, bufH);
      tCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const r8 = new Uint8Array(w * h);
      // Reset — radius 0 disables the window.
      goldCircle.cx = goldCircle.cy = goldCircle.r = 0;
      if (!hideText) {
        const whiteColor =
          getComputedStyle(container!).getPropertyValue("--white").trim() ||
          "#ffffff";

        // Desktop keeps the original single-line "ANYTHING BUT ANALOG"
        // layout; mobile stacks into three lines so the word fits and
        // ANALOG isn't pushed off-screen. Breakpoint matches the rest
        // of the site.
        const stacked = w < 768;

        const textBaselineMiddle = () => {
          tCtx.textAlign = "left";
          tCtx.textBaseline = "middle";
          tCtx.letterSpacing = "0.1em";
        };

        // Collision bitmap is the same w × h CSS-pixel canvas either
        // way — just text, no disc.
        textBitmapCanvas.width = w;
        textBitmapCanvas.height = h;
        // willReadFrequently keeps this canvas on the CPU-side backing
        // store, which is what we want: we draw text once then pull the
        // whole bitmap out with getImageData to build the collision mask.
        const cCtx = textBitmapCanvas.getContext("2d", { willReadFrequently: true })!;
        cCtx.clearRect(0, 0, w, h);
        cCtx.textAlign = "left";
        cCtx.textBaseline = "middle";
        cCtx.letterSpacing = "0.1em";
        cCtx.fillStyle = "white";

        if (stacked) {
          const lines = ["ANYTHING", "BUT", "ANALOG"];
          const leftPadFrac = 0.08;
          const lineHeight = 1.2;
          const widthBudget = w * 0.75;
          const heightBudget = h * 0.55;
          const sizeFromW = widthBudget / 6.5;
          const sizeFromH = heightBudget / (lines.length * lineHeight);
          const fontSize = Math.max(22, Math.min(120, Math.min(sizeFromW, sizeFromH)));
          const fontStr = `bold ${fontSize}px Jost, sans-serif`;
          tCtx.font = fontStr;
          cCtx.font = fontStr;
          tCtx.textAlign = "left";
          tCtx.textBaseline = "middle";
          tCtx.letterSpacing = "0.1em";
          cCtx.textAlign = "left";

          const startX = w * leftPadFrac;
          const yAt = (i: number) => (h * (i + 1)) / (lines.length + 1);

          for (let i = 0; i < lines.length; i++) {
            tCtx.fillStyle = lines[i] === "ANALOG" ? whiteColor : textColor;
            tCtx.fillText(lines[i], startX, yAt(i));
          }

          const analogIdx = lines.indexOf("ANALOG");
          const analogWidth = tCtx.measureText("ANALOG").width;
          goldCircle.cx = startX + analogWidth / 2;
          goldCircle.cy = yAt(analogIdx);
          goldCircle.r = analogWidth * 0.65;
          goldVicinity = goldCircle.r * 0.5;

          for (let i = 0; i < lines.length; i++) {
            cCtx.fillText(lines[i], startX, yAt(i));
          }
        } else {
          // Desktop: single-line "ANYTHING BUT ANALOG", centered, with
          // a particle-tint circle around ANALOG (no disc on text
          // canvas — desktop has enough particles to do the job).
          const prefix = "ANYTHING BUT ";
          const highlight = "ANALOG";
          const fontSize = w >= 1920 ? 120 : w >= 1280 ? 96 : 72;
          const fontStr = `bold ${fontSize}px Jost, sans-serif`;
          tCtx.font = fontStr;
          cCtx.font = fontStr;
          textBaselineMiddle();

          const prefixWidth = tCtx.measureText(prefix).width;
          const highlightWidth = tCtx.measureText(highlight).width;
          const totalWidth = prefixWidth + highlightWidth;
          const startX = (w - totalWidth) / 2;
          const centerY = h / 2;

          tCtx.fillStyle = textColor;
          tCtx.fillText(prefix, startX, centerY);
          tCtx.fillStyle = whiteColor;
          tCtx.fillText(highlight, startX + prefixWidth, centerY);

          goldCircle.cx = startX + prefixWidth + highlightWidth / 2;
          goldCircle.cy = centerY;
          goldCircle.r = highlightWidth * 0.6;
          goldVicinity = goldCircle.r * 0.5;

          cCtx.fillText(prefix, startX, centerY);
          cCtx.fillText(highlight, startX + prefixWidth, centerY);
        }

        const collisionData = cCtx.getImageData(0, 0, w, h).data;
        for (let i = 0; i < r8.length; i++) r8[i] = collisionData[i * 4 + 3];
        collisionMask = r8;
      } else {
        collisionMask = null;
      }

      if (textTexture) gl!.deleteTexture(textTexture);
      textTexture = gl!.createTexture();
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, textTexture);
      // R8 is 1 byte/pixel; at the default UNPACK_ALIGNMENT=4 WebGL expects
      // each row padded to a multiple of 4 bytes. When `w` isn't divisible
      // by 4 (e.g. 390px iPhones, 375px SE, 414px Max), the upload fails
      // with "ArrayBufferView not big enough" and the texture is left with
      // garbage/zeros — particles see zero collision texture and drift
      // through letters. Desktop widths 1280/1440/1920 all happen to be
      // multiples of 4 so the bug was invisible there.
      gl!.pixelStorei(gl!.UNPACK_ALIGNMENT, 1);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.R8, w, h, 0, gl!.RED, gl!.UNSIGNED_BYTE, r8);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);

      if (!particlesInitialized) initParticleBuffers();
    }

    function tick() {
      rafId = 0;
      if (!gl || !particlesInitialized || !textTexture || !isVisible) return;
      if (animate && shouldSkipThrottledFrame(++throttleFrame)) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const inIdx = activeIdx;
      // Static rendering for prefers-reduced-motion: skip the physics pass
      // and render the same buffer every frame.
      const outIdx = animate ? 1 - activeIdx : activeIdx;

      // ===== Physics pass with transform feedback =====
      if (animate) {
        gl!.useProgram(updateProg);
        gl!.uniform2f(uU.resolution, w, h);
        gl!.uniform2f(uU.mouse, mouseX, mouseY);
        gl!.uniform1i(uU.collision, 0);
        gl!.activeTexture(gl!.TEXTURE0);
        gl!.bindTexture(gl!.TEXTURE_2D, textTexture);

        gl!.bindVertexArray(vaos[inIdx]);

        // Bind output buffers as transform-feedback targets (in declared order)
        gl!.bindBufferBase(gl!.TRANSFORM_FEEDBACK_BUFFER, 0, posBuffers[outIdx]);
        gl!.bindBufferBase(gl!.TRANSFORM_FEEDBACK_BUFFER, 1, velBuffers[outIdx]);

        gl!.enable(gl!.RASTERIZER_DISCARD);
        gl!.beginTransformFeedback(gl!.POINTS);
        gl!.drawArrays(gl!.POINTS, 0, PARTICLE_COUNT);
        gl!.endTransformFeedback();
        gl!.disable(gl!.RASTERIZER_DISCARD);

        gl!.bindBufferBase(gl!.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl!.bindBufferBase(gl!.TRANSFORM_FEEDBACK_BUFFER, 1, null);
      }

      // ===== Render pass =====
      gl!.useProgram(renderProg);
      gl!.uniform2f(rU.resolution, w, h);
      gl!.uniform1f(rU.pointSize, pointSize * dpr);
      gl!.uniform2f(rU.goldCenter, goldCircle.cx, goldCircle.cy);
      gl!.uniform1f(rU.goldRadius, goldCircle.r);
      gl!.uniform3f(rU.goldColor, goldRGB[0], goldRGB[1], goldRGB[2]);
      gl!.uniform1f(rU.goldVicinity, goldVicinity);
      gl!.bindVertexArray(renderVaos[outIdx]);

      gl!.clearColor(0, 0, 0, 0); // transparent — text canvas underneath shows through
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.enable(gl!.BLEND);
      gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.drawArrays(gl!.POINTS, 0, PARTICLE_COUNT);

      gl!.bindVertexArray(null);

      activeIdx = outIdx;
      // Static mode: render once and stop scheduling — saves CPU/GPU.
      if (animate) rafId = requestAnimationFrame(tick);
    }

    function startTick() {
      if (rafId || !gl) return;
      rafId = requestAnimationFrame(tick);
    }

    // iOS Safari aggressively kills WebGL contexts on memory pressure or
    // backgrounding. Without recovery the canvas stays black permanently.
    function onContextLost(e: Event) {
      e.preventDefault(); // signals our intent to recover
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      teardownGL();
    }
    function onContextRestored() {
      if (setupGL()) {
        rebuildText(); // re-uploads texture + re-inits particles
        if (isVisible) startTick();
      }
    }
    glCanvas.addEventListener("webglcontextlost", onContextLost);
    glCanvas.addEventListener("webglcontextrestored", onContextRestored);

    rebuildText();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(rebuildText, 150);
    });
    ro.observe(container);

    // Pause the entire pipeline when the canvas scrolls out of view —
    // huge battery/CPU savings on long pages where this lives below other content.
    const io = new IntersectionObserver(
      (entries) => {
        const wasVisible = isVisible;
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible && !wasVisible) startTick();
      },
      { threshold: 0 }
    );
    io.observe(container);

    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouseX = -1;
      mouseY = -1;
    };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      ro.disconnect();
      io.disconnect();
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      glCanvas.removeEventListener("webglcontextlost", onContextLost);
      glCanvas.removeEventListener("webglcontextrestored", onContextRestored);
      teardownGL();
    };
  }, [countOverride, hideText, pointSize, repelRadius, lowDpr]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: "var(--white)" }}
    >
      <canvas ref={textCanvasRef} className="absolute inset-0" />
      <canvas ref={glCanvasRef} className="absolute inset-0" />
    </div>
  );
}

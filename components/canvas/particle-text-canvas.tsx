"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 1_300_000;

// Physics constants — kept as shader uniforms / constants where used
const SPEED = 0.6;
const REPEL_RADIUS = 180;
const REPEL_STRENGTH = 2.0;
const DAMPING = 0.85;

// GLSL requires explicit decimals on float literals. JS `${n}` drops the `.0`
// for integer-valued floats, breaking the shader. This guarantees a decimal.
const glf = (n: number): string => (Number.isInteger(n) ? `${n}.0` : `${n}`);

// Vertex shader: physics step. Reads position+velocity from input attribute
// buffers, applies cursor repulsion + text collision (via sampled alpha map) +
// edge bounce, writes new pos+vel to transform-feedback output varyings.
// Rasterizer is discarded — we never want this pass to draw fragments.
const UPDATE_VERT = `#version 300 es
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
    float radiusSq = ${glf(REPEL_RADIUS)} * ${glf(REPEL_RADIUS)};
    if (distSq < radiusSq && distSq > 0.5) {
      float dist = sqrt(distSq);
      float falloff = 1.0 - dist / ${glf(REPEL_RADIUS)};
      float force = falloff * falloff * ${glf(REPEL_STRENGTH)};
      vel += (diff / dist) * force;
    }
  }

  pos += vel;

  // Text collision via sampled alpha. If we're inside the text, compute a
  // normal from neighbor samples and reflect velocity.
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

  // Maintain minimum speed
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

// Vertex shader for render pass: convert pixel position to clip space, draw as
// a single point. gl_PointSize must be set or points won't render.
const RENDER_VERT = `#version 300 es
precision highp float;

in vec2 a_position;

uniform vec2 u_resolution;

void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  clip.y *= -1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = 1.0;
}
`;

const RENDER_FRAG = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() {
  // Soft mid-gray, slight transparency so dense overlap reads as gradient
  outColor = vec4(0.32, 0.32, 0.32, 0.85);
}
`;

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

export function ParticleTextCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const textCanvas = textCanvasRef.current;
    const glCanvas = glCanvasRef.current;
    if (!container || !textCanvas || !glCanvas) return;

    const gl = glCanvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) {
      console.warn("WebGL2 unavailable — particle canvas disabled.");
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;
    let bufW = 0;
    let bufH = 0;
    let rafId = 0;

    let textColor = "#f5f0e8";
    let goldColor = "#e8a317";

    let mouseX = -1;
    let mouseY = -1;

    // Compile programs once
    const updateVS = compileShader(gl, gl.VERTEX_SHADER, UPDATE_VERT);
    const updateFS = compileShader(gl, gl.FRAGMENT_SHADER, UPDATE_FRAG);
    const updateProg = linkProgram(gl, updateVS, updateFS, ["v_position", "v_velocity"]);

    const renderVS = compileShader(gl, gl.VERTEX_SHADER, RENDER_VERT);
    const renderFS = compileShader(gl, gl.FRAGMENT_SHADER, RENDER_FRAG);
    const renderProg = linkProgram(gl, renderVS, renderFS);

    // Attribute / uniform locations
    const uA = {
      position: gl.getAttribLocation(updateProg, "a_position"),
      velocity: gl.getAttribLocation(updateProg, "a_velocity"),
    };
    const uU = {
      resolution: gl.getUniformLocation(updateProg, "u_resolution"),
      mouse: gl.getUniformLocation(updateProg, "u_mouse"),
      collision: gl.getUniformLocation(updateProg, "u_collision"),
    };
    const rA = {
      position: gl.getAttribLocation(renderProg, "a_position"),
    };
    const rU = {
      resolution: gl.getUniformLocation(renderProg, "u_resolution"),
    };

    // Position/velocity ping-pong buffers
    const posBuffers: WebGLBuffer[] = [gl.createBuffer()!, gl.createBuffer()!];
    const velBuffers: WebGLBuffer[] = [gl.createBuffer()!, gl.createBuffer()!];
    const vaos: WebGLVertexArrayObject[] = [gl.createVertexArray()!, gl.createVertexArray()!];
    const renderVaos: WebGLVertexArrayObject[] = [gl.createVertexArray()!, gl.createVertexArray()!];

    let activeIdx = 0; // which buffer set is the current "input"
    let particlesInitialized = false;
    let textTexture: WebGLTexture | null = null;
    const textBitmapCanvas = document.createElement("canvas");

    function initParticleBuffers() {
      // Allocate ~80MB per buffer at 5M particles (vec2 float32 each).
      // Done once on init; resize doesn't re-init particles to avoid the
      // 100MB+ allocation churn — particles just continue with their state.
      const positions = new Float32Array(PARTICLE_COUNT * 2);
      const velocities = new Float32Array(PARTICLE_COUNT * 2);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = SPEED * (0.5 + Math.random());
        positions[i * 2] = Math.random() * w;
        positions[i * 2 + 1] = Math.random() * h;
        velocities[i * 2] = Math.cos(angle) * spd;
        velocities[i * 2 + 1] = Math.sin(angle) * spd;
      }

      for (let i = 0; i < 2; i++) {
        gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuffers[i]);
        gl!.bufferData(gl!.ARRAY_BUFFER, positions, gl!.DYNAMIC_COPY);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, velBuffers[i]);
        gl!.bufferData(gl!.ARRAY_BUFFER, velocities, gl!.DYNAMIC_COPY);
      }

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

      // Render VAOs (just position attribute)
      for (let i = 0; i < 2; i++) {
        gl!.bindVertexArray(renderVaos[i]);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuffers[i]);
        gl!.enableVertexAttribArray(rA.position);
        gl!.vertexAttribPointer(rA.position, 2, gl!.FLOAT, false, 0, 0);
      }

      gl!.bindVertexArray(null);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, null);
      particlesInitialized = true;
    }

    function rebuildText() {
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
      textColor = containerStyle.getPropertyValue("--white").trim() || "#f5f0e8";
      goldColor = containerStyle.getPropertyValue("--coin").trim() || "#e8a317";

      // Render text to visible 2D canvas
      const tCtx = textCanvas!.getContext("2d")!;
      tCtx.clearRect(0, 0, bufW, bufH);
      tCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const prefix = "ANYTHING BUT ";
      const highlight = "ANALOG";
      const fontSize = w >= 768 ? 56 : 20;
      const fontStr = `bold ${fontSize}px Jost, sans-serif`;
      tCtx.font = fontStr;
      tCtx.textAlign = "left";
      tCtx.textBaseline = "middle";
      tCtx.letterSpacing = "0.1em";
      const prefixWidth = tCtx.measureText(prefix).width;
      const highlightWidth = tCtx.measureText(highlight).width;
      const totalWidth = prefixWidth + highlightWidth;
      const startX = (w - totalWidth) / 2;
      const centerY = h / 2;
      tCtx.fillStyle = textColor;
      tCtx.fillText(prefix, startX, centerY);
      tCtx.fillStyle = goldColor;
      tCtx.fillText(highlight, startX + prefixWidth, centerY);

      // Render same text to a CSS-pixel-sized canvas for the collision texture.
      // GPU sampler reads alpha; smaller texture is fine since collision
      // doesn't need device-pixel precision.
      textBitmapCanvas.width = w;
      textBitmapCanvas.height = h;
      const cCtx = textBitmapCanvas.getContext("2d")!;
      cCtx.clearRect(0, 0, w, h);
      cCtx.font = fontStr;
      cCtx.textAlign = "left";
      cCtx.textBaseline = "middle";
      cCtx.letterSpacing = "0.1em";
      cCtx.fillStyle = "white";
      cCtx.fillText(prefix, startX, centerY);
      cCtx.fillText(highlight, startX + prefixWidth, centerY);

      // Upload alpha channel as R8 texture
      const collisionData = cCtx.getImageData(0, 0, w, h).data;
      const r8 = new Uint8Array(w * h);
      for (let i = 0; i < r8.length; i++) r8[i] = collisionData[i * 4 + 3];

      if (textTexture) gl!.deleteTexture(textTexture);
      textTexture = gl!.createTexture();
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, textTexture);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.R8, w, h, 0, gl!.RED, gl!.UNSIGNED_BYTE, r8);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);

      if (!particlesInitialized) initParticleBuffers();
    }

    function tick() {
      if (!particlesInitialized || !textTexture) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const inIdx = activeIdx;
      const outIdx = 1 - activeIdx;

      // ===== Physics pass with transform feedback =====
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

      // ===== Render pass =====
      gl!.useProgram(renderProg);
      gl!.uniform2f(rU.resolution, w, h);
      gl!.bindVertexArray(renderVaos[outIdx]);

      gl!.clearColor(0, 0, 0, 0); // transparent — text canvas underneath shows through
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.enable(gl!.BLEND);
      gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.drawArrays(gl!.POINTS, 0, PARTICLE_COUNT);

      gl!.bindVertexArray(null);

      activeIdx = outIdx;
      rafId = requestAnimationFrame(tick);
    }

    rebuildText();
    rafId = requestAnimationFrame(tick);

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(rebuildText, 150);
    });
    ro.observe(container);

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
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      ro.disconnect();
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      // GL cleanup
      if (textTexture) gl.deleteTexture(textTexture);
      posBuffers.forEach((b) => gl.deleteBuffer(b));
      velBuffers.forEach((b) => gl.deleteBuffer(b));
      vaos.forEach((v) => gl.deleteVertexArray(v));
      renderVaos.forEach((v) => gl.deleteVertexArray(v));
      gl.deleteProgram(updateProg);
      gl.deleteProgram(renderProg);
      gl.deleteShader(updateVS);
      gl.deleteShader(updateFS);
      gl.deleteShader(renderVS);
      gl.deleteShader(renderFS);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative my-12 overflow-hidden snap-start"
      style={{
        left: "calc(50% - 50vw)",
        width: "100vw",
        height: "100dvh",
        backgroundColor: "var(--black)",
      }}
    >
      <canvas ref={textCanvasRef} className="absolute inset-0" />
      <canvas ref={glCanvasRef} className="absolute inset-0" />
    </div>
  );
}

import type { Action } from 'svelte/action';

const SPEED = 0.3;
const DEFAULT_REPEL_RADIUS = 180;
// Repel was 1.0 — cursor visibly dragged through the field on lower-end
// hardware because particles couldn't get out of the way in time. 3.0
// pushes them clear within a couple of frames; the (falloff*falloff) curve
// keeps the effect localized so far-away particles aren't disturbed.
const REPEL_STRENGTH = 3.0;
const DAMPING = 0.85;

function pickParticleCount(): { count: number; animate: boolean } {
  if (typeof window === 'undefined') return { count: 120_000, animate: true };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

const glf = (n: number): string => (Number.isInteger(n) ? `${n}.0` : `${n}`);

const buildUpdateVert = (repelRadius: number) => `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_velocity;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_dt;
uniform sampler2D u_collision;

out vec2 v_position;
out vec2 v_velocity;

void main() {
  vec2 pos = a_position;
  vec2 vel = a_velocity;

  if (u_mouse.x >= 0.0) {
    vec2 diff = pos - u_mouse;
    float distSq = dot(diff, diff);
    float radiusSq = ${glf(repelRadius)} * ${glf(repelRadius)};
    if (distSq < radiusSq && distSq > 0.5) {
      float dist = sqrt(distSq);
      float falloff = 1.0 - dist / ${glf(repelRadius)};
      // u_dt expressed in 60fps-frame units — at 30fps it's 2, so each tick
      // integrates two frames of repel impulse + position advance. Keeps the
      // cursor responsiveness frame-rate independent.
      float force = falloff * falloff * ${glf(REPEL_STRENGTH)} * u_dt;
      vel += (diff / dist) * force;
    }
  }

  pos += vel * u_dt;

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

  float speedSq = dot(vel, vel);
  float minSq = (${glf(SPEED)} * 0.3) * (${glf(SPEED)} * 0.3);
  if (speedSq < minSq) {
    float angle = atan(vel.y, vel.x);
    vel = vec2(cos(angle), sin(angle)) * (${glf(SPEED)} * 0.5);
  }

  if (pos.x < 1.0)                    { pos.x = 1.0;                   vel.x =  abs(vel.x); }
  if (pos.x > u_resolution.x - 1.0)   { pos.x = u_resolution.x - 1.0;  vel.x = -abs(vel.x); }
  if (pos.y < 1.0)                    { pos.y = 1.0;                   vel.y =  abs(vel.y); }
  if (pos.y > u_resolution.y - 1.0)   { pos.y = u_resolution.y - 1.0;  vel.y = -abs(vel.y); }

  v_position = pos;
  v_velocity = vel;
  gl_Position = vec4(0.0);
}
`;

const UPDATE_FRAG = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() { outColor = vec4(0.0); }
`;

const RENDER_VERT = `#version 300 es
precision highp float;

in vec2 a_position;
in vec3 a_color;

uniform vec2 u_resolution;
uniform float u_pointSize;
uniform vec2 u_goldCenter;
uniform float u_goldRadius;
uniform vec3 u_goldColor;
uniform float u_goldVicinity;

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
  transformFeedbackVaryings?: string[],
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

export interface ParticleTextParams {
  // The container div node (needed for sizing + mouse events)
  container: HTMLDivElement;
  // The hidden text canvas node (for rendering text bitmap)
  textCanvas: HTMLCanvasElement;
  countOverride?: number;
  hideText?: boolean;
  pointSize?: number;
  repelRadius?: number;
  lowDpr?: boolean;
  // Fixed RGB (0-255 each) for every particle — used by the homepage analog
  // card to match the day21 sketch's --black. Omit on /anything-but-analog
  // to keep the original random gray field.
  color?: [number, number, number];
}

export const particleText: Action<HTMLCanvasElement, ParticleTextParams> = (node, initialParams) => {
  const params = initialParams;
  const { container, textCanvas, countOverride, hideText = false, pointSize = 1.0, repelRadius, lowDpr = false, color } = params;

  const dpr = lowDpr ? 1 : (window.devicePixelRatio || 1);
  const picked = pickParticleCount();
  const PARTICLE_COUNT = countOverride ?? picked.count;
  const animate = picked.animate;
  const textBitmapCanvas = document.createElement('canvas');
  const viewportDefault =
    window.innerWidth < 768 ? DEFAULT_REPEL_RADIUS * 0.7 : DEFAULT_REPEL_RADIUS;
  const effectiveRepelRadius = repelRadius ?? viewportDefault;

  let w = 0;
  let h = 0;
  let bufW = 0;
  let bufH = 0;
  let rafId = 0;
  let isVisible = false;
  let textColor = '#f5f0e8';
  let mouseX = -1;
  let mouseY = -1;
  let rectLeft = 0;
  let rectTop = 0;
  let activeIdx = 0;
  let particlesInitialized = false;
  let collisionMask: Uint8Array | null = null;

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
    dt: null as WebGLUniformLocation | null,
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
  const goldCircle = { cx: 0, cy: 0, r: 0 };
  const goldRGB: [number, number, number] = [0, 0, 0];
  let goldVicinity = 0;

  function setupGL(): boolean {
    gl = node.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) return false;

    updateVS = compileShader(gl, gl.VERTEX_SHADER, buildUpdateVert(effectiveRepelRadius));
    updateFS = compileShader(gl, gl.FRAGMENT_SHADER, UPDATE_FRAG);
    updateProg = linkProgram(gl, updateVS, updateFS, ['v_position', 'v_velocity']);

    renderVS = compileShader(gl, gl.VERTEX_SHADER, RENDER_VERT);
    renderFS = compileShader(gl, gl.FRAGMENT_SHADER, RENDER_FRAG);
    renderProg = linkProgram(gl, renderVS, renderFS);

    uA = {
      position: gl.getAttribLocation(updateProg, 'a_position'),
      velocity: gl.getAttribLocation(updateProg, 'a_velocity'),
    };
    uU = {
      resolution: gl.getUniformLocation(updateProg, 'u_resolution'),
      mouse: gl.getUniformLocation(updateProg, 'u_mouse'),
      dt: gl.getUniformLocation(updateProg, 'u_dt'),
      collision: gl.getUniformLocation(updateProg, 'u_collision'),
    };
    rA = {
      position: gl.getAttribLocation(renderProg, 'a_position'),
      color: gl.getAttribLocation(renderProg, 'a_color'),
    };
    rU = {
      resolution: gl.getUniformLocation(renderProg, 'u_resolution'),
      pointSize: gl.getUniformLocation(renderProg, 'u_pointSize'),
      goldCenter: gl.getUniformLocation(renderProg, 'u_goldCenter'),
      goldRadius: gl.getUniformLocation(renderProg, 'u_goldRadius'),
      goldColor: gl.getUniformLocation(renderProg, 'u_goldColor'),
      goldVicinity: gl.getUniformLocation(renderProg, 'u_goldVicinity'),
    };

    posBuffers = [gl.createBuffer()!, gl.createBuffer()!];
    velBuffers = [gl.createBuffer()!, gl.createBuffer()!];
    colorBuffer = gl.createBuffer();
    vaos = [gl.createVertexArray()!, gl.createVertexArray()!];
    renderVaos = [gl.createVertexArray()!, gl.createVertexArray()!];

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
    console.warn('WebGL2 unavailable — particle canvas disabled.');
    return {};
  }

  function initParticleBuffers() {
    const positions = new Float32Array(PARTICLE_COUNT * 2);
    const velocities = new Float32Array(PARTICLE_COUNT * 2);
    const colors = new Uint8Array(PARTICLE_COUNT * 3);

    const grayRange = GRAY_MAX - GRAY_MIN;
    const mask = collisionMask;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let px = Math.random() * w;
      let py = Math.random() * h;
      if (mask) {
        let ok = false;
        for (let retry = 0; retry < 12; retry++) {
          const cx = Math.min(w - 1, Math.floor(px));
          const cy = Math.min(h - 1, Math.floor(py));
          if (mask[cy * w + cx] < 50) { ok = true; break; }
          px = Math.random() * w;
          py = Math.random() * h;
        }
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

      if (color) {
        colors[i * 3] = color[0];
        colors[i * 3 + 1] = color[1];
        colors[i * 3 + 2] = color[2];
      } else {
        const g = (GRAY_MIN + Math.random() * grayRange) | 0;
        colors[i * 3] = g;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = g;
      }
    }

    for (let i = 0; i < 2; i++) {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuffers[i]);
      gl!.bufferData(gl!.ARRAY_BUFFER, positions, gl!.DYNAMIC_COPY);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, velBuffers[i]);
      gl!.bufferData(gl!.ARRAY_BUFFER, velocities, gl!.DYNAMIC_COPY);
    }
    gl!.bindBuffer(gl!.ARRAY_BUFFER, colorBuffer);
    gl!.bufferData(gl!.ARRAY_BUFFER, colors, gl!.STATIC_DRAW);

    for (let i = 0; i < 2; i++) {
      gl!.bindVertexArray(vaos[i]);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuffers[i]);
      gl!.enableVertexAttribArray(uA.position);
      gl!.vertexAttribPointer(uA.position, 2, gl!.FLOAT, false, 0, 0);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, velBuffers[i]);
      gl!.enableVertexAttribArray(uA.velocity);
      gl!.vertexAttribPointer(uA.velocity, 2, gl!.FLOAT, false, 0, 0);
    }

    for (let i = 0; i < 2; i++) {
      gl!.bindVertexArray(renderVaos[i]);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuffers[i]);
      gl!.enableVertexAttribArray(rA.position);
      gl!.vertexAttribPointer(rA.position, 2, gl!.FLOAT, false, 0, 0);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, colorBuffer);
      gl!.enableVertexAttribArray(rA.color);
      gl!.vertexAttribPointer(rA.color, 3, gl!.UNSIGNED_BYTE, true, 0, 0);
    }

    gl!.bindVertexArray(null);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, null);
    particlesInitialized = true;
  }

  function updateRect() {
    const rect = container.getBoundingClientRect();
    rectLeft = rect.left;
    rectTop = rect.top;
  }

  function rebuildText() {
    if (!gl) return;
    w = container.offsetWidth;
    h = container.offsetHeight;
    if (w === 0 || h === 0) return;

    bufW = w * dpr;
    bufH = h * dpr;

    textCanvas.width = bufW;
    textCanvas.height = bufH;
    textCanvas.style.width = `${w}px`;
    textCanvas.style.height = `${h}px`;

    node.width = bufW;
    node.height = bufH;
    node.style.width = `${w}px`;
    node.style.height = `${h}px`;
    gl.viewport(0, 0, bufW, bufH);

    const containerStyle = getComputedStyle(container);
    textColor = containerStyle.getPropertyValue('--black').trim() || '#111';

    const tCtx = textCanvas.getContext('2d')!;
    tCtx.clearRect(0, 0, bufW, bufH);
    tCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const r8 = new Uint8Array(w * h);
    goldCircle.cx = goldCircle.cy = goldCircle.r = 0;

    if (!hideText) {
      const whiteColor =
        getComputedStyle(container).getPropertyValue('--white').trim() || '#f5f4f0';

      const stacked = w < 768;

      const textBitmapCtx = () => {
        textBitmapCanvas.width = w;
        textBitmapCanvas.height = h;
        return textBitmapCanvas.getContext('2d', { willReadFrequently: true })!;
      };

      if (stacked) {
        const lines = ['ANYTHING', 'BUT', 'ANALOG'];
        const leftPadFrac = 0.08;
        const lineHeight = 1.2;
        const widthBudget = w * 0.75;
        const heightBudget = h * 0.55;
        const sizeFromW = widthBudget / 6.5;
        const sizeFromH = heightBudget / (lines.length * lineHeight);
        const fontSize = Math.max(22, Math.min(120, Math.min(sizeFromW, sizeFromH)));
        const fontStr = `bold ${fontSize}px Jost, sans-serif`;
        tCtx.font = fontStr;
        tCtx.textAlign = 'left';
        tCtx.textBaseline = 'middle';
        tCtx.letterSpacing = '0.1em';

        const cCtx = textBitmapCtx();
        cCtx.font = fontStr;
        cCtx.textAlign = 'left';
        cCtx.textBaseline = 'middle';
        cCtx.letterSpacing = '0.1em';
        cCtx.fillStyle = 'white';

        const startX = w * leftPadFrac;
        const yAt = (i: number) => (h * (i + 1)) / (lines.length + 1);

        for (let i = 0; i < lines.length; i++) {
          tCtx.fillStyle = lines[i] === 'ANALOG' ? whiteColor : textColor;
          tCtx.fillText(lines[i], startX, yAt(i));
        }

        const analogIdx = lines.indexOf('ANALOG');
        const analogWidth = tCtx.measureText('ANALOG').width;
        goldCircle.cx = startX + analogWidth / 2;
        goldCircle.cy = yAt(analogIdx);
        goldCircle.r = analogWidth * 0.65;
        goldVicinity = goldCircle.r * 0.5;

        for (let i = 0; i < lines.length; i++) {
          cCtx.fillText(lines[i], startX, yAt(i));
        }

        const collisionData = cCtx.getImageData(0, 0, w, h).data;
        for (let i = 0; i < r8.length; i++) r8[i] = collisionData[i * 4 + 3];
        collisionMask = r8;
      } else {
        const prefix = 'ANYTHING BUT ';
        const highlight = 'ANALOG';
        let fontSize: number;
        if (w >= 1920) fontSize = 120;
        else if (w >= 1280) fontSize = 96;
        else fontSize = 72;
        const fontStr = `bold ${fontSize}px Jost, sans-serif`;
        tCtx.font = fontStr;
        tCtx.textAlign = 'left';
        tCtx.textBaseline = 'middle';
        tCtx.letterSpacing = '0.1em';

        const cCtx = textBitmapCtx();
        cCtx.font = fontStr;
        cCtx.textAlign = 'left';
        cCtx.textBaseline = 'middle';
        cCtx.letterSpacing = '0.1em';
        cCtx.fillStyle = 'white';

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

        const collisionData = cCtx.getImageData(0, 0, w, h).data;
        for (let i = 0; i < r8.length; i++) r8[i] = collisionData[i * 4 + 3];
        collisionMask = r8;
      }
    } else {
      collisionMask = null;
    }

    if (textTexture) gl.deleteTexture(textTexture);
    textTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, r8);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    if (!particlesInitialized) initParticleBuffers();
    updateRect();
  }

  let lastTickT = performance.now();

  function tick() {
    rafId = 0;
    if (!gl || !particlesInitialized || !textTexture || !isVisible) return;

    const now = performance.now();
    // dt in 60fps-frame units, clamped so a tab-switch resume doesn't
    // teleport particles. Lets mobile (30fps) feel as snappy as desktop:
    // shader integrates two frames of repel + advance per tick.
    const dt = Math.min((now - lastTickT) / 16.67, 3);
    lastTickT = now;

    const inIdx = activeIdx;
    const outIdx = animate ? 1 - activeIdx : activeIdx;

    if (animate) {
      gl.useProgram(updateProg);
      gl.uniform2f(uU.resolution, w, h);
      gl.uniform2f(uU.mouse, mouseX, mouseY);
      gl.uniform1f(uU.dt, dt);
      gl.uniform1i(uU.collision, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textTexture);

      gl.bindVertexArray(vaos[inIdx]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, posBuffers[outIdx]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, velBuffers[outIdx]);
      gl.enable(gl.RASTERIZER_DISCARD);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
      gl.endTransformFeedback();
      gl.disable(gl.RASTERIZER_DISCARD);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
    }

    gl.useProgram(renderProg);
    gl.uniform2f(rU.resolution, w, h);
    gl.uniform1f(rU.pointSize, pointSize * dpr);
    gl.uniform2f(rU.goldCenter, goldCircle.cx, goldCircle.cy);
    gl.uniform1f(rU.goldRadius, goldCircle.r);
    gl.uniform3f(rU.goldColor, goldRGB[0], goldRGB[1], goldRGB[2]);
    gl.uniform1f(rU.goldVicinity, goldVicinity);
    gl.bindVertexArray(renderVaos[outIdx]);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
    gl.bindVertexArray(null);

    activeIdx = outIdx;
    if (animate) rafId = requestAnimationFrame(tick);
  }

  function startTick() {
    if (rafId || !gl) return;
    rafId = requestAnimationFrame(tick);
  }

  function onContextLost(e: Event) {
    e.preventDefault();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    teardownGL();
  }
  function onContextRestored() {
    if (setupGL()) {
      rebuildText();
      if (isVisible) startTick();
    }
  }
  node.addEventListener('webglcontextlost', onContextLost);
  node.addEventListener('webglcontextrestored', onContextRestored);

  rebuildText();

  let resizeTimeout: ReturnType<typeof setTimeout>;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(rebuildText, 150);
  });
  ro.observe(container);

  const io = new IntersectionObserver(
    (entries) => {
      const wasVisible = isVisible;
      isVisible = entries[0]?.isIntersecting ?? true;
      if (isVisible && !wasVisible) startTick();
    },
    { threshold: 0 },
  );
  io.observe(container);

  const onMove = (e: PointerEvent) => {
    // Read rect on every move: parents may translate (e.g. Gallery
    // auto-scroll uses transform: translate3d, which doesn't fire scroll
    // and would leave a cached rect stale). pointermove is throttled by
    // the browser, so the layout read here is bounded.
    const rect = container.getBoundingClientRect();
    rectLeft = rect.left;
    rectTop = rect.top;
    mouseX = e.clientX - rectLeft;
    mouseY = e.clientY - rectTop;
  };
  const onLeave = () => {
    mouseX = -1;
    mouseY = -1;
  };
  container.addEventListener('pointermove', onMove);
  container.addEventListener('pointerleave', onLeave);
  window.addEventListener('scroll', updateRect, { passive: true });

  return {
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      ro.disconnect();
      io.disconnect();
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', updateRect);
      node.removeEventListener('webglcontextlost', onContextLost);
      node.removeEventListener('webglcontextrestored', onContextRestored);
      teardownGL();
    },
  };
};

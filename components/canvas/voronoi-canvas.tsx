"use client";

import { useEffect, useRef } from "react";

const SCALE_DESKTOP = 4.0;
const SCALE_MOBILE = 5.6;
const MOBILE_BREAK = 640;

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
  uniform vec2 uCell0;
  uniform vec2 uCell1;
  uniform vec2 uCell2;
  uniform vec2 uCell3;
  uniform float uScale;
  uniform sampler2D uImage;
  uniform float uHasImage;
  uniform float uImageAspect;

  varying vec2 vUv;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  // Rounded box SDF
  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + r;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
  }

  float letterS(vec2 p) {
    float d = 1e5;
    float w = 0.05;
    float r = 0.03;
    d = min(d, sdRoundBox(p - vec2(0.0, 0.50), vec2(0.25, w), r));
    d = min(d, sdRoundBox(p - vec2(-0.20, 0.25), vec2(w, 0.25), r));
    d = min(d, sdRoundBox(p - vec2(0.0, 0.0), vec2(0.25, w), r));
    d = min(d, sdRoundBox(p - vec2(0.20, -0.25), vec2(w, 0.25), r));
    d = min(d, sdRoundBox(p - vec2(0.0, -0.50), vec2(0.25, w), r));
    return d;
  }

  float letterE(vec2 p) {
    float d = 1e5;
    float w = 0.05;
    float r = 0.03;
    d = min(d, sdRoundBox(p - vec2(-0.20, 0.0), vec2(w, 0.55), r));
    d = min(d, sdRoundBox(p - vec2(0.05, 0.50), vec2(0.25, w), r));
    d = min(d, sdRoundBox(p - vec2(0.0, 0.0), vec2(0.20, w), r));
    d = min(d, sdRoundBox(p - vec2(0.05, -0.50), vec2(0.25, w), r));
    return d;
  }

  float letterL(vec2 p) {
    float d = 1e5;
    float w = 0.05;
    float r = 0.03;
    d = min(d, sdRoundBox(p - vec2(-0.20, 0.0), vec2(w, 0.55), r));
    d = min(d, sdRoundBox(p - vec2(0.05, -0.50), vec2(0.25, w), r));
    return d;
  }

  float letterF(vec2 p) {
    float d = 1e5;
    float w = 0.05;
    float r = 0.03;
    d = min(d, sdRoundBox(p - vec2(-0.20, 0.0), vec2(w, 0.55), r));
    d = min(d, sdRoundBox(p - vec2(0.05, 0.50), vec2(0.25, w), r));
    d = min(d, sdRoundBox(p - vec2(0.0, 0.0), vec2(0.20, w), r));
    return d;
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float aspect = uResolution.x / uResolution.y;

    vec2 p = vec2(uv.x * aspect, uv.y) * uScale;
    vec2 mouse = vec2(uMouse.x * aspect, uMouse.y) * uScale;

    // Voronoi with cell center + grid tracking
    vec2 ip = floor(p);
    vec2 fp = fract(p);

    float d1 = 8.0;
    float d2 = 8.0;
    float cellId = 0.0;
    vec2 nearestCenter = vec2(0.0);
    vec2 nearestGrid = vec2(0.0);

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 o = hash2(ip + neighbor);

        vec2 cellWorld = ip + neighbor + o;
        vec2 toMouse = cellWorld - mouse;
        float mouseDist = length(toMouse);
        float push = uInfluence * smoothstep(5.0, 0.0, mouseDist) * 0.2;
        o += normalize(toMouse + 0.001) * push;

        vec2 diff = neighbor + o - fp;
        float dist = length(diff);

        if (dist < d1) {
          d2 = d1;
          d1 = dist;
          cellId = dot(ip + neighbor, vec2(7.0, 113.0));
          nearestCenter = ip + neighbor + o;
          nearestGrid = ip + neighbor;
        } else if (dist < d2) {
          d2 = dist;
        }
      }
    }

    float f1 = d1;
    float f2 = d2;
    float edge = smoothstep(0.06, 0.10, f2 - f1);

    // Mirror surface
    vec3 white = uInvert > 0.5 ? uBotColor : uTopColor;
    vec3 shadow = vec3(0.75, 0.75, 0.77);
    vec3 silver = mix(shadow, white, 0.5);
    vec3 highlight = white;

    float envAngle = atan(f2 - f1, f1) + uv.y * 3.0;
    float envReflect = smoothstep(-0.1, 0.1, sin(envAngle * 4.0));

    float spec = pow(max(0.0, 1.0 - f1 * 3.0), 6.0);
    float fresnel = pow(1.0 - edge, 2.0);

    // Image sampling at fragment position (contain fit — preserve full image)
    vec2 canvasUv = vUv;
    vec2 texUv = canvasUv;
    if (uImageAspect > aspect) {
      texUv.y = (canvasUv.y - 0.5) * (uImageAspect / aspect) + 0.5;
    } else {
      texUv.x = (canvasUv.x - 0.5) * (aspect / uImageAspect) + 0.5;
    }
    bool insideImage = uHasImage > 0.5
                       && texUv.x >= 0.0 && texUv.x <= 1.0
                       && texUv.y >= 0.0 && texUv.y <= 1.0;

    vec3 base;
    if (insideImage) {
      vec3 imgColor = texture2D(uImage, texUv).rgb;
      base = imgColor;
    } else {
      base = mix(shadow, silver, edge);
      base = mix(base, highlight, envReflect * 0.4);
      base += spec * highlight * 0.5;
      base += fresnel * silver * 0.2;
    }

    // Cell strokes
    float edgeLine = 1.0 - smoothstep(0.04, 0.06, f2 - f1);
    vec3 black = uInvert > 0.5 ? uTopColor : uBotColor;
    base = mix(base, black, edgeLine);

    // Letter rendering — check if current cell is a letter cell
    int letterIdx = -1;
    if (length(nearestGrid - uCell0) < 0.1) letterIdx = 0;
    else if (length(nearestGrid - uCell1) < 0.1) letterIdx = 1;
    else if (length(nearestGrid - uCell2) < 0.1) letterIdx = 2;
    else if (length(nearestGrid - uCell3) < 0.1) letterIdx = 3;

    if (letterIdx >= 0) {
      // Entire letter cell is solid black (including edges)
      base = black;

      vec2 lp = (p - nearestCenter) * vec2(2.8, -2.8);
      float sd = 1e5;
      if (letterIdx == 0) sd = letterS(lp);
      else if (letterIdx == 1) sd = letterE(lp);
      else if (letterIdx == 2) sd = letterL(lp);
      else sd = letterF(lp);
      float mask = 1.0 - smoothstep(0.0, 0.03, sd);
      base = mix(base, shadow, mask);
    }

    // Edge fade
    float edgeFade = smoothstep(0.0, 0.08, uv.x)
                   * smoothstep(0.0, 0.08, 1.0 - uv.x)
                   * smoothstep(0.0, 0.08, uv.y)
                   * smoothstep(0.0, 0.08, 1.0 - uv.y);
    vec3 bg = uInvert > 0.5 ? uTopColor : uBotColor;
    base = mix(bg, base, edgeFade);

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

// Replicate GLSL hash on CPU to find cell centers
function jsHash2(px: number, py: number): [number, number] {
  const ax = Math.sin(px * 127.1 + py * 311.7) * 43758.5453123;
  const ay = Math.sin(px * 269.5 + py * 183.3) * 43758.5453123;
  return [ax - Math.floor(ax), ay - Math.floor(ay)];
}

function findLetterCells(aspect: number, letterCount: number, scale: number) {
  const maxX = aspect * scale;
  const maxY = scale;

  const cells: { gx: number; gy: number; cx: number; cy: number }[] = [];

  for (let iy = -1; iy <= Math.ceil(maxY) + 1; iy++) {
    for (let ix = -1; ix <= Math.ceil(maxX) + 1; ix++) {
      const [hx, hy] = jsHash2(ix, iy);
      const cx = ix + hx;
      const cy = iy + hy;
      // Only cells well within visible area
      if (cx > 0.5 && cx < maxX - 0.5 && cy > 0.5 && cy < maxY - 0.5) {
        cells.push({ gx: ix, gy: iy, cx, cy });
      }
    }
  }

  // Pick one cell per horizontal section, closest to vertical center
  const selected: typeof cells = [];
  const sectionWidth = maxX / letterCount;

  for (let i = 0; i < letterCount; i++) {
    const targetX = sectionWidth * (i + 0.5);
    const targetY = maxY / 2;

    let best = cells[0];
    let bestDist = Infinity;

    for (const cell of cells) {
      if (selected.some((s) => s.gx === cell.gx && s.gy === cell.gy)) continue;
      const dx = cell.cx - targetX;
      const dy = (cell.cy - targetY) * 2;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = cell;
      }
    }

    selected.push(best);
  }

  return selected;
}

interface VoronoiCanvasProps {
  invert?: boolean;
  showLetters?: boolean;
  imageSrc?: string;
}

function parseHex(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function VoronoiCanvas({ invert = false, showLetters = true, imageSrc }: VoronoiCanvasProps) {
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
    const uCell0 = gl.getUniformLocation(program, "uCell0");
    const uCell1 = gl.getUniformLocation(program, "uCell1");
    const uCell2 = gl.getUniformLocation(program, "uCell2");
    const uCell3 = gl.getUniformLocation(program, "uCell3");
    const uScale = gl.getUniformLocation(program, "uScale");
    const uImage = gl.getUniformLocation(program, "uImage");
    const uHasImage = gl.getUniformLocation(program, "uHasImage");
    const uImageAspect = gl.getUniformLocation(program, "uImageAspect");

    gl.uniform1f(uInvert, invert ? 1.0 : 0.0);
    gl.uniform3fv(uTopColor, topColor);
    gl.uniform3fv(uBotColor, botColor);
    gl.uniform1i(uImage, 0);
    gl.uniform1f(uHasImage, 0.0);
    gl.uniform1f(uImageAspect, 1.0);

    let needsRender = true;
    let texture: WebGLTexture | null = null;
    if (imageSrc) {
      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
        gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 0]),
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        gl!.activeTexture(gl!.TEXTURE0);
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
        gl!.texImage2D(
          gl!.TEXTURE_2D, 0, gl!.RGBA,
          gl!.RGBA, gl!.UNSIGNED_BYTE, img,
        );
        gl!.uniform1f(uImageAspect, img.width / img.height);
        gl!.uniform1f(uHasImage, 1.0);
        needsRender = true;
      };
      img.src = imageSrc;
    }

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

      const scale = canvas.offsetWidth < MOBILE_BREAK ? SCALE_MOBILE : SCALE_DESKTOP;
      gl!.uniform1f(uScale, scale);

      if (showLetters) {
        const aspect = canvas.width / canvas.height;
        const cells = findLetterCells(aspect, 4, scale);
        gl!.uniform2f(uCell0, cells[0].gx, cells[0].gy);
        gl!.uniform2f(uCell1, cells[1].gx, cells[1].gy);
        gl!.uniform2f(uCell2, cells[2].gx, cells[2].gy);
        gl!.uniform2f(uCell3, cells[3].gx, cells[3].gy);
      } else {
        gl!.uniform2f(uCell0, -999.0, -999.0);
        gl!.uniform2f(uCell1, -999.0, -999.0);
        gl!.uniform2f(uCell2, -999.0, -999.0);
        gl!.uniform2f(uCell3, -999.0, -999.0);
      }
      needsRender = true;
    }

    resize();
    window.addEventListener("resize", resize);

    const observer = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting; },
      { threshold: 0 },
    );
    observer.observe(canvas);

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
      if (texture) gl.deleteTexture(texture);
    };
  }, [invert, imageSrc]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
    />
  );
}

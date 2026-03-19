"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";
import type { AudioBands } from "@/components/audio/audio-reactive-provider";
import { loadGardenMathApi } from "@/lib/wasm/garden-math";

interface ParticleFlowDetail {
  spread: number;
  phaseX: number;
  phaseY: number;
  rotZ: number;
}

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAudio;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  uniform float uOnset;
  uniform float uWasmMod;
  uniform vec2 uCenter;
  attribute float aSeed;
  varying float vIntensity;
  varying float vAudio;
  varying float vBass;
  varying float vHigh;
  varying float vOnset;
  varying float vSeed;

  void main() {
    vec3 p = position;
    float audioNorm = clamp(uAudio / 1.8, 0.0, 1.0);

    // whirlpool: polar coords relative to center point
    vec2 rel = p.xy - uCenter;
    float radius = length(rel);
    float angle = atan(rel.y, rel.x);

    // spiral rotation — inner particles spin faster than outer
    float spinSpeed = 0.6 + uBass * 0.3;
    float spiralTwist = spinSpeed / (radius + 0.3);
    angle += uTime * spiralTwist;

    // radial breathing — particles drift in/out
    float drift = sin(uTime * 0.4 + aSeed * 6.2831 + radius * 2.0) * 0.15;
    radius += drift;

    // bass pulls particles inward (tightens the whirlpool)
    radius *= 1.0 - uBass * 0.08;

    // convert back to cartesian, offset by center
    p.x = cos(angle) * radius + uCenter.x;
    p.y = sin(angle) * radius + uCenter.y;

    // z-axis: wave motion + onset punch
    float wave = sin(radius * 5.0 - uTime * 1.2 + aSeed * 6.2831) * 0.2;
    float onsetPunch = uOnset * sin(aSeed * 12.566) * 0.07;
    float highJitter = uHigh * (fract(sin(aSeed * 43758.5453 + uTime * 3.0) * 43758.5453) - 0.5) * 0.06;
    p.z += wave + onsetPunch + highJitter + (uWasmMod * 0.3);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float onsetSize = 1.0 + uOnset * 0.25;
    gl_PointSize = (1.2 + (uAudio * 0.4)) * onsetSize * (150.0 / max(30.0, -mvPosition.z));

    vIntensity = clamp(0.3 + uAudio + abs(p.z) * 0.5, 0.0, 2.0);
    vAudio = audioNorm;
    vBass = uBass;
    vHigh = uHigh;
    vOnset = uOnset;
    vSeed = aSeed;
  }
`;

const FRAGMENT_SHADER = `
  uniform float uVideoMode;
  uniform float uTime;
  varying float vIntensity;
  varying float vAudio;
  varying float vBass;
  varying float vHigh;
  varying float vOnset;
  varying float vSeed;

  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;

    float rim = smoothstep(1.0, 0.0, r);
    float heat = clamp(vIntensity * 0.68, 0.0, 1.0);
    float alpha = rim * (0.55 + heat * 0.45);

    vec3 neutral = vec3(0.58, 0.58, 0.60);
    float spectrum = fract(vSeed * 6.7 + heat * 0.24);

    // color palette: bass = deep red/orange, mid = warm amber, high = white/blue
    vec3 warmA = vec3(0.54, 0.17, 0.06);  // deep ember
    vec3 warmB = vec3(0.88, 0.40, 0.12);  // orange
    vec3 warmC = vec3(1.0, 0.79, 0.36);   // hot amber
    vec3 coolTip = vec3(0.7, 0.85, 1.0);  // icy blue-white for highs

    vec3 warm = mix(warmA, warmB, smoothstep(0.0, 0.68, spectrum));
    warm = mix(warm, warmC, smoothstep(0.68, 1.0, spectrum));

    // bass deepens toward red
    warm = mix(warm, warmA, vBass * 0.4);
    // highs push toward cool tips
    warm = mix(warm, coolTip, vHigh * 0.3);

    vec3 color = mix(neutral, warm, pow(vAudio, 0.82));
    color = mix(color, warmC, heat * vAudio * 0.5);

    // onset flash — bright white burst
    color = mix(color, vec3(1.0, 0.95, 0.85), vOnset * 0.6);
    alpha = min(1.0, alpha + vOnset * 0.3);

    vec3 darkA = vec3(0.09, 0.09, 0.10);
    vec3 darkB = vec3(0.20, 0.20, 0.22);
    float darkMix = clamp(rim * 0.65 + fract(vSeed * 3.1) * 0.35, 0.0, 1.0);
    vec3 darkGradient = mix(darkA, darkB, darkMix);

    color = mix(color, darkGradient, uVideoMode);
    alpha *= mix(1.0, 0.14, uVideoMode);
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const energyRef = useRef(0);
  const bandsRef = useRef<AudioBands>({ bass: 0, mid: 0, high: 0, onset: 0 });
  const sensitivityRef = useRef(1.3);
  const smoothingRef = useRef(0.88);
  const asciiVideoActiveRef = useRef(false);
  const { energy, bands, sensitivity, smoothing } = useAudioReactive();

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    bandsRef.current = bands;
  }, [bands]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    smoothingRef.current = smoothing;
  }, [smoothing]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100,
    );
    camera.position.z = 5;

    let rafId = 0;
    let active = true;
    let smoothedAudio = 0;

    // mouse-follow state (in world units)
    const mouseTarget = { x: 0, y: 0 };
    const centerPos = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // normalize to [-1, 1] then scale to world units
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      // scale to match particle spread (~2.4 world units radius)
      mouseTarget.x = nx * 2.4;
      mouseTarget.y = ny * 2.4;
    };

    const onMouseLeave = () => {
      mouseTarget.x = 0;
      mouseTarget.y = 0;
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);
    let smoothedBass = 0;
    let smoothedMid = 0;
    let smoothedHigh = 0;
    let smoothedOnset = 0;
    let videoMode = 0;
    const clock = new THREE.Clock();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const particleCount = 12000;
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i += 1) {
      const radius = Math.pow(Math.random(), 0.35) * 8.0 + 0.1;
      const angle = Math.random() * Math.PI * 2;
      const spread = (Math.random() - 0.5) * 1.2;
      const offset = i * 3;
      positions[offset] = Math.cos(angle) * radius;
      positions[offset + 1] = Math.sin(angle) * radius;
      positions[offset + 2] = spread;
      seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uOnset: { value: 0 },
      uWasmMod: { value: 0 },
      uVideoMode: { value: 0 },
      uCenter: { value: new THREE.Vector2(0, 0) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const onAsciiVideoActive = (event: Event) => {
      const customEvent = event as CustomEvent<{ active?: boolean }>;
      asciiVideoActiveRef.current = Boolean(customEvent.detail?.active);
    };
    window.addEventListener("threesam:ascii-video-active", onAsciiVideoActive);

    let wasmWave:
      | ((x: number, y: number, time: number, audioLevel: number) => number)
      | null = null;

    void loadGardenMathApi().then((api) => {
      wasmWave = api.wave;
    });

    const render = () => {
      if (!active) return;

      const t = clock.getElapsedTime();
      const smoothingSetting = Math.max(0, Math.min(1, smoothingRef.current));
      const smoothingFactor = Math.min(0.995, smoothingSetting);
      const targetAudio = Math.max(
        0,
        Math.min(2.2, energyRef.current * sensitivityRef.current),
      );
      smoothedAudio =
        smoothedAudio * smoothingFactor + targetAudio * (1 - smoothingFactor);

      // smooth the bands (fast attack, moderate release)
      const b = bandsRef.current;
      const bandAttack = 0.3;
      const bandRelease = 0.92;
      smoothedBass = b.bass > smoothedBass
        ? smoothedBass * bandAttack + b.bass * (1 - bandAttack)
        : smoothedBass * bandRelease + b.bass * (1 - bandRelease);
      smoothedMid = b.mid > smoothedMid
        ? smoothedMid * bandAttack + b.mid * (1 - bandAttack)
        : smoothedMid * bandRelease + b.mid * (1 - bandRelease);
      smoothedHigh = b.high > smoothedHigh
        ? smoothedHigh * bandAttack + b.high * (1 - bandAttack)
        : smoothedHigh * bandRelease + b.high * (1 - bandRelease);
      // onset: fast attack, fast decay for punch
      smoothedOnset = b.onset > smoothedOnset
        ? b.onset
        : smoothedOnset * 0.85;

      // smooth lerp toward mouse target
      const ease = 0.05;
      centerPos.x += (mouseTarget.x - centerPos.x) * ease;
      centerPos.y += (mouseTarget.y - centerPos.y) * ease;
      uniforms.uCenter.value.set(centerPos.x, centerPos.y);

      uniforms.uTime.value = t;
      uniforms.uAudio.value = Math.min(0.35, smoothedAudio);
      uniforms.uBass.value = smoothedBass;
      uniforms.uMid.value = smoothedMid;
      uniforms.uHigh.value = smoothedHigh;
      uniforms.uOnset.value = smoothedOnset;

      const targetVideoMode = asciiVideoActiveRef.current ? 1 : 0;
      videoMode = videoMode * 0.88 + targetVideoMode * 0.12;
      uniforms.uVideoMode.value = videoMode;

      if (wasmWave) {
        const wasmSample =
          (wasmWave(0.17, 0.53, t, smoothedAudio) +
            wasmWave(0.42, 0.31, t, smoothedAudio) +
            wasmWave(0.88, 0.22, t, smoothedAudio)) /
          3;
        uniforms.uWasmMod.value = Math.max(-1, Math.min(1, wasmSample));
      }

      // slight tilt for depth — whirlpool handles spin in shader
      points.rotation.x = Math.sin(t * 0.15) * 0.1;

      const flowDetail: ParticleFlowDetail = {
        spread: Math.min(1, uniforms.uAudio.value / 1.8),
        phaseX: Math.sin(t * 0.5 + uniforms.uWasmMod.value),
        phaseY: Math.cos(t * 0.4 - uniforms.uWasmMod.value * 0.6),
        rotZ: points.rotation.z,
      };
      window.dispatchEvent(
        new CustomEvent("threesam:particle-flow", {
          detail: flowDetail,
        }),
      );

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    render();

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("threesam:ascii-video-active", onAsciiVideoActive);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      window.dispatchEvent(
        new CustomEvent("threesam:particle-flow", {
          detail: { spread: 0, phaseX: 0, phaseY: 0, rotZ: 0 } as ParticleFlowDetail,
        }),
      );
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden />;
}

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";
import { loadGardenMathApi } from "@/lib/wasm/garden-math";

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAudio;
  uniform float uWasmMod;
  attribute float aSeed;
  varying float vIntensity;
  varying float vAudio;
  varying float vSeed;

  void main() {
    vec3 p = position;
    float audioNorm = clamp(uAudio / 1.8, 0.0, 1.0);
    float wave = sin((p.x * 1.8) + (p.y * 1.4) + uTime * 0.7 + aSeed * 6.2831) * 0.24;
    float ring = sin(length(p.xy) * 5.0 - uTime * 1.2 + aSeed * 2.0) * 0.18;
    p.z += wave + ring * (0.6 + (uAudio * 1.5)) + (uWasmMod * 0.45);
    p.xy *= mix(1.0, 3.0, audioNorm);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (1.2 + (uAudio * 3.0)) * (150.0 / max(30.0, -mvPosition.z));
    vIntensity = clamp(0.3 + uAudio + abs(p.z) * 0.5, 0.0, 2.0);
    vAudio = audioNorm;
    vSeed = aSeed;
  }
`;

const FRAGMENT_SHADER = `
  varying float vIntensity;
  varying float vAudio;
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
    vec3 warmA = vec3(0.54, 0.17, 0.06);
    vec3 warmB = vec3(0.88, 0.40, 0.12);
    vec3 warmC = vec3(1.0, 0.79, 0.36);
    vec3 warm = mix(warmA, warmB, smoothstep(0.0, 0.68, spectrum));
    warm = mix(warm, warmC, smoothstep(0.68, 1.0, spectrum));

    vec3 color = mix(neutral, warm, pow(vAudio, 0.82));
    color = mix(color, warmC, heat * vAudio * 0.5);
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const energyRef = useRef(0);
  const sensitivityRef = useRef(1.3);
  const smoothingRef = useRef(0.88);
  const { energy, sensitivity, smoothing } = useAudioReactive();

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

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
      const radius = Math.pow(Math.random(), 0.45) * 2.2 + 0.2;
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
      uWasmMod: { value: 0 },
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
      const smoothingFactor =
        smoothingSetting >= 0.999 ? 0 : Math.min(0.98, smoothingSetting);
      const targetAudio = Math.max(
        0,
        Math.min(2.2, energyRef.current * sensitivityRef.current),
      );
      smoothedAudio =
        smoothedAudio * smoothingFactor + targetAudio * (1 - smoothingFactor);
      uniforms.uTime.value = t;
      uniforms.uAudio.value = Math.min(1.8, smoothedAudio);

      if (wasmWave) {
        const wasmSample =
          (wasmWave(0.17, 0.53, t, smoothedAudio) +
            wasmWave(0.42, 0.31, t, smoothedAudio) +
            wasmWave(0.88, 0.22, t, smoothedAudio)) /
          3;
        uniforms.uWasmMod.value = Math.max(-1, Math.min(1, wasmSample));
      }

      points.rotation.z = t * 0.07;
      points.rotation.x = Math.sin(t * 0.22) * 0.14;

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
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden />;
}

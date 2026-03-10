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

  void main() {
    vec3 p = position;
    float wave = sin((p.x * 1.8) + (p.y * 1.4) + uTime * 0.7 + aSeed * 6.2831) * 0.24;
    float ring = sin(length(p.xy) * 5.0 - uTime * 1.2 + aSeed * 2.0) * 0.18;
    p.z += wave + ring * (0.6 + (uAudio * 1.5)) + (uWasmMod * 0.45);
    p.xy *= 1.0 + (uAudio * 0.06);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (1.2 + (uAudio * 3.0)) * (150.0 / max(30.0, -mvPosition.z));
    vIntensity = clamp(0.3 + uAudio + abs(p.z) * 0.5, 0.0, 2.0);
  }
`;

const FRAGMENT_SHADER = `
  varying float vIntensity;

  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;

    float alpha = (1.0 - r) * 0.8;
    vec3 base = vec3(0.15, 0.45, 1.0);
    vec3 pulse = vec3(0.95, 0.35, 1.0);
    vec3 color = mix(base, pulse, clamp(vIntensity * 0.65, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
  }
`;

const ART_VIEW_KEY = "threesam-art-view-v1";

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
    if (typeof window === "undefined") return;
    const hasViewed = window.localStorage.getItem(ART_VIEW_KEY);
    if (hasViewed) return;

    window.localStorage.setItem(ART_VIEW_KEY, "1");
    void fetch("/api/counters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "artView" }),
    });
  }, []);

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
      const smoothingFactor = Math.max(0, Math.min(0.98, smoothingRef.current));
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

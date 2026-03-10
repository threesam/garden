"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAudio;
  attribute float aTerrain;
  varying float vHeight;

  void main() {
    vec3 p = position;
    float audioScale = 0.25 + uAudio * 1.85;

    // Faceting preserves the minimal geometric look.
    float faceted = floor((aTerrain + 1.0) * 14.0) / 14.0 - 0.5;
    p.z += faceted * audioScale;
    p.x += faceted * uAudio * 0.08;

    // Slight drift keeps the surface alive at low volume.
    p.z += sin((p.x * 0.7 + p.y * 0.4) + uTime * 0.22) * 0.02;
    vHeight = p.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  varying float vHeight;

  void main() {
    float h = clamp(vHeight + 0.35, 0.0, 1.0);
    vec3 low = vec3(0.20, 0.06, 0.03);
    vec3 mid = vec3(0.58, 0.18, 0.07);
    vec3 high = vec3(1.00, 0.74, 0.35);
    vec3 color = mix(low, mid, smoothstep(0.05, 0.55, h));
    color = mix(color, high, smoothstep(0.48, 0.95, h));
    gl_FragColor = vec4(color, 0.95);
  }
`;

export default function MountainCanvas() {
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
      52,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100,
    );
    camera.position.set(0, 2.4, 5.8);
    camera.lookAt(0, -0.4, 0);

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

    const geometry = new THREE.PlaneGeometry(7.6, 7.6, 96, 96);
    const positionAttribute = geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const terrain = buildTerrainField(positionAttribute);
    geometry.setAttribute("aTerrain", new THREE.BufferAttribute(terrain, 1));

    const uniforms = {
      uTime: { value: 0 },
      uAudio: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2.5;
    mesh.position.y = -1.2;
    scene.add(mesh);

    const render = () => {
      if (!active) return;

      const t = clock.getElapsedTime();
      const smoothingFactor = Math.max(0, Math.min(0.98, smoothingRef.current));
      const targetAudio = Math.max(
        0,
        Math.min(2.3, energyRef.current * sensitivityRef.current),
      );
      smoothedAudio =
        smoothedAudio * smoothingFactor + targetAudio * (1 - smoothingFactor);

      uniforms.uTime.value = t;
      uniforms.uAudio.value = Math.min(1.8, smoothedAudio);

      mesh.rotation.z = Math.sin(t * 0.08) * 0.08;

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(render);
    };

    const handleResize = () => {
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

function buildTerrainField(positionAttribute: THREE.BufferAttribute) {
  const count = positionAttribute.count;
  const terrain = new Float32Array(count);
  const ridgeCount = 9;
  const ridges = Array.from({ length: ridgeCount }, () => ({
    cx: randomBetween(-3.1, 3.1),
    cy: randomBetween(-3.1, 3.1),
    amp: randomBetween(0.35, 1.25),
    sx: randomBetween(0.6, 2.1),
    sy: randomBetween(0.65, 2.25),
    skew: randomBetween(-0.55, 0.55),
  }));

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < count; i += 1) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    let h = 0;

    for (const ridge of ridges) {
      const dx = (x - ridge.cx) / ridge.sx;
      const dy = (y - ridge.cy) / ridge.sy;
      const skewedDx = dx + dy * ridge.skew;
      const peak = Math.exp(-(skewedDx * skewedDx + dy * dy));
      h += peak * ridge.amp;
    }

    // Lightweight deterministic noise adds local irregularity.
    const noise =
      (hash2D(x * 0.45, y * 0.45) - 0.5) * 0.26 +
      (hash2D(x * 1.1 + 11.7, y * 1.1 + 2.3) - 0.5) * 0.12;
    h += noise;
    terrain[i] = h;
    min = Math.min(min, h);
    max = Math.max(max, h);
  }

  const span = Math.max(0.0001, max - min);
  for (let i = 0; i < count; i += 1) {
    const normalized = ((terrain[i] - min) / span) * 2 - 1;
    terrain[i] =
      Math.sign(normalized) * Math.pow(Math.abs(normalized), 1.16);
  }

  return terrain;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function hash2D(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

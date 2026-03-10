"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAudio;
  varying float vHeight;

  void main() {
    vec3 p = position;
    float waveA = sin((p.x * 1.9) + uTime * 0.48);
    float waveB = cos((p.y * 1.7) - uTime * 0.42);
    float ridge = sin((p.x + p.y) * 1.35 - uTime * 0.35);
    float mixed = waveA * 0.44 + waveB * 0.31 + ridge * 0.25;

    // Quantization produces minimal geometric "mountains".
    float faceted = floor((mixed + 1.0) * 7.0) / 7.0 - 0.5;
    p.z += faceted * (0.22 + uAudio * 1.35);
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

    const geometry = new THREE.PlaneGeometry(7.6, 7.6, 120, 120);
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

    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#ffd8a8"),
        transparent: true,
        opacity: 0.22,
      }),
    );
    wireframe.rotation.x = mesh.rotation.x;
    wireframe.position.copy(mesh.position);
    scene.add(wireframe);

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
      wireframe.rotation.z = mesh.rotation.z;

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
      (wireframe.material as THREE.Material).dispose();
      (wireframe.geometry as THREE.BufferGeometry).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden />;
}

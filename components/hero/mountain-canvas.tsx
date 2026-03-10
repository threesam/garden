"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAudio;
  uniform float uTravel;
  uniform vec2 uSeedA;
  uniform vec2 uSeedB;
  varying float vHeight;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    vec3 p = position;
    vec2 streamPos = vec2(
      p.x * 0.92 + uSeedA.x,
      (p.y + uTravel * 1.35) * 1.05 + uSeedA.y
    );

    vec2 warp = vec2(
      noise(streamPos * 0.55 + uSeedB),
      noise(streamPos * 0.55 - uSeedB)
    );
    streamPos += (warp - 0.5) * 1.2;

    float ridge = abs(noise(streamPos * 1.08) - 0.5) * 2.0;
    float n1 = noise(streamPos * 0.62 + vec2(17.4, -3.2));
    float n2 = noise(streamPos * 1.68 + vec2(-2.7, 9.4));
    float h = ridge * 0.9 + n1 * 0.42 + n2 * 0.2;

    // Keep mountain forms asymmetric across the field.
    float sideBias = mix(
      0.72,
      1.34,
      smoothstep(-3.2, 3.2, p.x + (noise(vec2(streamPos.y * 0.25, uSeedA.x)) - 0.5) * 2.2)
    );
    h = pow(h, 1.24) * sideBias;

    float centered = h - 0.58;
    float faceted = floor(centered * 12.0) / 12.0;
    float audioScale = 0.25 + uAudio * 1.85;

    // Faceting preserves the minimal geometric look.
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

    const uniforms = {
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uTravel: { value: 0 },
      uSeedA: {
        value: new THREE.Vector2(randomBetween(-12, 12), randomBetween(-12, 12)),
      },
      uSeedB: {
        value: new THREE.Vector2(randomBetween(-8, 8), randomBetween(-8, 8)),
      },
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
      uniforms.uTravel.value = t * 0.14;

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

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

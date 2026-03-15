"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";
import type { AudioBands } from "@/components/audio/audio-reactive-provider";

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uAudio;
  uniform float uBass;
  uniform float uMid;
  uniform float uHigh;
  uniform float uOnset;

  varying vec2 vUv;

  void main() {
    vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / min(uResolution.x, uResolution.y);

    // continuous zoom into the Mandelbrot set
    // target: a deep spiral near the boundary (Misiurewicz point)
    vec2 target = vec2(-0.7435669, 0.1314023);

    float zoomSpeed = 0.18 + uBass * 0.08;
    float zoomPow = 2.0 + uTime * zoomSpeed;
    float scale = pow(1.5, zoomPow);

    // mid drives subtle rotation
    float angle = uTime * 0.03 + uMid * 0.15;
    float ca = cos(angle), sa = sin(angle);
    uv = mat2(ca, -sa, sa, ca) * uv;

    vec2 c = target + uv / scale;

    // iterate
    vec2 z = vec2(0.0);
    float iter = 0.0;
    const float MAX_ITER = 256.0;

    for (float i = 0.0; i < MAX_ITER; i++) {
      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
      if (dot(z, z) > 4.0) break;
      iter = i;
    }

    // smooth iteration count
    float sl = iter - log2(log2(dot(z, z))) + 4.0;
    float t = sl / MAX_ITER;

    // inside the set = dark
    if (dot(z, z) <= 4.0) {
      // deep inside — dark with subtle audio glow
      vec3 inner = vec3(0.04, 0.03, 0.02) + vec3(0.08, 0.04, 0.02) * uAudio;
      inner += vec3(1.0, 0.9, 0.7) * uOnset * 0.15;
      float vig = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 1.2;
      gl_FragColor = vec4(inner * vig, 1.0);
      return;
    }

    // color palette — warm embers
    vec3 warmA = vec3(0.54, 0.17, 0.06);
    vec3 warmB = vec3(0.88, 0.40, 0.12);
    vec3 warmC = vec3(1.0, 0.79, 0.36);
    vec3 coolTip = vec3(0.7, 0.85, 1.0);
    vec3 deep = vec3(0.12, 0.06, 0.03);

    // base color from iteration count
    float wave = 0.5 + 0.5 * sin(t * 12.0 + uTime * 0.3);
    float wave2 = 0.5 + 0.5 * sin(t * 7.0 - uTime * 0.2 + 2.0);
    vec3 color = mix(deep, warmA, smoothstep(0.0, 0.15, t));
    color = mix(color, warmB, smoothstep(0.1, 0.4, t) * wave);
    color = mix(color, warmC, smoothstep(0.3, 0.7, t) * wave2);

    // audio influence
    float audioMix = clamp(uAudio * 2.0, 0.0, 1.0);
    color = mix(color, color * 1.4, audioMix * 0.3);

    // highs add cool shimmer at edges
    color = mix(color, coolTip, uHigh * smoothstep(0.5, 0.9, t) * 0.3);

    // bass deepens contrast
    color *= 1.0 - uBass * 0.15 * (1.0 - t);

    // onset flash
    color = mix(color, vec3(1.0, 0.95, 0.85), uOnset * 0.3 * smoothstep(0.1, 0.5, t));

    // vignette
    float vig = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 1.2;
    color *= vig;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function FractalZoomCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const energyRef = useRef(0);
  const bandsRef = useRef<AudioBands>({ bass: 0, mid: 0, high: 0, onset: 0 });
  const { energy, bands } = useAudioReactive();

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    bandsRef.current = bands;
  }, [bands]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let rafId = 0;
    let active = true;
    let smoothedAudio = 0;
    let smoothedBass = 0;
    let smoothedMid = 0;
    let smoothedHigh = 0;
    let smoothedOnset = 0;
    const clock = new THREE.Clock();

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uAudio: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uOnset: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const render = () => {
      if (!active) return;

      const t = clock.getElapsedTime();
      const b = bandsRef.current;

      const bandAttack = 0.3;
      const bandRelease = 0.92;
      smoothedAudio = energyRef.current > smoothedAudio
        ? smoothedAudio * bandAttack + energyRef.current * (1 - bandAttack)
        : smoothedAudio * bandRelease + energyRef.current * (1 - bandRelease);
      smoothedBass = b.bass > smoothedBass
        ? smoothedBass * bandAttack + b.bass * (1 - bandAttack)
        : smoothedBass * bandRelease + b.bass * (1 - bandRelease);
      smoothedMid = b.mid > smoothedMid
        ? smoothedMid * bandAttack + b.mid * (1 - bandAttack)
        : smoothedMid * bandRelease + b.mid * (1 - bandRelease);
      smoothedHigh = b.high > smoothedHigh
        ? smoothedHigh * bandAttack + b.high * (1 - bandAttack)
        : smoothedHigh * bandRelease + b.high * (1 - bandRelease);
      smoothedOnset = b.onset > smoothedOnset
        ? b.onset
        : smoothedOnset * 0.85;

      uniforms.uTime.value = t;
      uniforms.uAudio.value = Math.min(0.35, smoothedAudio);
      uniforms.uBass.value = smoothedBass;
      uniforms.uMid.value = smoothedMid;
      uniforms.uHigh.value = smoothedHigh;
      uniforms.uOnset.value = smoothedOnset;

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w * Math.min(window.devicePixelRatio, 2), h * Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);
    // set initial resolution accounting for pixel ratio
    handleResize();

    render();

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden />;
}

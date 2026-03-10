"use client";

import { useEffect, useRef } from "react";

import { useAudioReactive } from "@/components/audio/audio-reactive-provider";

interface TreeState {
  x: number;
  baseY: number;
  maxDepth: number;
  trunkLength: number;
  trunkAngle: number;
  spread: number;
  lean: number;
  growth: number;
  seed: number;
  thickness: number;
  canopyReady: boolean;
}

const MAX_TREES = 22;
const GREEN_THRESHOLD = 0.42;
const GREEN_HOLD_MS = 1000;

export default function ForestCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energyRef = useRef(0);
  const sensitivityRef = useRef(1.3);
  const treesRef = useRef<TreeState[]>([]);
  const cooldownRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const greenHoldMsRef = useRef(0);
  const rafRef = useRef(0);

  const { energy, sensitivity } = useAudioReactive();

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let active = true;
    let lastTime = performance.now();

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * Math.min(2, window.devicePixelRatio)));
      canvas.height = Math.max(
        1,
        Math.floor(height * Math.min(2, window.devicePixelRatio)),
      );
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(canvas.width / Math.max(1, width), canvas.height / Math.max(1, height));
    };

    const spawnTree = (width: number, height: number, energyValue: number) => {
      const x = randomBetween(width * 0.05, width * 0.95);
      const depth = randomInt(3, 7);
      const baseLength = randomBetween(height * 0.12, height * 0.29);
      const boost = 1 + Math.min(1, energyValue * 0.5);

      treesRef.current.push({
        x,
        baseY: height * 0.96,
        maxDepth: depth,
        trunkLength: baseLength * boost,
        trunkAngle: randomBetween(-0.14, 0.14),
        spread: randomBetween(0.24, 0.48),
        lean: randomBetween(-0.12, 0.12),
        growth: 0,
        seed: Math.random() * 10000,
        thickness: randomBetween(1.1, 2.4),
        canopyReady: false,
      });

      if (treesRef.current.length > MAX_TREES) {
        treesRef.current.shift();
      }
    };

    const render = (time: number) => {
      if (!active) return;

      const dt = Math.min(48, time - lastTime);
      lastTime = time;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      const energyValue = Math.min(2.7, energyRef.current * sensitivityRef.current * 2.25);
      cooldownRef.current = Math.max(0, cooldownRef.current - dt);

      if (energyValue >= GREEN_THRESHOLD) {
        greenHoldMsRef.current = Math.min(
          GREEN_HOLD_MS + 250,
          greenHoldMsRef.current + dt,
        );
      } else {
        greenHoldMsRef.current = 0;
      }
      const canSproutGreen = greenHoldMsRef.current >= GREEN_HOLD_MS;

      if (
        energyValue > 0.18 &&
        cooldownRef.current <= 0 &&
        time - lastSpawnRef.current > 70
      ) {
        spawnTree(width, height, energyValue);
        lastSpawnRef.current = time;
        cooldownRef.current = randomBetween(85, 190);
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < treesRef.current.length; i += 1) {
        const tree = treesRef.current[i];
        if (canSproutGreen) tree.canopyReady = true;

        tree.growth += 0.005 + energyValue * 0.0045;
        const visibleGrowth = Math.min(1.45, tree.growth);
        const opacity = Math.max(0, Math.min(1, 1.3 - (visibleGrowth - 1)));

        drawBranch({
          ctx,
          x: tree.x,
          y: tree.baseY,
          length: tree.trunkLength,
          angle: -Math.PI / 2 + tree.trunkAngle + Math.sin(time * 0.00018 + tree.seed) * 0.03,
          depth: 0,
          maxDepth: tree.maxDepth,
          growth: visibleGrowth,
          spread: tree.spread,
          lean: tree.lean,
          thickness: tree.thickness,
          seed: tree.seed,
          canopyReady: tree.canopyReady,
          opacity,
        });
      }

      treesRef.current = treesRef.current.filter((tree) => tree.growth < 2.3);
      rafRef.current = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = window.requestAnimationFrame(render);

    return () => {
      active = false;
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}

function drawBranch(params: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  length: number;
  angle: number;
  depth: number;
  maxDepth: number;
  growth: number;
  spread: number;
  lean: number;
  thickness: number;
  seed: number;
  canopyReady: boolean;
  opacity: number;
}) {
  const {
    ctx,
    x,
    y,
    length,
    angle,
    depth,
    maxDepth,
    growth,
    spread,
    lean,
    thickness,
    seed,
    canopyReady,
    opacity,
  } = params;
  if (depth > maxDepth) return;
  if (depth >= 2 && !canopyReady) return;

  const segmentGrowth = clamp(growth * (maxDepth + 1) - depth, 0, 1);
  if (segmentGrowth <= 0) return;

  const localLength = length * segmentGrowth;
  const x2 = x + Math.cos(angle) * localLength;
  const y2 = y + Math.sin(angle) * localLength;

  const gradient = ctx.createLinearGradient(x, y, x2, y2);
  if (depth <= 1) {
    const brownA = depth === 0 ? "70, 33, 17" : "98, 48, 21";
    const brownB = depth === 0 ? "146, 74, 32" : "178, 101, 52";
    gradient.addColorStop(0, `rgba(${brownA}, ${0.78 * opacity})`);
    gradient.addColorStop(1, `rgba(${brownB}, ${0.66 * opacity})`);
  } else {
    const greenShift = randomFromSeed(seed + depth * 5.9, 0, 26);
    gradient.addColorStop(
      0,
      `rgba(${28 + greenShift}, ${88 + greenShift}, ${34 + greenShift * 0.35}, ${
        0.72 * opacity
      })`,
    );
    gradient.addColorStop(
      1,
      `rgba(${78 + greenShift * 0.45}, ${176 + greenShift}, ${78 + greenShift * 0.3}, ${
        0.62 * opacity
      })`,
    );
  }
  ctx.strokeStyle = gradient;
  ctx.lineWidth = Math.max(0.5, thickness * Math.pow(0.72, depth));
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (depth === maxDepth || segmentGrowth < 0.98) return;

  const childCount = hash(seed + depth * 19.17) > 0.78 ? 3 : 2;
  const nextLength = length * randomFromSeed(seed + depth * 7.1, 0.62, 0.78);

  for (let i = 0; i < childCount; i += 1) {
    const t = i / (childCount - 1);
    const spreadOffset = (t - 0.5) * spread * (childCount === 3 ? 1.35 : 1);
    const jitter = randomFromSeed(seed + depth * 11.3 + i * 3.7, -0.09, 0.09);
    const branchAngle = angle + spreadOffset + jitter + lean * 0.35;

    drawBranch({
      ctx,
      x: x2,
      y: y2,
      length: nextLength,
      angle: branchAngle,
      depth: depth + 1,
      maxDepth,
      growth,
      spread: spread * randomFromSeed(seed + 23.8 + i, 0.88, 1.08),
      lean,
      thickness,
      seed: seed + i * 2.31,
      canopyReady,
      opacity,
    });
  }
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function hash(n: number) {
  const s = Math.sin(n * 91.341) * 43758.5453123;
  return s - Math.floor(s);
}

function randomFromSeed(seed: number, min: number, max: number) {
  return min + hash(seed) * (max - min);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from "chart.js";
import modulesData from "@/data/messages/dianchik/modules-data.json";

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

const { labels, sam, dianchik } = modulesData.avg_lengths;

export function MessageLengths() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvas.getContext("2d")!, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "sam",
            data: sam,
            borderColor: "rgba(255, 255, 255, 0.5)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
            fill: true,
          },
          {
            label: "dianchik",
            data: dianchik,
            borderColor: "rgba(212, 175, 55, 0.6)",
            backgroundColor: "rgba(212, 175, 55, 0.05)",
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            ticks: {
              color: "rgba(255,255,255,0.3)",
              font: { family: "monospace", size: 9 },
              callback: (_, i) => {
                const l = labels[i];
                return l.endsWith("-01") ? l.slice(0, 4) : "";
              },
            },
            grid: { display: false },
            border: { display: false },
          },
          y: {
            ticks: {
              color: "rgba(255,255,255,0.2)",
              font: { family: "monospace", size: 9 },
            },
            grid: { color: "rgba(255,255,255,0.05)" },
            border: { display: false },
          },
        },
        plugins: {
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.85)",
            titleFont: { family: "monospace", size: 11 },
            bodyFont: { family: "monospace", size: 11 },
            padding: 10,
            callbacks: {
              title: (items) => labels[items[0].dataIndex],
              label: (item) => `${item.dataset.label}: avg ${item.raw} chars`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.16em] text-zinc-400">
          message length over time
        </span>
        <span className="font-mono text-[10px] text-zinc-500">
          avg characters per message
        </span>
      </div>
      <div className="flex gap-4 mb-4">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
          <span className="inline-block h-[2px] w-3" style={{ backgroundColor: "rgba(255,255,255,0.5)" }} />
          sam
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
          <span className="inline-block h-[2px] w-3" style={{ backgroundColor: "rgba(212,175,55,0.6)" }} />
          dianchik
        </span>
      </div>
      <div style={{ height: 200 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

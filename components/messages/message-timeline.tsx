"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from "chart.js";
import rawData from "@/data/messages/dianchik/chart-data.json";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Filler);

const extra = rawData as unknown as Record<string, number[]>;
const chartData = {
  labels: rawData.labels,
  sam: rawData.sam,
  dianchik: rawData.dianchik,
  sam_media: extra.sam_media ?? [],
  dianchik_media: extra.dianchik_media ?? [],
};

type Tab = "messages" | "media";

const SAM_COLOR = "rgba(255, 255, 255, 0.35)";
const SAM_HOVER = "rgba(255, 255, 255, 0.6)";
const DIA_COLOR = "rgba(212, 175, 55, 0.5)";
const DIA_HOVER = "rgba(212, 175, 55, 0.8)";

function buildConfig(tab: Tab) {
  const samData = tab === "messages" ? chartData.sam : chartData.sam_media;
  const diaData = tab === "messages" ? chartData.dianchik : chartData.dianchik_media;
  const label = tab === "messages" ? "messages" : "media";

  return {
    type: "bar" as const,
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "sam",
          data: samData,
          backgroundColor: SAM_COLOR,
          hoverBackgroundColor: SAM_HOVER,
          borderRadius: 2,
        },
        {
          label: "dianchik",
          data: diaData,
          backgroundColor: DIA_COLOR,
          hoverBackgroundColor: DIA_HOVER,
          borderRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: "rgba(255,255,255,0.3)",
            font: { family: "monospace", size: 9 },
            maxRotation: 90,
            callback: function (_: unknown, index: number) {
              const l = chartData.labels[index];
              return l.endsWith("-01") ? l.slice(0, 4) : "";
            },
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          stacked: true,
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
            title: (items: { dataIndex: number }[]) => chartData.labels[items[0].dataIndex],
            label: (item: { dataset: { label?: string }; dataIndex: number; raw: unknown }) => {
              const samVal = tab === "messages" ? chartData.sam[item.dataIndex] : chartData.sam_media[item.dataIndex];
              const diaVal = tab === "messages" ? chartData.dianchik[item.dataIndex] : chartData.dianchik_media[item.dataIndex];
              return `${item.dataset.label}: ${item.raw} ${label} (${samVal + diaVal} total)`;
            },
          },
        },
      },
    },
  };
}

export function MessageTimeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [tab, setTab] = useState<Tab>("messages");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvas.getContext("2d")!, buildConfig(tab));

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [tab]);

  const msgTotal = chartData.sam.reduce((a, b) => a + b, 0) +
    chartData.dianchik.reduce((a, b) => a + b, 0);
  const mediaTotal = chartData.sam_media.reduce((a, b) => a + b, 0) +
    chartData.dianchik_media.reduce((a, b) => a + b, 0);
  const total = tab === "messages" ? msgTotal : mediaTotal;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setTab("messages")}
            className={`font-mono text-xs tracking-[0.16em] transition-colors ${tab === "messages" ? "text-zinc-200" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            messages
          </button>
          <button
            onClick={() => setTab("media")}
            className={`font-mono text-xs tracking-[0.16em] transition-colors ${tab === "media" ? "text-zinc-200" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            media
          </button>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">
          {total.toLocaleString()} total
        </span>
      </div>
      <div className="flex gap-4 mb-4">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: SAM_COLOR }} />
          sam
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: DIA_COLOR }} />
          dianchik
        </span>
      </div>
      <div style={{ height: 220 }}>
        <canvas ref={canvasRef} />
      </div>
      <p className="mt-3 font-mono text-[10px] text-zinc-500">
        {chartData.labels[0]} — {chartData.labels[chartData.labels.length - 1]}
      </p>
    </div>
  );
}

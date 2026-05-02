import type { Metadata } from "next";
import Link from "next/link";
import { AudioReactiveProvider } from "@/components/audio/audio-reactive-provider";
import { MusicSection } from "@/components/sections/music-section";

export const metadata: Metadata = {
  title: "signal — threesam",
  description:
    "Generative sketches, music, and audio-reactive experiments. The creative output.",
};

const EXPERIMENTS = [
  {
    title: "particles",
    description:
      "12,000 WebGL particles driven by custom shaders and audio energy.",
    tech: "three.js, glsl, web audio api, rust/wasm",
  },
  {
    title: "ascii overlay",
    description:
      "live webcam converted to ascii art with audio-responsive grain resolution.",
    tech: "getUserMedia, canvas, web audio api",
  },
];

export default function SignalPage() {
  return (
    <AudioReactiveProvider>
      <main className="copy-lower mx-auto min-h-screen max-w-6xl px-6 pb-18 pt-18 md:px-9">
        <h1 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
          signal
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
          sound, visuals, generative art, philosophy. the creative output —
          what gets manifested from the expanses in my head. code is the current
          tool but being abstracted by ai — what remains is vision, logic, and
          taste.
        </p>

        <div className="mt-9">
          <Link
            href="/"
            className="section-shell inline-block rounded-2xl p-6 transition hover:border-white/30 hover:bg-black/50"
          >
            <h3 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
              generative hero
            </h3>
            <p className="mt-1.5 text-sm leading-7 text-zinc-400">
              the living proof — interactive audio-reactive particle system
              on the homepage. play a track and watch it respond.
            </p>
            <span className="mt-3 inline-block text-xs text-zinc-300">
              experience it →
            </span>
          </Link>
        </div>

        <h2 className="mt-12 font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
          experiments
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {EXPERIMENTS.map((exp) => (
            <div
              key={exp.title}
              className="section-shell rounded-2xl p-6"
            >
              <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-200">
                {exp.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                {exp.description}
              </p>
              <p className="mt-1.5 font-mono text-[10px] tracking-wider text-zinc-500">
                {exp.tech}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <MusicSection />
        </div>

        <div className="mt-12 section-shell rounded-2xl p-6">
          <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
            music
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            ambient and electronic production. sound as texture, not just content.
          </p>
          <a
            href="https://soundcloud.com/threesam"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs text-zinc-300 hover:text-zinc-100"
          >
            soundcloud ↗
          </a>
        </div>
      </main>
    </AudioReactiveProvider>
  );
}

import { ReactiveControls } from "@/components/audio/reactive-controls";
import { MusicPlayer } from "@/components/audio/music-player";

export function MusicSection() {
  return (
    <section className="section-shell rounded-2xl p-6 md:p-9">
      <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
        audio system
      </h2>
      <p className="mt-3 mb-6 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
        local audio, direct web audio analysis, and a visualizer pipeline that
        drives the generative system in real time.
      </p>
      <MusicPlayer />
      <div className="mt-3">
        <ReactiveControls />
      </div>
    </section>
  );
}

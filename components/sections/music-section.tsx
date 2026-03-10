import { MicrophoneInput } from "@/components/audio/microphone-input";
import { MusicPlayer } from "@/components/audio/music-player";

export function MusicSection() {
  return (
    <section className="section-shell mx-auto mt-12 max-w-6xl rounded-2xl p-6 md:p-8">
      <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-zinc-300">
        music
      </h2>
      <p className="mt-3 mb-5 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
        Local audio, direct Web Audio analysis, and a visualizer pipeline that
        can drive the generative system in real time.
      </p>
      <MusicPlayer />
      <div className="mt-4">
        <MicrophoneInput />
      </div>
    </section>
  );
}

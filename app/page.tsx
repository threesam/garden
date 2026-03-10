import { AudioReactiveProvider } from "@/components/audio/audio-reactive-provider";
import { MicrophoneInput } from "@/components/audio/microphone-input";
import { CounterOverview } from "@/components/counters/counter-overview";
import { VisitorTracker } from "@/components/counters/visitor-tracker";
import { GenerativeHero } from "@/components/hero/generative-hero";
import { BioSection } from "@/components/sections/bio-section";
import { DisciplineSection } from "@/components/sections/discipline-section";
import { MusicSection } from "@/components/sections/music-section";
import { WorkSection } from "@/components/sections/work-section";

export default function Home() {
  return (
    <AudioReactiveProvider>
      <VisitorTracker />
      <MicrophoneInput />
      <main className="copy-lower pb-16">
        <GenerativeHero />
        <BioSection />
        <MusicSection />
        <WorkSection />
        <DisciplineSection />
        <CounterOverview />
      </main>
    </AudioReactiveProvider>
  );
}

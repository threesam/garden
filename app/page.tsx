import { AudioReactiveProvider } from "@/components/audio/audio-reactive-provider";
import { CounterOverview } from "@/components/counters/counter-overview";
import { VisitorTracker } from "@/components/counters/visitor-tracker";
import { GenerativeHero } from "@/components/hero/generative-hero";
import { BioSection } from "@/components/sections/bio-section";
import { DisciplineSection } from "@/components/sections/discipline-section";
import { MusicSection } from "@/components/sections/music-section";
import { WorkSection } from "@/components/sections/work-section";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export default function Home() {
  return (
    <AudioReactiveProvider>
      <VisitorTracker />
      {IS_PRODUCTION ? (
        <main>
          <GenerativeHero />
        </main>
      ) : (
        <main className="copy-lower pb-16">
          <GenerativeHero />
          <BioSection />
          <MusicSection />
          <WorkSection />
          <DisciplineSection />
          <CounterOverview />
        </main>
      )}
    </AudioReactiveProvider>
  );
}

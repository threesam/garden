import type { Metadata } from "next";
import { AsciiImageSection } from "@/components/messages/ascii-image-section";
import { MessageTimeline } from "@/components/messages/message-timeline";
import { ClockHeatmap } from "@/components/messages/clock-heatmap";
import { EmojiMeter } from "@/components/messages/emoji-meter";
import { PetNames } from "@/components/messages/pet-names";
import { LazyWordCloud } from "@/components/messages/lazy-word-cloud";
import { TotalWords, BusiestDay, MostWords } from "@/components/messages/word-stats";
import { LazyMount } from "@/components/lazy-mount";
import { DEANA_IMAGES } from "@/components/messages/deana-images";

export const metadata: Metadata = {
  title: "deana — threesam",
  description: "102,549 messages. 10 years. One conversation.",
};

const g = "gap-3 md:gap-4";

function M({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white border border-zinc-200 p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );
}

function ContentSection({ children }: { children: React.ReactNode }) {
  return (
    // No snap-start: scroll-snap is for the filmstrip-style ASCII
    // images, not the data cards. Content flows naturally between
    // (and past) the image sections.
    <section
      className="w-full px-3 py-16 md:px-4 md:py-24"
      style={{ backgroundColor: "var(--white)" }}
    >
      <div className={`mx-auto w-full max-w-7xl flex flex-col ${g}`}>{children}</div>
    </section>
  );
}

export default function DeanaPage() {
  return (
    <main
      className="h-dvh snap-y snap-proximity overflow-y-scroll"
      style={{ backgroundColor: "var(--white)" }}
    >
      <AsciiImageSection src={DEANA_IMAGES[0]} />

      <ContentSection>
        <LazyMount>
          <M><MessageTimeline /></M>
        </LazyMount>
      </ContentSection>

      <AsciiImageSection src={DEANA_IMAGES[1]} />

      <ContentSection>
        <LazyMount>
          <M><ClockHeatmap /></M>
        </LazyMount>
      </ContentSection>

      <AsciiImageSection src={DEANA_IMAGES[2]} />

      <ContentSection>
        <LazyMount>
          <div className={`grid grid-cols-1 md:grid-cols-3 ${g}`}>
            <M className="md:col-span-2"><LazyWordCloud /></M>
            <div className={`grid grid-rows-3 ${g}`}>
              <M className="flex items-center"><TotalWords /></M>
              <M className="flex items-center"><BusiestDay /></M>
              <M className="flex items-center"><MostWords /></M>
            </div>
          </div>
        </LazyMount>
      </ContentSection>

      <AsciiImageSection src={DEANA_IMAGES[3]} />

      <ContentSection>
        <LazyMount>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${g}`}>
            <M><EmojiMeter /></M>
            <M><PetNames /></M>
          </div>
        </LazyMount>
      </ContentSection>
    </main>
  );
}

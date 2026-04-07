import type { Metadata } from "next";
import { EmojiHero } from "@/components/messages/emoji-hero";
import { MessageTimeline } from "@/components/messages/message-timeline";
import { ClockHeatmap } from "@/components/messages/clock-heatmap";
import { MilestoneSam, MilestoneDia, MilestoneCount } from "@/components/messages/milestones";
import { FirstNight } from "@/components/messages/first-night";
import { DailyFirsts } from "@/components/messages/daily-firsts";
import { EmojiMeter } from "@/components/messages/emoji-meter";
import { PetNames } from "@/components/messages/pet-names";
import { WordCloud } from "@/components/messages/word-cloud";
import { TotalWords, BusiestDay, MostWords } from "@/components/messages/word-stats";

export const metadata: Metadata = {
  title: "deana — threesam",
  description: "102,549 messages. 10 years. One conversation.",
};

const isDev = process.env.NODE_ENV === "development";
const g = "gap-3 md:gap-4";

function M({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-zinc-950 border border-white/5 p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function DeanaPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--white)" }}>
      <EmojiHero />
      <div className="px-3 pb-6 md:px-4">
      <div className={`mx-auto max-w-7xl flex flex-col ${g}`}>

        {/* Timeline — full width */}
        <M>
          <MessageTimeline />
        </M>

        {/* Milestones row — 3 equal */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${g}`}>
          <M><MilestoneSam /></M>
          <M><MilestoneDia /></M>
          <M><MilestoneCount /></M>
        </div>

        {/* Heatmap full width */}
        <M>
          <ClockHeatmap />
        </M>

        {/* Word cloud + stats */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${g}`}>
          <M className="md:col-span-2"><WordCloud /></M>
          <div className={`grid grid-rows-3 ${g}`}>
            <M className="flex items-center"><TotalWords /></M>
            <M className="flex items-center"><BusiestDay /></M>
            <M className="flex items-center"><MostWords /></M>
          </div>
        </div>

        {/* Emoji + Pet names */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${g}`}>
          <M><EmojiMeter /></M>
          <M><PetNames /></M>
        </div>

        {/* First night — dev only */}
        {isDev && <M><FirstNight /></M>}

        {/* Daily firsts */}
        <M>
          <DailyFirsts />
        </M>
      </div>
      </div>
    </main>
  );
}

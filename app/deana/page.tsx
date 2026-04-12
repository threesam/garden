import type { Metadata } from "next";
import { EmojiHero } from "@/components/messages/emoji-hero";
import { MessageTimeline } from "@/components/messages/message-timeline";
import { ClockHeatmap } from "@/components/messages/clock-heatmap";
import { MilestoneSam, MilestoneDia, MilestoneCount } from "@/components/messages/milestones";
import { FirstNight } from "@/components/messages/first-night";
import { DailyFirsts } from "@/components/messages/daily-firsts";
import { EmojiMeter } from "@/components/messages/emoji-meter";
import { PetNames } from "@/components/messages/pet-names";
import { LazyWordCloud } from "@/components/messages/lazy-word-cloud";
import { TotalWords, BusiestDay, MostWords } from "@/components/messages/word-stats";


export const metadata: Metadata = {
  title: "deana — threesam",
  description: "102,549 messages. 10 years. One conversation.",
};

const isDev = process.env.NODE_ENV === "development";
const g = "gap-3 md:gap-4";

function M({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white border border-zinc-200 p-5 md:p-6 ${className}`}>
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

        {/* Heatmap full width */}
        <M>
          <ClockHeatmap />
        </M>

        {/* Word cloud + stats */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${g}`}>
          <M className="md:col-span-2"><LazyWordCloud /></M>
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

        {/* Milestones + First night — dev only */}
        {isDev && (
          <>
            <div className={`grid grid-cols-1 md:grid-cols-3 ${g}`}>
              <M><MilestoneDia /></M>
              <M><MilestoneSam /></M>
              <M><MilestoneCount /></M>
            </div>
            <M><FirstNight /></M>
          </>
        )}

        {/* Daily firsts — dev only */}
        {isDev && <M><DailyFirsts /></M>}
      </div>
      </div>
    </main>
  );
}

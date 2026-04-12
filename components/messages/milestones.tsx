import modulesData from "@/data/messages/dianchik/modules-data.json";

interface LoveFirst {
  date: string;
  sender: string;
  text: string;
}

const firstSam = (modulesData as Record<string, unknown>).love_first_sam as LoveFirst | null;
const firstDia = (modulesData as Record<string, unknown>).love_first_dia as LoveFirst | null;
const loveCount = modulesData.love_count as number;

export function MilestoneSam() {
  if (!firstSam) return null;
  return (
    <div>
      <span className="font-mono text-[10px] text-zinc-500">
        first &quot;love you&quot; — sam
      </span>
      <p className="mt-2 text-sm leading-relaxed text-black">
        &quot;{firstSam.text}&quot;
      </p>
      <p className="mt-2 font-mono text-[10px] text-zinc-500">
        {firstSam.date}
      </p>
    </div>
  );
}

export function MilestoneDia() {
  if (!firstDia) return null;
  return (
    <div>
      <span className="font-mono text-[10px] text-zinc-500">
        first &quot;love you&quot; — dianchik
      </span>
      <p className="mt-2 text-sm leading-relaxed text-black">
        &quot;{firstDia.text}&quot;
      </p>
      <p className="mt-2 font-mono text-[10px] text-zinc-500">
        {firstDia.date}
      </p>
    </div>
  );
}

export function MilestoneCount() {
  return (
    <div>
      <span className="font-mono text-[10px] text-zinc-500">
        &quot;i love you&quot;
      </span>
      <p className="mt-2 text-2xl font-bold text-black">
        {loveCount.toLocaleString()}
      </p>
      <p className="mt-1 font-mono text-[10px] text-zinc-500">
        times and counting
      </p>
    </div>
  );
}

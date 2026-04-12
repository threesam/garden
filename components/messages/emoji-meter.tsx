import emojiData from "@/data/messages/dianchik/emoji-data.json";

interface EmojiEntry {
  emoji: string;
  count: number;
}

const sam = emojiData.sam as EmojiEntry[];
const dia = emojiData.dianchik as EmojiEntry[];
const samMax = sam[0]?.count ?? 1;
const diaMax = dia[0]?.count ?? 1;

function EmojiBar({ emoji, count, max, color }: { emoji: string; count: number; max: number; color: string }) {
  const pct = (count / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5 text-center leading-none" style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif" }}>{emoji}</span>
      <div className="flex-1 h-3 rounded-full overflow-hidden bg-zinc-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[9px] text-zinc-500 w-10 text-right">{count}</span>
    </div>
  );
}

export function EmojiMeter() {
  const show = 25;

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.16em] text-zinc-400">
          emoji
        </span>
        <span className="font-mono text-[10px] text-zinc-500">
          {(emojiData.sam_total + emojiData.dia_total).toLocaleString()} total
        </span>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-zinc-400">dianchik</span>
            <span className="font-mono text-[9px] text-zinc-400">
              {emojiData.dia_unique} unique
            </span>
          </div>
          <div className="space-y-1.5">
            {dia.slice(0, show).map((e) => (
              <EmojiBar key={e.emoji} emoji={e.emoji} count={e.count} max={diaMax} color="rgba(180,140,20,0.7)" />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-[10px] text-zinc-400">sam</span>
            <span className="font-mono text-[9px] text-zinc-400">
              {emojiData.sam_unique} unique
            </span>
          </div>
          <div className="space-y-1.5">
            {sam.slice(0, show).map((e) => (
              <EmojiBar key={e.emoji} emoji={e.emoji} count={e.count} max={samMax} color="rgba(0,0,0,0.4)" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

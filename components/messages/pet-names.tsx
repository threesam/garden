import petData from "@/data/messages/dianchik/petnames-data.json";

interface PetName {
  name: string;
  count: number;
}

const sam = petData.sam as PetName[];
const dia = petData.dianchik as PetName[];
const samMax = sam[0]?.count ?? 1;
const diaMax = dia[0]?.count ?? 1;

function NameBar({ name, count, max, color }: { name: string; count: number; max: number; color: string }) {
  const pct = (count / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 truncate text-right font-mono text-[10px] text-zinc-400">{name}</span>
      <div className="flex-1 h-3 rounded-full overflow-hidden bg-white/5">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[9px] text-zinc-500 w-10 text-right">{count}</span>
    </div>
  );
}

export function PetNames() {
  const show = 25;

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.16em] text-zinc-400">
          pet names
        </span>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-3">
            <span className="font-mono text-[10px] text-zinc-400">sam calls her</span>
          </div>
          <div className="space-y-1.5">
            {sam.slice(0, show).map((p) => (
              <NameBar key={p.name} name={p.name} count={p.count} max={samMax} color="rgba(255,255,255,0.35)" />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-3">
            <span className="font-mono text-[10px] text-zinc-400">dianchik calls him</span>
          </div>
          <div className="space-y-1.5">
            {dia.slice(0, show).map((p) => (
              <NameBar key={p.name} name={p.name} count={p.count} max={diaMax} color="rgba(212,175,55,0.5)" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

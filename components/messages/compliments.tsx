import complimentsData from "@/data/messages/dianchik/compliments-data.json";

interface ThemeEntry {
  theme: string;
  count: number;
}

const sam = complimentsData.sam as ThemeEntry[];
const dia = complimentsData.dianchik as ThemeEntry[];

// Merge and sort by combined count
const allThemes = new Map<string, { sam: number; dia: number }>();
for (const e of sam) allThemes.set(e.theme, { sam: e.count, dia: 0 });
for (const e of dia) {
  const existing = allThemes.get(e.theme) ?? { sam: 0, dia: 0 };
  existing.dia = e.count;
  allThemes.set(e.theme, existing);
}
const ranked = [...allThemes.entries()]
  .sort((a, b) => (b[1].sam + b[1].dia) - (a[1].sam + a[1].dia));

const maxTotal = ranked[0] ? ranked[0][1].sam + ranked[0][1].dia : 1;

export function Compliments() {
  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.16em] text-zinc-400">
          compliments
        </span>
        <span className="font-mono text-[10px] text-zinc-500">
          {(complimentsData.sam_total + complimentsData.dia_total).toLocaleString()} total
        </span>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-200 p-3 text-center">
          <p className="text-xl font-bold text-black">{complimentsData.sam_total}</p>
          <p className="font-mono text-[10px] text-zinc-500">from sam</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3 text-center">
          <p className="text-xl font-bold text-black">{complimentsData.dia_total}</p>
          <p className="font-mono text-[10px] text-zinc-500">from dianchik</p>
        </div>
      </div>
      <div className="space-y-2">
        {ranked.map(([theme, { sam: s, dia: d }]) => {
          const total = s + d;
          const samPct = (s / maxTotal) * 100;
          const diaPct = (d / maxTotal) * 100;
          return (
            <div key={theme}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono text-[10px] text-zinc-400">{theme}</span>
                <span className="font-mono text-[9px] text-zinc-400">{total}</span>
              </div>
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="rounded-full"
                  style={{ width: `${samPct}%`, backgroundColor: "rgba(0,0,0,0.4)" }}
                />
                <div
                  className="rounded-full"
                  style={{ width: `${diaPct}%`, backgroundColor: "rgba(180,140,20,0.7)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} />
          sam
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "rgba(180,140,20,0.7)" }} />
          dianchik
        </span>
      </div>
    </div>
  );
}

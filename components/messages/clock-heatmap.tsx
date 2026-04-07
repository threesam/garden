import modulesData from "@/data/messages/dianchik/modules-data.json";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const heatmap = modulesData.heatmap as number[][];

const maxVal = Math.max(...heatmap.flat());

function cellColor(val: number) {
  const intensity = val / maxVal;
  if (intensity === 0) return "rgba(255,255,255,0.02)";
  // Gold gradient
  const r = Math.round(212 * intensity + 40 * (1 - intensity));
  const g = Math.round(175 * intensity + 40 * (1 - intensity));
  const b = Math.round(55 * intensity + 40 * (1 - intensity));
  const a = 0.15 + intensity * 0.7;
  return `rgba(${r},${g},${b},${a})`;
}

export function ClockHeatmap() {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.16em] text-zinc-400">
          when we talked
        </span>
        <span className="font-mono text-[10px] text-zinc-500">
          hour of day x day of week
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="mb-1 flex" style={{ paddingLeft: 32 }}>
            {Array.from({ length: 24 }, (_, h) => (
              <span
                key={h}
                className="flex-1 text-center font-mono text-[8px] text-zinc-600"
              >
                {h % 6 === 0 ? `${h}` : ""}
              </span>
            ))}
          </div>
          {/* Grid */}
          {DAYS.map((day, dow) => (
            <div key={day} className="flex items-center gap-1 mb-[2px]">
              <span className="w-7 font-mono text-[9px] text-zinc-500 text-right">
                {day}
              </span>
              <div className="flex flex-1 gap-[2px]">
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    className="flex-1 rounded-[2px] transition-colors"
                    style={{
                      height: 18,
                      backgroundColor: cellColor(heatmap[dow][h]),
                    }}
                    title={`${day} ${h}:00 — ${heatmap[dow][h]} messages`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

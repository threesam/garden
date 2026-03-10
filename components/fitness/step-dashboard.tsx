import {
  buildStepLookup,
  getRecentWindowDates,
  getWeeklyTotals,
  getYearlyMonthlyTotals,
  normalizeStepEntries,
} from "@/lib/steps";
import type { StepEntry } from "@/types/fitness";

interface StepDashboardProps {
  entries: StepEntry[];
}

export function StepDashboard({ entries }: StepDashboardProps) {
  const normalized = normalizeStepEntries(entries);
  const anchorDate = normalized[normalized.length - 1]?.date ?? "2026-01-01";
  const lookup = buildStepLookup(normalized);
  const last84Days = getRecentWindowDates(anchorDate, 84);
  const weeklyTotals = getWeeklyTotals(normalized, 6);
  const monthlyTotals = getYearlyMonthlyTotals(normalized);
  const maxMonthly = Math.max(1, ...monthlyTotals.map((month) => month.total));

  return (
    <div className="space-y-7 rounded-xl border border-white/10 bg-black/35 p-5">
      <div>
        <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-300">
          step calendar (last 12 weeks)
        </h3>
        <div className="mt-4 grid grid-cols-12 gap-1.5">
          {last84Days.map((date) => (
            <div
              key={date}
              title={`${date}: ${lookup.get(date) ?? 0} steps`}
              className={`h-4 rounded-sm ${intensityClass(lookup.get(date) ?? 0)}`}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-300">
          weekly totals
        </h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {weeklyTotals.map((week) => (
            <div key={week.label} className="rounded-lg border border-white/10 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                {week.label}
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">
                {week.total.toLocaleString()} steps
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-300">
          yearly trend
        </h3>
        <div className="mt-4 flex items-end gap-2">
          {monthlyTotals.map((month) => {
            const height = Math.max(8, (month.total / maxMonthly) * 110);
            return (
              <div key={month.month} className="flex w-full flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-cyan-500/70 to-violet-400/90"
                  style={{ height: `${height}px` }}
                  title={`${month.month}: ${month.total.toLocaleString()} steps`}
                />
                <span className="font-mono text-[9px] text-zinc-400">
                  {month.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function intensityClass(steps: number) {
  if (steps > 14000) return "bg-cyan-300";
  if (steps > 11000) return "bg-cyan-400/90";
  if (steps > 8500) return "bg-cyan-500/80";
  if (steps > 6000) return "bg-cyan-700/70";
  if (steps > 0) return "bg-cyan-900/60";
  return "bg-white/5";
}

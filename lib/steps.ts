import type { StepEntry } from "@/types/fitness";

export interface WeeklyTotal {
  label: string;
  total: number;
}

export interface MonthlyTotal {
  month: string;
  total: number;
}

export function normalizeStepEntries(entries: StepEntry[]): StepEntry[] {
  return [...entries]
    .filter((entry) => Boolean(entry.date))
    .map((entry) => ({
      date: entry.date,
      steps: Math.max(0, Number(entry.steps || 0)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildStepLookup(entries: StepEntry[]) {
  return new Map(entries.map((entry) => [entry.date, entry.steps]));
}

export function getRecentWindowDates(anchorDate: string, days: number) {
  const baseDate = new Date(`${anchorDate}T00:00:00Z`);
  const output: string[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const copy = new Date(baseDate);
    copy.setUTCDate(baseDate.getUTCDate() - i);
    output.push(copy.toISOString().slice(0, 10));
  }

  return output;
}

export function getWeeklyTotals(entries: StepEntry[], numberOfWeeks = 6) {
  const normalized = normalizeStepEntries(entries);
  if (!normalized.length) return [];

  const result: WeeklyTotal[] = [];
  const anchor = new Date(`${normalized[normalized.length - 1].date}T00:00:00Z`);
  const lookup = buildStepLookup(normalized);

  for (let weekIndex = numberOfWeeks - 1; weekIndex >= 0; weekIndex -= 1) {
    const weekStart = new Date(anchor);
    weekStart.setUTCDate(anchor.getUTCDate() - weekIndex * 7 - 6);
    const weekEnd = new Date(anchor);
    weekEnd.setUTCDate(anchor.getUTCDate() - weekIndex * 7);

    let total = 0;
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(weekStart);
      date.setUTCDate(weekStart.getUTCDate() + i);
      const key = date.toISOString().slice(0, 10);
      total += lookup.get(key) ?? 0;
    }

    result.push({
      label: `${weekStart.toISOString().slice(5, 10)}–${weekEnd
        .toISOString()
        .slice(5, 10)}`,
      total,
    });
  }

  return result;
}

export function getYearlyMonthlyTotals(entries: StepEntry[]): MonthlyTotal[] {
  const sorted = normalizeStepEntries(entries);
  const focusYear = sorted[sorted.length - 1]?.date.slice(0, 4) ?? "2026";

  const output: MonthlyTotal[] = Array.from({ length: 12 }, (_, index) => ({
    month: new Date(Date.UTC(Number(focusYear), index, 1))
      .toLocaleString("en-US", { month: "short", timeZone: "UTC" })
      .toUpperCase(),
    total: 0,
  }));

  for (const entry of sorted) {
    if (!entry.date.startsWith(`${focusYear}-`)) continue;
    const monthIndex = Number(entry.date.slice(5, 7)) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      output[monthIndex].total += entry.steps;
    }
  }

  return output;
}

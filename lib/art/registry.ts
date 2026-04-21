import type { Sketch } from "./types";
import { day1 } from "./sketches/day1";
import { day2 } from "./sketches/day2";
import { day3 } from "./sketches/day3";
import { day4 } from "./sketches/day4";
import { day5 } from "./sketches/day5";
import { day6 } from "./sketches/day6";
import { day7 } from "./sketches/day7";
import { day8 } from "./sketches/day8";
import { day9 } from "./sketches/day9";
import { day10 } from "./sketches/day10";
import { day12 } from "./sketches/day12";
import { day13 } from "./sketches/day13";
import { day14 } from "./sketches/day14";
import { day15 } from "./sketches/day15";
import { day16 } from "./sketches/day16";
import { day17 } from "./sketches/day17";
import { day18 } from "./sketches/day18";
import { day20 } from "./sketches/day20";
import { day21 } from "./sketches/day21";
import { day22 } from "./sketches/day22";
import { day23 } from "./sketches/day23";
import { day24 } from "./sketches/day24";
import { day25 } from "./sketches/day25";
import { day26 } from "./sketches/day26";
import { day27 } from "./sketches/day27";
import { day28 } from "./sketches/day28";
import { day29 } from "./sketches/day29";
import { day30 } from "./sketches/day30";
import { day31 } from "./sketches/day31";
import { day32 } from "./sketches/day32";
import { day33 } from "./sketches/day33";

// Reverse-chronological by day number (most recent first). Sorted once here so
// every consumer (index gallery, metadata, puppeteer snapshotter) sees the
// same order.
export const sketches: Sketch[] = [
  day33,
  day32,
  day31,
  day30,
  day29,
  day28,
  day27,
  day26,
  day25,
  day24,
  day23,
  day22,
  day21,
  day20,
  day18,
  day17,
  day16,
  day15,
  day14,
  day13,
  day12,
  day10,
  day9,
  day8,
  day7,
  day6,
  day5,
  day4,
  day3,
  day2,
  day1,
];

/**
 * Slugs hidden from the gallery scroll (because they're slow, broken, or
 * otherwise not ready for a curated tour). Still accessible via
 * `/anything-but-analog/raw/<n>` for direct viewing.
 *
 * Visible tour: 1, 2, 4, 10, 15, 20, 22, 23, 25, 26, 29, 30.
 */
export const HIDDEN_SLUGS = new Set<string>([
  "3",
  "5",
  "6",
  "7",
  "8",
  "9",
  "12",
  "13",
  "14",
  "16",
  "17",
  "18",
  "21",
  "24",
  "27",
  "28",
  "31",
  "32",
  "33",
]);

export const visibleSketches: Sketch[] = sketches.filter((s) => !HIDDEN_SLUGS.has(s.slug));

export function getSketch(slug: string): Sketch | null {
  return sketches.find((s) => s.slug === slug) ?? null;
}

// lib/derive.ts
import type { AllQuestionsCountItem, RecentSubmission, SubmitStats } from "@/types/leetnode";
import { formatDateISO } from "@/lib/date";

export function byDifficulty<T extends { difficulty: string }>(
  arr: T[],
  difficulty: string
): T | undefined {
  return arr.find((x) => x.difficulty === difficulty);
}

export function safeRatio(n: number, d: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  return n / d;
}

export function pct(n: number, d: number): number {
  return Math.round(safeRatio(n, d) * 1000) / 10; // one decimal
}

export type SolvedOverviewMetrics = {
  solvedAll: number;
  solvedEasy: number;
  solvedMedium: number;
  solvedHard: number;

  totalAll: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;

  coveragePct: number; // solvedAll / totalAll
  acceptancePct: number; // acSubmissionsAll / totalSubmissionsAll

  // for progress bars (solved / total available per difficulty)
  progress: {
    Easy: { solved: number; total: number; pct: number };
    Medium: { solved: number; total: number; pct: number };
    Hard: { solved: number; total: number; pct: number };
  };
};

export function deriveSolvedOverview(
  allQuestionsCount: AllQuestionsCountItem[],
  submitStats: SubmitStats
): SolvedOverviewMetrics {
  const totalsAll = byDifficulty(allQuestionsCount, "All")?.count ?? 0;
  const totalsEasy = byDifficulty(allQuestionsCount, "Easy")?.count ?? 0;
  const totalsMedium = byDifficulty(allQuestionsCount, "Medium")?.count ?? 0;
  const totalsHard = byDifficulty(allQuestionsCount, "Hard")?.count ?? 0;

  const acAll = byDifficulty(submitStats.acSubmissionNum, "All")?.count ?? 0;
  const acEasy = byDifficulty(submitStats.acSubmissionNum, "Easy")?.count ?? 0;
  const acMedium = byDifficulty(submitStats.acSubmissionNum, "Medium")?.count ?? 0;
  const acHard = byDifficulty(submitStats.acSubmissionNum, "Hard")?.count ?? 0;

  const totalAllSub = byDifficulty(submitStats.totalSubmissionNum, "All")?.submissions ?? 0;
  const acAllSub = byDifficulty(submitStats.acSubmissionNum, "All")?.submissions ?? 0;

  const coveragePct = pct(acAll, totalsAll);
  const acceptancePct = pct(acAllSub, totalAllSub);

  return {
    solvedAll: acAll,
    solvedEasy: acEasy,
    solvedMedium: acMedium,
    solvedHard: acHard,
    totalAll: totalsAll,
    totalEasy: totalsEasy,
    totalMedium: totalsMedium,
    totalHard: totalsHard,
    coveragePct,
    acceptancePct,
    progress: {
      Easy: { solved: acEasy, total: totalsEasy, pct: pct(acEasy, totalsEasy) },
      Medium: { solved: acMedium, total: totalsMedium, pct: pct(acMedium, totalsMedium) },
      Hard: { solved: acHard, total: totalsHard, pct: pct(acHard, totalsHard) },
    },
  };
}

export type HeatmapCell = {
  date: Date;
  iso: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture?: boolean; // NEW: cells after today (in the last week) should be blank like GitHub
};


export type HeatmapGrid = {
  weeks: number;
  cells: HeatmapCell[][]; // [row 0..6][col 0..weeks-1], row=dayOfWeek (Sun..Sat)
  maxCount: number;
  startDate: Date; // inclusive
  endDate: Date; // inclusive
};

function levelForCount(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function parseSubmissionCalendar(calendarJsonString: string): Record<string, number> {
  try {
    const parsed = JSON.parse(calendarJsonString);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const ts = String(k);
      const num = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(num)) out[ts] = num;
    }
    return out;
  } catch {
    return {};
  }
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function startOfWeekUTC(d: Date): Date {
  // Sunday as week start (0)
  const day = d.getUTCDay(); // 0=Sun ... 6=Sat
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - day);
  return start;
}

export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function utcDayKeySeconds(d: Date): string {
  // key = unix seconds at 00:00:00 UTC
  return String(Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000));
}


export function deriveYearHeatmap(
  calendarJsonString: string,
  now: Date = new Date(),
  weeks: number = 52
): HeatmapGrid {
  const map = parseSubmissionCalendar(calendarJsonString);

  const end = startOfDayUTC(now);           // today at 00:00 UTC
  const endWeekStart = startOfWeekUTC(end); // Sunday of current week
  const start = addDays(endWeekStart, -(weeks - 1) * 7); // Sunday weeks-1 ago

  const cells: HeatmapCell[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: weeks }, () => {
      const date = new Date(0);
      return { date, iso: "1970-01-01", count: 0, level: 0 as 0 };
    })
  );

  let maxCount = 0;

  for (let col = 0; col < weeks; col++) {
    for (let row = 0; row < 7; row++) {
      const date = addDays(start, col * 7 + row);

      const isFuture = date.getTime() > end.getTime(); // after today → blank cell
      const key = utcDayKeySeconds(date);
      const count = isFuture ? 0 : (map[key] ?? 0);

      maxCount = Math.max(maxCount, count);

      cells[row][col] = {
        date,
        iso: formatDateISO(date),
        count,
        level: isFuture ? 0 : levelForCount(count),
        isFuture,
      };
    }
  }

  return {
    weeks,
    cells,
    maxCount,
    startDate: start,
    endDate: end,
  };
}


export type SubmissionStatusFilter =
  | "All"
  | "Accepted"
  | "Wrong Answer"
  | "Time Limit Exceeded"
  | "Runtime Error";

export type SubmissionFilters = {
  status: SubmissionStatusFilter;
  lang: string; // "All" or a language string
};

export function listLanguages(subs: RecentSubmission[]): string[] {
  const set = new Set<string>();
  for (const s of subs) set.add(s.lang);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filterSubmissions(subs: RecentSubmission[], filters: SubmissionFilters): RecentSubmission[] {
  return subs.filter((s) => {
    const statusOk = filters.status === "All" ? true : s.statusDisplay === filters.status;
    const langOk = filters.lang === "All" ? true : s.lang === filters.lang;
    return statusOk && langOk;
  });
}

export type AttemptsInsightsMetrics = {
  recentAcceptancePct: number;
  retryToAcLines: string[]; // e.g. "X: 3 attempts → Accepted"
  nonAcceptedErrorCounts: Array<{ status: string; count: number }>; // sorted desc
};

export function deriveAttemptsInsights(recent: RecentSubmission[]): AttemptsInsightsMetrics {
  const total = recent.length;
  const accepted = recent.filter((r) => r.statusDisplay === "Accepted").length;
  const recentAcceptancePct = pct(accepted, total);

  // Retry-to-AC:
  // Scan from oldest -> newest to detect sequences of same slug ending in Accepted.
  const sorted = [...recent].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  const retryToAcLines: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    const slug = sorted[i].titleSlug;
    const title = sorted[i].title;

    // collect consecutive attempts on same slug
    let j = i;
    while (j < sorted.length && sorted[j].titleSlug === slug) j++;

    const streak = sorted.slice(i, j);
    const last = streak[streak.length - 1];

    if (streak.length >= 2 && last?.statusDisplay === "Accepted") {
      retryToAcLines.push(`${title}: ${streak.length} attempts → Accepted`);
    }

    i = j;
  }

  // Most error type among non-accepted (in the provided list order is fine)
  const errorMap = new Map<string, number>();
  for (const s of recent) {
    if (s.statusDisplay === "Accepted") continue;
    errorMap.set(s.statusDisplay, (errorMap.get(s.statusDisplay) ?? 0) + 1);
  }
  const nonAcceptedErrorCounts = Array.from(errorMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return { recentAcceptancePct, retryToAcLines, nonAcceptedErrorCounts };
}

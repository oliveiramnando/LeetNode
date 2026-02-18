// lib/date.ts
export function timeAgoFromUnixSeconds(unixSeconds: number, nowMs: number = Date.now()): string {
  const thenMs = unixSeconds * 1000;
  const diffMs = Math.max(0, nowMs - thenMs);

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;

  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;

  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;

  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
}

export function formatDateISO(date: Date): string {
  // yyyy-mm-dd
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatShortDate(date: Date): string {
  // e.g., Feb 18, 2026
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

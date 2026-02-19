// src/frontend/src/lib/normalize.ts
import type { LeetNodeUserPayload } from "@/types/leetnode";

function normalizeBadgeIcon(icon: string): string {
  if (!icon) return icon;
  if (icon.startsWith("http://") || icon.startsWith("https://")) return icon;
  if (icon.startsWith("/")) return `https://leetcode.com${icon}`;
  return icon;
}

export function normalizeBackendLeetCodeUser(input: any): LeetNodeUserPayload | null {
  if (!input || typeof input !== "object") return null;

  // Accept both shapes:
  // - backend returning raw inner object: { allQuestionsCount, matchedUser, recentSubmissionList }
  // - backend returning wrapped: { user: { ... } }
  const u = input.user ? input.user : input;

  if (!u?.matchedUser || !u?.allQuestionsCount) return null;

  // Ensure recentSubmissionList exists
  if (!Array.isArray(u.recentSubmissionList)) u.recentSubmissionList = [];

  // Normalize badge icon URLs
  if (u?.matchedUser?.upcomingBadges?.length) {
    u.matchedUser.upcomingBadges = u.matchedUser.upcomingBadges.map((b: any) => ({
      ...b,
      icon: normalizeBadgeIcon(b.icon),
    }));
  }
  if (u?.matchedUser?.badges?.length) {
    u.matchedUser.badges = u.matchedUser.badges.map((b: any) => ({
      ...b,
      icon: normalizeBadgeIcon(b.icon),
    }));
  }

  return { user: u } as LeetNodeUserPayload;
}

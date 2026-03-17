import Link from "next/link";

type FeedUser = {
  _id: string;
  leetcodeUsername?: string;
  leetcodeUsernameLower?: string;
  githubUsername?: string;
};

type FeedSubmission = {
  _id: string;
  userId: FeedUser;
  titleSlug: string;
  title: string;
  timeStamp: number;
  status: string;
  lang: string;
};

function formatRelativeTime(unixSeconds?: number) {
  if (!unixSeconds || Number.isNaN(unixSeconds)) return "unknown time";

  const now = Date.now();
  const then = unixSeconds * 1000;
  const diffMs = now - then;

  if (diffMs < 0) {
    return new Date(then).toLocaleString();
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < week) return `${Math.floor(diffMs / day)}d ago`;

  return new Date(then).toLocaleDateString();
}

function prettifyLang(lang?: string) {
  if (!lang) return "Unknown";

  const map: Record<string, string> = {
    python3: "Python 3",
    cpp: "C++",
    java: "Java",
    javascript: "JavaScript",
    typescript: "TypeScript",
    c: "C",
    csharp: "C#",
    golang: "Go",
    rust: "Rust",
    kotlin: "Kotlin",
    swift: "Swift",
    ruby: "Ruby",
    php: "PHP",
  };

  return map[lang.toLowerCase()] || lang;
}

function getStatusStyles(status?: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "accepted") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (normalized.includes("wrong")) {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  if (normalized.includes("time limit")) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
}

export default function SubmissionFeedItem({
  submission,
}: {
  submission: FeedSubmission;
}) {
  const username =
    submission.userId?.leetcodeUsername ||
    submission.userId?.leetcodeUsernameLower ||
    "unknown-user";

  const profileHref = `/profile/${encodeURIComponent(username)}`;
  const problemHref = `https://leetcode.com/problems/${submission.titleSlug}/`;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/15 hover:bg-white/[0.06]">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={profileHref}
          className="text-sm font-medium text-orange-400 hover:text-orange-300"
        >
          @{username}
        </Link>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyles(
            submission.status
          )}`}
        >
          {submission.status}
        </span>

        <span className="text-xs text-zinc-500">
          {prettifyLang(submission.lang)} • {formatRelativeTime(submission.timeStamp)}
        </span>
      </div>

      <div className="mt-3">
        <a
          href={problemHref}
          target="_blank"
          rel="noreferrer"
          className="text-lg font-semibold tracking-tight text-white hover:text-orange-300"
        >
          {submission.title}
        </a>
      </div>

      <div className="mt-2 text-sm text-zinc-400">
        {submission.status === "Accepted" ? (
          <span>
            Solved <span className="text-zinc-300">{submission.title}</span> on
            LeetCode.
          </span>
        ) : (
          <span>
            Attempted <span className="text-zinc-300">{submission.title}</span> on
            LeetCode.
          </span>
        )}
      </div>
    </article>
  );
}
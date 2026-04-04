import Link from "next/link";
import { useState } from "react";

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
  commentCount?: number;
};

type FeedComment = {
  _id: string;
  author: string;
  authorUsername: string;
  submissionId: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
};

type CommentsResponse =
  | {
      success: true;
      submissionComments: FeedComment[];
    }
  | {
      success: false;
      message?: string;
    };

type PostCommentResponse =
  | {
      success: true;
      comment: FeedComment;
    }
  | {
      success: false;
      message?: string;
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

function formatCommentTime(dateString?: string) {
  if (!dateString) return "";

  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < minute) return "now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h`;
  if (diffMs < week) return `${Math.floor(diffMs / day)}d`;

  return new Date(dateString).toLocaleDateString();
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
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(
    submission.commentCount ?? 0
  );

  const username =
    submission.userId?.leetcodeUsername ||
    submission.userId?.leetcodeUsernameLower ||
    "unknown-user";

  const profileHref = `/profile/${encodeURIComponent(username)}`;
  const problemHref = `https://leetcode.com/problems/${submission.titleSlug}/`;

  async function fetchComments() {
    try {
      setLoadingComments(true);
      setCommentsError("");

      const res = await fetch(`${backend}/api/feed/submissions/${submission._id}/comments`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const data: CommentsResponse = await res.json().catch(() => ({
        success: false,
        message: "Invalid response from server",
      }));

      if (!res.ok || !data.success) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Failed to load comments"
        );
      }

      setComments(
        Array.isArray(data.submissionComments) ? data.submissionComments : []
      );
      setCommentsLoaded(true);
    } catch (err: any) {
      setCommentsError(err?.message || "Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  }

  async function toggleComments() {
    const opening = !showComments;

    if (opening && !commentsLoaded) {
      await fetchComments();
    }

    setShowComments(opening);
  }

  async function handlePostComment() {
    const trimmed = newComment.trim();
    if (!trimmed || postingComment) return;

    try {
      setPostingComment(true);
      setCommentsError("");

      const res = await fetch(`${backend}/api/feed/submissions/${submission._id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userComment: trimmed }),
      });

      const data: PostCommentResponse = await res.json().catch(() => ({
        success: false,
        message: "Invalid response from server",
      }));

      if (!res.ok || !data.success) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Failed to post comment"
        );
      }

      setComments((prev) => [data.comment, ...prev]);
      setLocalCommentCount((prev) => prev + 1);
      setNewComment("");
      setShowComments(true);
      setCommentsLoaded(true);
    } catch (err: any) {
      setCommentsError(err?.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  }

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

      <div className="mt-4 flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={toggleComments}
          className="text-zinc-400 transition hover:text-white"
        >
          {showComments
            ? "Hide comments"
            : localCommentCount === 1
            ? "View 1 comment"
            : `View all ${localCommentCount} comments`}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="space-y-3">
            {loadingComments ? (
              <p className="text-sm text-zinc-500">Loading comments...</p>
            ) : commentsError ? (
              <p className="text-sm text-red-300">{commentsError}</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-zinc-500">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="text-sm text-zinc-300">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-medium text-orange-400">
                        @{comment.authorUsername}
                      </span>{" "}
                      <span>{comment.body}</span>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {formatCommentTime(comment.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={250}
              className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-orange-400/40 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handlePostComment();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void handlePostComment()}
              disabled={!newComment.trim() || postingComment}
              className="rounded-xl px-3 py-2 text-sm font-medium text-orange-400 transition hover:text-orange-300 disabled:cursor-not-allowed disabled:text-zinc-600"
            >
              {postingComment ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
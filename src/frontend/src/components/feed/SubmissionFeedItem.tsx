// src/frontend/src/components/feed/SubmissionFeedItem.tsx
"use client";

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

type DeleteCommentResponse =
  | {
      success: true;
      message?: string;
    }
  | {
      success: false;
      message?: string;
    };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatRelativeTime(unixSeconds?: number) {
  if (!unixSeconds || Number.isNaN(unixSeconds)) return "unknown time";

  const then = unixSeconds * 1000;
  const diffMs = Date.now() - then;

  if (diffMs < 0) return new Date(then).toLocaleString();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h`;
  if (diffMs < week) return `${Math.floor(diffMs / day)}d`;

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
    return "border-emerald-500/20 bg-emerald-500/[0.09] text-emerald-300";
  }

  if (normalized.includes("wrong")) {
    return "border-red-500/20 bg-red-500/[0.08] text-red-300";
  }

  if (normalized.includes("time limit")) {
    return "border-amber-500/20 bg-amber-500/[0.08] text-amber-300";
  }

  return "border-white/[0.1] bg-white/[0.05] text-zinc-300";
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.6 9.6 0 0 1-4-.9L3 21l1.7-4.2A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M14 5h5v5" />
      <path d="m10 14 9-9" />
      <path d="M19 13v6H5V5h6" />
    </svg>
  );
}

export default function SubmissionFeedItem({
  submission,
  currentUserId,
}: {
  submission: FeedSubmission;
  currentUserId: string;
}) {
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [localCommentCount, setLocalCommentCount] = useState(
    submission.commentCount ?? 0,
  );

  const username =
    submission.userId?.leetcodeUsername ||
    submission.userId?.leetcodeUsernameLower ||
    "unknown-user";

  const profileHref = `/profile/${encodeURIComponent(username)}`;
  const problemHref = `https://leetcode.com/problems/${submission.titleSlug}/`;
  const isSubmissionOwner = submission.userId?._id === currentUserId;
  const avatarLetter = username.charAt(0).toUpperCase();

  async function fetchComments() {
    try {
      setLoadingComments(true);
      setCommentsError("");

      const res = await fetch(
        `${backend}/api/feed/submissions/${submission._id}/comments`,
        {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        },
      );

      const data: CommentsResponse = await res.json().catch(() => ({
        success: false,
        message: "Invalid response from server",
      }));

      if (!res.ok || !data.success) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Failed to load comments",
        );
      }

      setComments(
        Array.isArray(data.submissionComments) ? data.submissionComments : [],
      );
      setCommentsLoaded(true);
    } catch (err: unknown) {
      setCommentsError(getErrorMessage(err, "Failed to load comments"));
    } finally {
      setLoadingComments(false);
    }
  }

  async function toggleComments() {
    if (localCommentCount === 0) return;

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

      const res = await fetch(
        `${backend}/api/feed/submissions/${submission._id}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userComment: trimmed }),
        },
      );

      const data: PostCommentResponse = await res.json().catch(() => ({
        success: false,
        message: "Invalid response from server",
      }));

      if (!res.ok || !data.success) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Failed to post comment",
        );
      }

      setComments((prev) => [data.comment, ...prev]);
      setLocalCommentCount((prev) => prev + 1);
      setNewComment("");
      setShowComments(true);
      setCommentsLoaded(true);
    } catch (err: unknown) {
      setCommentsError(getErrorMessage(err, "Failed to post comment"));
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (deletingCommentId) return;

    try {
      setDeletingCommentId(commentId);
      setCommentsError("");

      const res = await fetch(
        `${backend}/api/feed/submissions/${submission._id}/comments/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json" },
        },
      );

      const data: DeleteCommentResponse = await res.json().catch(() => ({
        success: false,
        message: "Invalid response from server",
      }));

      if (!res.ok || !data.success) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Failed to delete comment",
        );
      }

      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId),
      );
      setLocalCommentCount((prev) => Math.max(0, prev - 1));
    } catch (err: unknown) {
      setCommentsError(getErrorMessage(err, "Failed to delete comment"));
    } finally {
      setDeletingCommentId(null);
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111214] shadow-[0_8px_28px_rgba(0,0,0,0.16)]">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={profileHref}
            aria-label={`View ${username}'s profile`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/[0.13]"
          >
            {avatarLetter}
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={profileHref}
              className="truncate text-sm font-semibold text-zinc-100 transition hover:text-emerald-300"
            >
              {username}
            </Link>
            <span className="text-xs text-zinc-600">•</span>
            <span className="shrink-0 text-xs text-zinc-500">
              {formatRelativeTime(submission.timeStamp)}
            </span>
          </div>
        </div>

        <a
          href={problemHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${submission.title} on LeetCode`}
          className="rounded-full p-1.5 text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200"
        >
          <ExternalLinkIcon />
        </a>
      </header>

      <a
        href={problemHref}
        target="_blank"
        rel="noreferrer"
        className="group relative block border-y border-white/[0.06] bg-[linear-gradient(145deg,rgba(16,185,129,0.08),transparent_45%),#0c0d0f] px-6 py-10 transition hover:bg-[linear-gradient(145deg,rgba(16,185,129,0.12),transparent_48%),#0c0d0f] sm:px-8"
      >
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`font-semibold ${submission.status.toLowerCase() === "accepted" ? "text-emerald-300" : "text-zinc-300"}`}
            >
              {submission.status}
            </span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-500">
              {prettifyLang(submission.lang)}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white transition group-hover:text-emerald-300">
            {submission.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {submission.status.toLowerCase() === "accepted"
              ? "Solved this problem on LeetCode."
              : "Submitted an attempt on LeetCode."}
          </p>
        </div>
      </a>

      <div className="px-4 pb-3 pt-3.5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => void toggleComments()}
            aria-expanded={showComments}
            aria-label="Toggle comments"
            disabled={localCommentCount === 0}
            className="text-zinc-200 transition hover:text-emerald-300 disabled:cursor-default disabled:hover:text-zinc-200"
          >
            <CommentIcon />
          </button>

          {localCommentCount === 0 ? (
            <span className="text-sm text-zinc-500">No comments yet</span>
          ) : (
            <button
              type="button"
              onClick={() => void toggleComments()}
              className="text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              {localCommentCount === 1
                ? "View 1 comment"
                : `View all ${localCommentCount} comments`}
            </button>
          )}
        </div>

        {showComments && (
          <div className="mt-4 space-y-4">
            {loadingComments ? (
              <p className="text-sm text-zinc-600">Loading comments...</p>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => {
                  const isCommentAuthor = comment.author === currentUserId;
                  const canDelete = isCommentAuthor || isSubmissionOwner;
                  const isDeleting = deletingCommentId === comment._id;

                  return (
                    <div
                      key={comment._id}
                      className="flex items-start justify-between gap-4"
                    >
                      <p className="min-w-0 text-sm leading-6 text-zinc-400">
                        <span className="mr-2 font-semibold text-zinc-100">
                          {comment.authorUsername}
                        </span>
                        <span className="break-words">{comment.body}</span>
                      </p>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[11px] text-zinc-600">
                          {formatCommentTime(comment.createdAt)}
                        </span>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteComment(comment._id)
                            }
                            disabled={isDeleting}
                            className="text-[11px] font-medium text-zinc-600 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting" : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {commentsError && (
              <p className="text-xs text-red-300">{commentsError}</p>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 border-t border-white/[0.06] pt-3">
          <input
            type="text"
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Add a comment..."
            maxLength={250}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handlePostComment();
              }
            }}
          />

          <button
            type="button"
            onClick={() => void handlePostComment()}
            disabled={!newComment.trim() || postingComment}
            className="text-sm font-semibold text-emerald-400 transition hover:text-emerald-300 disabled:cursor-not-allowed disabled:text-zinc-700"
          >
            {postingComment ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </article>
  );
}
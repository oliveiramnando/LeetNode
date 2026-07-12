// src/frontend/src/components/feed/SubmissionFeed.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import FriendLeaderboardCard from "./FriendLeaderboardCard";
import FriendStreaksCard from "./FriendStreaksCard";
import SubmissionFeedItem from "./SubmissionFeedItem";

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
  createdAt?: string;
  updatedAt?: string;
  commentCount?: number;
};

type FeedResponse =
  | {
      success: true;
      currentUserId: string;
      submissions: FeedSubmission[];
    }
  | {
      success: false;
      message?: string;
    };

function LoadingPost() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111214]">
      <div className="flex animate-pulse items-center gap-3 px-4 py-3.5">
        <div className="h-10 w-10 rounded-full bg-white/[0.07]" />
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-white/[0.07]" />
          <div className="h-2.5 w-16 rounded bg-white/[0.04]" />
        </div>
      </div>

      <div className="animate-pulse border-y border-white/[0.06] bg-[#0c0d0f] px-5 py-12">
        <div className="mx-auto h-6 w-56 max-w-full rounded bg-white/[0.08]" />
        <div className="mx-auto mt-4 h-3 w-36 max-w-full rounded bg-white/[0.04]" />
      </div>

      <div className="animate-pulse space-y-3 px-4 py-4">
        <div className="h-3 w-32 rounded bg-white/[0.06]" />
        <div className="h-3 w-52 max-w-full rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

export default function SubmissionFeed() {
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const [submissions, setSubmissions] = useState<FeedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadFeed() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${backend}/api/feed/submissions`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const data = (await res.json().catch(() => ({
          success: false,
          message: "Invalid response from server",
        }))) as FeedResponse;

        if (!res.ok || !data.success) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Failed to load submission feed",
          );
        }

        if (!ignore) {
          setCurrentUserId(data.currentUserId || "");
          setSubmissions(
            Array.isArray(data.submissions) ? data.submissions : [],
          );
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load submission feed",
          );
          setCurrentUserId("");
          setSubmissions([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadFeed();

    return () => {
      ignore = true;
    };
  }, [backend]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-5">
          <LoadingPost />
          <LoadingPost />
          <LoadingPost />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.05] px-5 py-5">
          <p className="text-sm font-semibold text-red-300">
            Unable to load feed
          </p>
          <p className="mt-1 text-sm text-red-300/70">{error}</p>
        </div>
      );
    }

    if (submissions.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#111214] px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300">
            ↗
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">
            No posts yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
            Follow users with synced LeetCode activity and their latest
            submissions will show up here.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {submissions.map((submission) => (
          <SubmissionFeedItem
            key={submission._id}
            submission={submission}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    );
  }, [loading, error, submissions, currentUserId]);

  return (
    <section className="mx-auto w-full max-w-[576px] min-w-0">
      <aside className="fixed left-5 top-[55%] z-20 hidden w-[320px] -translate-y-1/2 xl:block 2xl:left-8 2xl:w-[360px]">
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain">
          <FriendLeaderboardCard backend={backend} />
        </div>
      </aside>

      <main className="w-full min-w-0">{content}</main>

      <aside className="fixed right-5 top-1/2 z-20 hidden w-[320px] -translate-y-1/2 xl:block 2xl:right-8 2xl:w-[360px]">
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain">
          <FriendStreaksCard
            backend={backend}
            currentUserId={currentUserId}
          />
        </div>
      </aside>
    </section>
  );
}
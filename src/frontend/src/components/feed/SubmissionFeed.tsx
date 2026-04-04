"use client";

import { useEffect, useMemo, useState } from "react";
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
      submissions: FeedSubmission[];
    }
  | {
      success: false;
      message?: string;
    };

function LoadingCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="h-4 w-32 rounded bg-white/10" />
      <div className="mt-4 h-5 w-64 rounded bg-white/10" />
      <div className="mt-3 h-4 w-40 rounded bg-white/10" />
    </div>
  );
}

export default function SubmissionFeed() {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const [submissions, setSubmissions] = useState<FeedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        const data: FeedResponse = await res.json().catch(() => ({
          success: false,
          message: "Invalid response from server",
        }));

        if (!res.ok || !data.success) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Failed to load submission feed"
          );
        }

        if (!ignore) {
          setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message || "Failed to load submission feed");
          setSubmissions([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      ignore = true;
    };
  }, [backend]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      );
    }

    if (submissions.length === 0) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-base font-medium text-white">No feed activity yet</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Once you follow users with synced LeetCode activity, their recent
            submissions will show up here.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {submissions.map((submission) => (
          <SubmissionFeedItem key={submission._id} submission={submission} />
        ))}
      </div>
    );
  }, [loading, error, submissions]);

  return <section>{content}</section>;
}
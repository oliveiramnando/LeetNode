// src/frontend/src/app/link-account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

type AuthUser = {
  id: string;
  githubID?: string | number | null;
  githubUsername?: string | null;
  githubUrl?: string | null;
  leetcodeUsername?: string | null;
  leetcodeUsernameLower?: string | null;
};

type MeResponse =
  | { loggedIn: false }
  | {
      loggedIn: true;
      user: AuthUser;
    };

type LinkAccountResponse = {
  message?: string;
};

export default function LinkAccountPage() {
  const router = useRouter();
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const { refresh } = useAuth();

  const [checkingSession, setCheckingSession] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function checkSession() {
      try {
        const res = await fetch(`${backend}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = (await res.json()) as MeResponse;

        if (!alive) return;

        if (!res.ok || data.loggedIn === false) {
          setLoggedIn(false);
          setUser(null);
          router.replace("/");
          return;
        }

        setLoggedIn(true);
        setUser(data.user);

        if (data.user?.leetcodeUsername) {
          router.replace(
            `/profile/${encodeURIComponent(data.user.leetcodeUsername)}`
          );
        }
      } catch {
        if (!alive) return;
        setLoggedIn(false);
        setUser(null);
        router.replace("/");
      } finally {
        if (!alive) return;
        setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      alive = false;
    };
  }, [backend, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleaned = leetcodeUsername.trim();

    if (!cleaned) {
      setError("Please enter your LeetCode username.");
      return;
    }

    if (!/^[A-Za-z0-9_-]{3,30}$/.test(cleaned)) {
      setError("That doesn’t look like a valid LeetCode username.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${backend}/api/leetcode/link-account`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ leetcodeUsername: cleaned }),
      });

      const payload = (await res
        .json()
        .catch(() => ({}))) as LinkAccountResponse;

      if (!res.ok) {
        setError(payload.message || "Failed to link your LeetCode account.");
        return;
      }

      await refresh();

      router.replace(`/profile/${encodeURIComponent(cleaned)}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <section className="mx-auto max-w-xl px-6 py-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-sm text-zinc-300">
          Checking your session…
        </div>
      </section>
    );
  }

  if (!loggedIn) return null;

  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-zinc-100">
        <h1 className="text-3xl font-semibold tracking-tight">
          Link your LeetCode account
        </h1>

        <p className="mt-3 text-sm text-zinc-300">
          You’re signed in with GitHub{" "}
          {user?.githubUsername ? (
            <span className="text-zinc-100">@{user.githubUsername}</span>
          ) : null}
          . Enter your LeetCode username to finish setup.
        </p>

        <div className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
          <span className="font-semibold">Before continuing:</span> Make sure
          your GitHub account is linked to your LeetCode account first.
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-zinc-300">LeetCode username</span>

            <input
              value={leetcodeUsername}
              onChange={(e) => setLeetcodeUsername(e.target.value)}
              placeholder="e.g. N3m0lives"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/20"
              autoComplete="off"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
          >
            {submitting ? "Linking…" : "Link account"}
          </button>

          <div className="space-y-1 text-xs text-zinc-400">
            <p>Your LeetCode username is the one in your profile URL.</p>
            <p>
              Your GitHub account must already be linked in your LeetCode
              account settings.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
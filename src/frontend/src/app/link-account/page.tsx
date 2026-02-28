// src/frontend/src/app/link-account/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponse = {
  _id: string;
  githubUsername?: string;
  githubUrl?: string;
  leetcodeUsername?: string | null;
};

export default function LinkAccountPage() {
  const router = useRouter();

  const backend = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
    []
  );

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Load current session user
  useEffect(() => {
    (async () => {
      try {
        setLoadingMe(true);
        setError("");

        const res = await fetch(`${backend}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          // Not logged in, bounce home
          setMe(null);
          router.replace("/");
          return;
        }

        const data = (await res.json()) as { user: MeResponse } | MeResponse;
        // allow either { user } or direct user payload
        const user = (data as any).user ?? data;

        setMe(user);

        // If already linked, go straight to profile
        if (user?.leetcodeUsername) {
          router.replace(`/profile/${encodeURIComponent(user.leetcodeUsername)}`);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load your account.");
      } finally {
        setLoadingMe(false);
      }
    })();
  }, [backend, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleaned = leetcodeUsername.trim();
    if (!cleaned) {
      setError("Please enter your LeetCode username.");
      return;
    }

    // very light validation (LeetCode usernames are typically 3–16, alnum + underscore + hyphen)
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

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(payload?.message || "Failed to link your LeetCode account.");
        return;
      }

      router.replace(`/profile/${encodeURIComponent(cleaned)}`);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-zinc-100">
        <h1 className="text-3xl font-semibold tracking-tight">
          Link your LeetCode account
        </h1>

        <p className="mt-3 text-sm text-zinc-300">
          You’re signed in with GitHub{me?.githubUsername ? (
            <>
              {" "}
              as <span className="text-zinc-100">@{me.githubUsername}</span>
            </>
          ) : null}
          . Enter your LeetCode username to finish setup.
        </p>

        {loadingMe ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
            Checking your session…
          </div>
        ) : (
          <>
            {error ? (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-sm text-zinc-300">LeetCode username</span>
                <input
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  placeholder="e.g. N3m0lives"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/20"
                  autoComplete="off"
                  inputMode="text"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Linking…" : "Link account"}
              </button>

              <div className="text-xs text-zinc-400">
                Tip: Your LeetCode username is the one in your profile URL.
              </div>
            </form>

            <div className="mt-8 flex items-center justify-between text-xs text-zinc-400">
              <button
                onClick={() => router.replace("/")}
                className="hover:text-zinc-200"
              >
                Back to home
              </button>

              {me?.githubUrl ? (
                <a
                  href={me.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-zinc-200"
                >
                  View GitHub profile
                </a>
              ) : (
                <span />
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
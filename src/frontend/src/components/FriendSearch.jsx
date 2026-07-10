// components/FriendSearch.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FriendSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();

    const username = query.trim();
    if (!username) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch(
        `/api/leetcode/user/${encodeURIComponent(username)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!res.ok) {
        let msg = "User not found.";

        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
          if (data?.message) msg = data.message;
        } catch {
          // Ignore JSON parse errors.
        }

        setStatus("error");
        setError(msg);
        return;
      }

      router.push(`/profile/${encodeURIComponent(username)}`);
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    } finally {
      setStatus((prev) => (prev === "loading" ? "idle" : prev));
    }
  }

  return (
    <div className="relative flex flex-col">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);

              if (status === "error") {
                setStatus("idle");
                setError("");
              }
            }}
            placeholder="User search"
            aria-label="User search"
            className="h-9 w-56 rounded-xl border border-white/10 bg-white/[0.04] px-3 pr-20 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-emerald-400/30 focus:bg-white/[0.06]"
          />

          {status === "loading" ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              Searching…
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !query.trim()}
          className="h-9 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.14] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-500/10"
        >
          Search
        </button>
      </form>

      {status === "error" ? (
        <p className="absolute left-0 top-11 min-w-64 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
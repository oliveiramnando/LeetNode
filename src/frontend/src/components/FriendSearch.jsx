"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FriendSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  // Clear error when user edits input again
  useEffect(() => {
    if (status === "error") {
      setStatus("idle");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleSearch(e) {
    e.preventDefault();

    const username = query.trim();
    if (!username) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch(`/api/leetcode/user/${encodeURIComponent(username)}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });

      if (!res.ok) {
        // Prefer backend message if present, but keep it safe/clean
        let msg = "User not found.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
          if (data?.message) msg = data.message;
        } catch {
          // ignore JSON parse errors
        }
        setStatus("error");
        setError(msg);
        return;
      }

      // Success → go to profile page
      router.push(`/profile/${encodeURIComponent(username)}`);
    } catch (err) {
      setStatus("error");
      setError("Network error. Please try again.");
    } finally {
      // If we navigated, the component may unmount; this is safe either way.
      setStatus((prev) => (prev === "loading" ? "idle" : prev));
    }
  }

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends…"
            aria-label="Search friends"
            className="h-9 w-56 rounded-md border border-white/10 bg-[#141414] px-3 pr-20 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/20"
          />

          {status === "loading" && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              Searching…
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !query.trim()}
          className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-zinc-200 transition hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5"
        >
          Search
        </button>
      </form>

      {/* Inline error near search bar */}
      {status === "error" && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

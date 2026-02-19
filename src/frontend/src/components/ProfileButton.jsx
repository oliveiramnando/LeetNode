"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function useLoggedInUsername() {
  // TEMP approach: localStorage, fallback to hardcoded placeholder.
  // Swap later with /api/me when auth is finalized.
  const FALLBACK = "N3m0lives";
  const [username, setUsername] = useState(FALLBACK);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("leetnode_username");
      if (stored && stored.trim()) setUsername(stored.trim());
    } catch {
      // localStorage might be blocked; keep fallback
    }
  }, []);

  return username;
}

export default function ProfileButton() {
  const router = useRouter();
  const username = useLoggedInUsername();

  return (
    <button
      type="button"
      onClick={() => router.push(`/profile/${encodeURIComponent(username)}`)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
      aria-label="Go to profile"
      title="Profile"
    >
      {/* Simple user icon (no dropdown) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
      >
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </button>
  );
}

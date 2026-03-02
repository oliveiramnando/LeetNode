"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./auth/AuthProvider";

export default function ProfileButton() {
  const router = useRouter();
  const { loggedIn, user } = useAuth();

  const username = user?.leetcodeUsername;

  return (
    <button
      type="button"
      onClick={() => {
        if (!username) return;
        router.push(`/profile/${encodeURIComponent(username)}`);
      }}
      disabled={!loggedIn || !username}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Go to profile"
      title={username ? "Profile" : "Not logged in"}
    >
      {/* icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </button>
  );
}
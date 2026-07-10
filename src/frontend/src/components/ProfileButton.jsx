// src/frontend/src/components/ProfileButton.jsx
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Go to profile"
      title={username ? "Profile" : "Not logged in"}
    >
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
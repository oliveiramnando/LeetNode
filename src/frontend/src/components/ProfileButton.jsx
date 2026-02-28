"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function useLoggedInUsername() {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  const meUrl = `${backend}/api/auth/me`;

  const [username, setUsername] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(meUrl, {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        const leetcodeUsername = data?.user?.leetcodeUsername;

        if (!cancelled && leetcodeUsername) {
          setUsername(leetcodeUsername);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meUrl]);

  return username;
}

export default function ProfileButton() {
  const router = useRouter();
  const username = useLoggedInUsername();

  return (
    <button
      type="button"
      onClick={() => {
        if (!username) return;   // prevent navigating to /profile/undefined
        router.push(`/profile/${encodeURIComponent(username)}`);
      }}
      disabled={!username}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
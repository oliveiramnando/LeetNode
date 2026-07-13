// src/frontend/src/components/Navbar.jsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "./Container";
import FriendSearch from "./FriendSearch";
import ProfileButton from "./ProfileButton";
import { useAuth } from "./auth/AuthProvider";

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M3 10.75 12 3l9 7.75v8.5A1.75 1.75 0 0 1 19.25 21h-4.5v-6.25h-5.5V21h-4.5A1.75 1.75 0 0 1 3 19.25v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const { loading, loggedIn, user, signOutLocal } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch(`${backend}/api/auth/signout`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
    } finally {
      signOutLocal();
      router.push("/");
      router.refresh();
    }
  };

  const startOAuth = `${backend}/api/auth/github/start`;
  const homeHref = loggedIn ? "/feed" : "/";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/65">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href={homeHref} className="group inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-sm font-semibold text-emerald-300 transition group-hover:border-emerald-400/30 group-hover:bg-emerald-500/[0.14]">
              L
            </span>

            <span className="font-semibold tracking-tight text-white">
              LeetNode
            </span>
          </Link>

          {loggedIn ? (
            <div className="hidden md:block">
              <FriendSearch />
            </div>
          ) : null}
        </div>

        <nav className="flex items-center gap-2 text-sm">
          {loading ? null : !loggedIn ? (
            <>
              <a
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-medium text-zinc-200 transition hover:bg-white/[0.07] hover:text-white"
                href={startOAuth}
              >
                Login
              </a>

              <a
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 font-medium text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.14]"
                href={startOAuth}
              >
                Sign up
              </a>
            </>
          ) : (
            <>
              <Link
                href="/feed"
                aria-label="Home"
                title="Home"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200 transition hover:bg-white/[0.07] hover:text-white"
              >
                <HomeIcon />
              </Link>

              {user?.leetcodeUsername ? (
                <span className="hidden max-w-36 truncate rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-zinc-400 sm:inline-flex">
                  {user.leetcodeUsername}
                </span>
              ) : null}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                Logout
              </button>

              <ProfileButton />
            </>
          )}
        </nav>
      </Container>

      {loggedIn ? (
        <div className="border-t border-white/10 px-4 py-3 md:hidden">
          <FriendSearch />
        </div>
      ) : null}
    </header>
  );
}
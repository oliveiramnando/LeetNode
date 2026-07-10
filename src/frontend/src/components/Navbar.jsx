// src/frontend/src/components/Navbar.jsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "./Container";
import FriendSearch from "./FriendSearch";
import ProfileButton from "./ProfileButton";
import { useAuth } from "./auth/AuthProvider";

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

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/65">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="group inline-flex items-center gap-2">
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
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-medium text-zinc-200 transition hover:bg-white/[0.07] hover:text-white"
              >
                Feed
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
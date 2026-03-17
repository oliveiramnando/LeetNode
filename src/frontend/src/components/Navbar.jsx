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
    <header className="border-b border-white/10 bg-[#1E1E1E]">
      <Container className="flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold tracking-tight text-white">
            LeetNode
          </Link>
          {loggedIn && <FriendSearch />}
        </div>

        <nav className="flex items-center gap-4 text-sm text-zinc-300">
          {loading ? null : !loggedIn ? (
            <>
              <a className="hover:text-white transition-colors" href={startOAuth}>
                signup
              </a>
              <a className="hover:text-white transition-colors" href={startOAuth}>
                login
              </a>
            </>
          ) : (
            <>
              <Link href="/feed" className="hover:text-white transition-colors">
                feed
              </Link>
              <span className="text-zinc-400">{user?.leetcodeUsername}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="hover:text-white transition-colors"
              >
                logout
              </button>
              <ProfileButton />
            </>
          )}
        </nav>
      </Container>
    </header>
  );
}
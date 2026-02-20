"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Container from "./Container";
import FriendSearch from "./FriendSearch";
import ProfileButton from "./ProfileButton";

export default function Navbar() {
  const router = useRouter();
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Check session on mount
  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch(`${backend}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    };

    loadMe();
  }, [backend]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${backend}/api/auth/signout`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Logout request did not return OK:", {
          status: res.status,
          statusText: res.statusText,
          body: text?.slice?.(0, 300) ?? text,
        });
      }
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      setUser(null);      // update navbar immediately
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

          {/* Only show friend search when logged in (optional) */}
          {user && <FriendSearch />}
        </div>

        <nav className="flex items-center gap-4 text-sm text-zinc-300">
          {/* Avoid flicker while checking auth */}
          {loadingAuth ? null : !user ? (
            <>
              {/* Use OAuth start instead of /signup /login pages (since you’re using GitHub OAuth) */}
              <a className="hover:text-white transition-colors" href={startOAuth}>
                signup
              </a>
              <a className="hover:text-white transition-colors" href={startOAuth}>
                login
              </a>
            </>
          ) : (
            <>
              <span className="text-zinc-400">{user.username}</span>

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
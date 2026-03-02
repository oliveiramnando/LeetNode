// src/frontend/src/components/profile/ProfileSocialActions.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Pill } from "@/components/ui/Pill";
import { useAuth } from "@/components/auth/AuthProvider";

type FriendDoc = {
  _id: string;
  leetnodeUser: string;
  leetcodeUsername: string; // lowercase in DB
  createdAt?: string;
};

function normalizeLc(username: string) {
  return String(username || "").trim().toLowerCase();
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[92vw] max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div className="text-sm font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ProfileSocialActions({ profileUsername }: { profileUsername: string }) {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const { loading: loadingAuth, loggedIn, user } = useAuth();

  const target = useMemo(() => normalizeLc(profileUsername), [profileUsername]);

  const myLcLower = useMemo(() => {
    const raw = user?.leetcodeUsernameLower ?? user?.leetcodeUsername ?? "";
    return normalizeLc(raw);
  }, [user]);

  const isMyProfile = !!myLcLower && myLcLower === target;

  // follow state (viewing others)
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollowState, setLoadingFollowState] = useState(false);

  // counts (my profile)
  const [counts, setCounts] = useState<{ followerCount: number; followingCount: number } | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // lists (my profile; lazy)
  const [followers, setFollowers] = useState<FriendDoc[]>([]);
  const [following, setFollowing] = useState<FriendDoc[]>([]);
  const [loadedListsOnce, setLoadedListsOnce] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [tab, setTab] = useState<"followers" | "following">("followers");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ fetch follow state via boolean endpoint (only for other profiles)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (loadingAuth) return;

      if (!loggedIn || isMyProfile) {
        setIsFollowing(false);
        setLoadingFollowState(false);
        return;
      }

      setLoadingFollowState(true);
      try {
        const res = await fetch(
          `${backend}/api/friend/is-following/${encodeURIComponent(target)}`,
          {
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" },
          }
        );

        if (!res.ok) {
          if (!cancelled) setIsFollowing(false);
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (!cancelled) setIsFollowing(Boolean(data?.isFollowing));
      } catch {
        if (!cancelled) setIsFollowing(false);
      } finally {
        if (!cancelled) setLoadingFollowState(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [backend, loadingAuth, loggedIn, isMyProfile, target]);

  // ✅ fetch counts immediately for my profile (cheap)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (loadingAuth) return;
      if (!loggedIn) return;
      if (!isMyProfile) return;

      setLoadingCounts(true);
      try {
        const res = await fetch(`${backend}/api/friend/counts`, {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;

        const data = await res.json().catch(() => null);
        const c = data?.counts;

        if (!cancelled && c) {
          setCounts({
            followerCount: Number(c.followerCount ?? 0),
            followingCount: Number(c.followingCount ?? 0),
          });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingCounts(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [backend, loadingAuth, loggedIn, isMyProfile]);

  // ✅ lazy-load lists only when modal opens (my profile)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!openModal) return;
      if (loadingAuth || !loggedIn || !isMyProfile) return;
      if (loadedListsOnce) return;

      setLoadingLists(true);
      try {
        const [followersRes, followingRes] = await Promise.all([
          fetch(`${backend}/api/friend/followers`, { credentials: "include", cache: "no-store" }),
          fetch(`${backend}/api/friend/following`, { credentials: "include", cache: "no-store" }),
        ]);

        const followersJson = followersRes.ok ? await followersRes.json().catch(() => null) : null;
        const followingJson = followingRes.ok ? await followingRes.json().catch(() => null) : null;

        if (!cancelled) {
          setFollowers(Array.isArray(followersJson?.followers) ? followersJson.followers : []);
          setFollowing(Array.isArray(followingJson?.following) ? followingJson.following : []);
          setLoadedListsOnce(true);
        }
      } catch {
        if (!cancelled) {
          setFollowers([]);
          setFollowing([]);
          setLoadedListsOnce(true);
        }
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [openModal, backend, loadingAuth, loggedIn, isMyProfile, loadedListsOnce]);

  async function toggleFollow() {
    setError(null);

    if (loadingAuth) return;
    if (!loggedIn) {
      setError("Log in to follow users.");
      return;
    }
    if (isMyProfile) {
      setError("You can’t follow yourself.");
      return;
    }

    setBusy(true);
    try {
      const url = `${backend}/api/friend/${encodeURIComponent(target)}/follow`;
      const res = await fetch(url, {
        method: isFollowing ? "DELETE" : "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message || data?.error || "Request failed");
        return;
      }

      setIsFollowing((prev) => !prev);
    } catch {
      setError("Request failed (network).");
    } finally {
      setBusy(false);
    }
  }

  // Loading auth: placeholder pill
  if (loadingAuth) return <Pill className="text-[11px]">...</Pill>;
  if (!loggedIn) return null;

  // My profile
  if (isMyProfile) {
    const followersCount = counts?.followerCount ?? 0;
    const followingCount = counts?.followingCount ?? 0;

    return (
      <>
        <button
          type="button"
          onClick={() => {
            setTab("followers");
            setOpenModal(true);
          }}
          className="disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="View followers and following"
        >
          <Pill className="text-[11px]">
            {loadingCounts ? "Loading..." : `${followersCount} Followers • ${followingCount} Following`}
          </Pill>
        </button>

        <Modal open={openModal} onClose={() => setOpenModal(false)} title="Followers & Following">
          <div className="flex gap-2 px-4 pt-3">
            <button
              onClick={() => setTab("followers")}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                tab === "followers"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              }`}
            >
              Followers ({followers.length})
            </button>

            <button
              onClick={() => setTab("following")}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                tab === "following"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              }`}
            >
              Following ({following.length})
            </button>
          </div>

          <div className="px-4 pb-4 pt-3">
            <div className="max-h-[55vh] overflow-auto rounded-xl border border-neutral-200 p-2 text-sm dark:border-neutral-800">
              {loadingLists && !loadedListsOnce ? (
                <div className="p-3 text-neutral-500">Loading…</div>
              ) : tab === "following" ? (
                following.length ? (
                  <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {following.map((f) => (
                      <li key={f._id} className="py-2 px-2">
                        <Link
                          href={`/profile/${encodeURIComponent(f.leetcodeUsername)}`}
                          onClick={() => setOpenModal(false)}
                          className="block rounded-lg px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        >
                          {f.leetcodeUsername}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-neutral-500">You’re not following anyone yet.</div>
                )
              ) : followers.length ? (
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {followers.map((f) => (
                    <li key={f._id} className="py-2 px-2">
                      <Link
                        href={`/profile/${encodeURIComponent(f.leetcodeUsername)}`}
                        onClick={() => setOpenModal(false)}
                        className="block rounded-lg px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                      >
                        {f.leetcodeUsername}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-neutral-500">No followers yet.</div>
              )}
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Other profiles
  const label = loadingFollowState ? "..." : isFollowing ? "Unfollow" : "Follow";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={busy || loadingFollowState}
        className="disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Pill className="text-[11px]">{busy ? "Working..." : label}</Pill>
      </button>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Pill } from "@/components/ui/Pill";

type MeResponse =
  | { loggedIn: false }
  | {
      loggedIn: true;
      user: {
        id: string;
        leetcodeUsername?: string | null;
        leetcodeUsernameLower?: string | null;
      };
    };

type FriendDoc = {
  _id: string;
  leetnodeUser: string; // ObjectId string
  leetcodeUsername: string; // stored lowercase in Friend
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" aria-modal="true" role="dialog">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
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
  const target = useMemo(() => normalizeLc(profileUsername), [profileUsername]);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollowState, setLoadingFollowState] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // lists (only for your profile)
  const [followers, setFollowers] = useState<FriendDoc[]>([]);
  const [following, setFollowing] = useState<FriendDoc[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // popup
  const [openModal, setOpenModal] = useState(false);
  const [tab, setTab] = useState<"followers" | "following">("followers");

  const myLcLower =
    me && "loggedIn" in me && me.loggedIn
      ? (me.user.leetcodeUsernameLower ?? normalizeLc(me.user.leetcodeUsername ?? ""))
      : "";

  const isMyProfile = !!myLcLower && myLcLower === target;

  // Load /auth/me
  useEffect(() => {
    const run = async () => {
      setLoadingMe(true);
      try {
        const res = await fetch(`${backend}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          setMe({ loggedIn: false });
          return;
        }
        const data = await res.json();
        setMe(data);
      } catch {
        setMe({ loggedIn: false });
      } finally {
        setLoadingMe(false);
      }
    };
    run();
  }, [backend]);

  // Determine initial follow state (by checking my following list)
  useEffect(() => {
    const run = async () => {
      if (!me || !("loggedIn" in me) || !me.loggedIn) {
        setIsFollowing(false);
        setLoadingFollowState(false);
        return;
      }
      if (isMyProfile) {
        setIsFollowing(false);
        setLoadingFollowState(false);
        return;
      }

      setLoadingFollowState(true);
      try {
        const res = await fetch(`${backend}/api/friend/following`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          setIsFollowing(false);
          return;
        }
        const data = await res.json();
        const list: FriendDoc[] = Array.isArray(data?.following) ? data.following : [];
        setIsFollowing(list.some((x) => normalizeLc(x.leetcodeUsername) === target));
      } catch {
        setIsFollowing(false);
      } finally {
        setLoadingFollowState(false);
      }
    };

    run();
  }, [backend, me, target, isMyProfile]);

  // Load my followers/following lists (only when I'm on my profile)
  useEffect(() => {
    const run = async () => {
      if (!me || !("loggedIn" in me) || !me.loggedIn) return;
      if (!isMyProfile) return;

      setLoadingLists(true);
      try {
        const [followersRes, followingRes] = await Promise.all([
          fetch(`${backend}/api/friend/followers`, { credentials: "include", cache: "no-store" }),
          fetch(`${backend}/api/friend/following`, { credentials: "include", cache: "no-store" }),
        ]);

        const followersJson = followersRes.ok ? await followersRes.json() : null;
        const followingJson = followingRes.ok ? await followingRes.json() : null;

        setFollowers(Array.isArray(followersJson?.followers) ? followersJson.followers : []);
        setFollowing(Array.isArray(followingJson?.following) ? followingJson.following : []);
      } catch {
        setFollowers([]);
        setFollowing([]);
      } finally {
        setLoadingLists(false);
      }
    };

    run();
  }, [backend, me, isMyProfile]);

  async function toggleFollow() {
    setError(null);

    if (!me || !("loggedIn" in me) || !me.loggedIn) {
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

      // flip only AFTER success
      setIsFollowing(!isFollowing);
    } catch {
      setError("Request failed (network).");
    } finally {
      setBusy(false);
    }
  }

  const loggedIn = !!me && "loggedIn" in me && me.loggedIn;

  // Loading state: show a pill-looking placeholder that matches @username pill
  if (loadingMe) {
    return (
      <Pill className="text-[11px]">
        ...
      </Pill>
    );
  }

  // Not logged in: keep hero clean
  if (!loggedIn) return null;

  // MY profile: show counts pill (click opens popup)
  if (isMyProfile) {
    const followersCount = followers.length;
    const followingCount = following.length;

    return (
      <>
        <button
          type="button"
          disabled={loadingLists}
          onClick={() => {
            if (loadingLists) return;
            setTab("followers");
            setOpenModal(true);
          }}
          className="disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="View followers and following"
        >
          <Pill className="text-[11px]">
            {loadingLists ? "Loading..." : `${followersCount} Followers • ${followingCount} Following`}
          </Pill>
        </button>

        <Modal open={openModal} onClose={() => setOpenModal(false)} title="Followers & Following">
          {/* tabs */}
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

          {/* scrollable list */}
          <div className="px-4 pb-4 pt-3">
            <div className="max-h-[55vh] overflow-auto rounded-xl border border-neutral-200 p-2 text-sm dark:border-neutral-800">
              {tab === "following" ? (
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
                      {/* backend returns leetnodeUser ObjectId; if you want usernames, populate on backend */}
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

            <div className="mt-2 text-xs text-neutral-500">
              Tip: If you want follower usernames instead of IDs, update the backend to populate{" "}
              <span className="mx-1 font-mono">leetnodeUser</span>.
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // OTHER profiles: follow/unfollow pill
  const label = loadingFollowState ? "..." : isFollowing ? "Unfollow" : "Follow";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={busy || loadingFollowState}
        className="disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={isFollowing ? "Unfollow user" : "Follow user"}
      >
        <Pill className="text-[11px]">
          {busy ? "Working..." : label}
        </Pill>
      </button>

      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
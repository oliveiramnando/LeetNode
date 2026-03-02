"use client";

import React from "react";

type MeUser = {
  id?: string;
  _id?: string;
  githubUsername?: string;
  githubUrl?: string;
  leetcodeUsername?: string | null;
  leetcodeUsernameLower?: string | null;
};

type MeResponse =
  | { loggedIn: false }
  | { loggedIn: true; user: MeUser }
  // allow older shape where backend returns { user: ... } without loggedIn
  | { user: MeUser };

function normalizeMe(input: any): { loggedIn: boolean; user: MeUser | null } {
  if (!input) return { loggedIn: false, user: null };

  // canonical
  if (typeof input === "object" && "loggedIn" in input) {
    const loggedIn = Boolean((input as any).loggedIn);
    const user = loggedIn ? ((input as any).user ?? null) : null;
    return { loggedIn, user };
  }

  // older shape: { user: {...} }
  if (typeof input === "object" && "user" in input) {
    const user = (input as any).user ?? null;
    return { loggedIn: Boolean(user), user };
  }

  return { loggedIn: false, user: null };
}

type AuthContextValue = {
  loading: boolean;
  loggedIn: boolean;
  user: MeUser | null;
  refresh: () => Promise<void>;
  signOutLocal: () => void; // immediate UI update; you still call backend signout separately
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const backend = React.useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
    []
  );

  const [loading, setLoading] = React.useState(true);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [user, setUser] = React.useState<MeUser | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backend}/api/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        setLoggedIn(false);
        setUser(null);
        return;
      }

      const data = await res.json().catch(() => null);
      const normalized = normalizeMe(data);

      setLoggedIn(normalized.loggedIn);
      setUser(normalized.user);
    } catch {
      setLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [backend]);

  // Fetch once on initial mount
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const signOutLocal = React.useCallback(() => {
    setLoggedIn(false);
    setUser(null);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ loading, loggedIn, user, refresh, signOutLocal }),
    [loading, loggedIn, user, refresh, signOutLocal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
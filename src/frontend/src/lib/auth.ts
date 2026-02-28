// src/frontend/src/lib/auth.ts
export const backend =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export async function getMe() {
  const res = await fetch(`${backend}/api/auth/me`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export async function signOut() {
  const res = await fetch(`${backend}/api/auth/signout`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  return res.ok;
}
// src/frontend/src/app/api/leetcode/user/[username]/route.ts
import { NextResponse } from "next/server";

type AnyObj = Record<string, any>;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> | { username: string } }
) {
  const { username } = await ctx.params; // ✅ unwrap promise
  const base = process.env.BACKEND_URL || "http://localhost:8080";

  try {
    const userRes = await fetch(
      `${base}/api/leetcode/user/${encodeURIComponent(username)}`,
      { cache: "no-store", headers: { Accept: "application/json" } }
    );

    if (!userRes.ok) {
      const text = await userRes.text().catch(() => "");
      return NextResponse.json(
        { error: `user endpoint failed ${userRes.status}`, details: text },
        { status: userRes.status }
      );
    }

    const userJson = (await userRes.json()) as AnyObj;

    return NextResponse.json({ user: userJson }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reach backend", details: String(e) },
      { status: 502 }
    );
  }
}

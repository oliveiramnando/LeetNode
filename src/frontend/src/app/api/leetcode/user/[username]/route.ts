// src/frontend/src/app/api/leetcode/user/[username]/route.ts
import { NextResponse } from "next/server";

type JsonObject = Record<string, unknown>;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ username: string }> | { username: string } }
) {
  const { username } = await ctx.params;
  const base = process.env.BACKEND_URL || "http://localhost:8080";
  const cookie = req.headers.get("cookie") ?? "";

  try {
    const userRes = await fetch(
      `${base}/api/leetcode/user/${encodeURIComponent(username)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Cookie: cookie,
        },
      }
    );

    if (!userRes.ok) {
      const text = await userRes.text().catch(() => "");
      return NextResponse.json(
        { error: `user endpoint failed ${userRes.status}`, details: text },
        { status: userRes.status }
      );
    }

    const userJson = (await userRes.json()) as JsonObject;

    return NextResponse.json({ user: userJson }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Failed to reach backend", details: String(e) },
      { status: 502 }
    );
  }
}
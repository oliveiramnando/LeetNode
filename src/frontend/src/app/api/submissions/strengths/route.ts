//src/frontend/src/app/api/submissions/strengths/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

export async function GET() {
  try {
    const backendOrigin =
      process.env.BACKEND_ORIGIN || "http://localhost:8080";

    const cookieStore = await cookies();
    const headerStore = await headers();

    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const userAgent = headerStore.get("user-agent") ?? "";

    const upstream = await fetch(
      `${backendOrigin}/api/submissions/strengths`,
      {
        method: "GET",
        headers: {
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
          ...(userAgent ? { "user-agent": userAgent } : {}),
          accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message ?? "Proxy failed" },
      { status: 500 }
    );
  }
}
// src/frontend/src/app/page.js
export default function Home() {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  const start = `${backend}/api/auth/github/start`;

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10">
        <h1 className="text-4xl font-semibold tracking-tight">
          Track your LeetCode growth.
        </h1>
        <p className="mt-4 max-w-2xl text-orange-500">
          LeetNode turns your LeetCode data into performance analytics: difficulty
          progression, topic mastery, streak consistency, and more.
        </p>

        <div className="mt-8 flex gap-3">
          <a
            href={start}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 hover:bg-zinc-200"
          >
            Signup with GitHub
          </a>
          <a
            href={start}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-100 hover:bg-white/5"
          >
            Login with GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

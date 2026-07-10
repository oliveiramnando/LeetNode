// src/frontend/src/app/page.js
export default function Home() {
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  const start = `${backend}/api/auth/github/start`;

  const steps = [
    {
      number: "01",
      title: "Sign in with GitHub",
      description:
        "Create your LeetNode account using GitHub authentication.",
    },
    {
      number: "02",
      title: "Link your LeetCode",
      description:
        "Enter your LeetCode username so LeetNode can connect your problem-solving data.",
    },
    {
      number: "03",
      title: "Sync your progress",
      description:
        "We analyze your submissions, topics, difficulty spread, and consistency over time.",
    },
    {
      number: "04",
      title: "Track your growth",
      description:
        "See strengths, weaknesses, streaks, and smarter problem recommendations.",
    },
  ];

  const features = [
    "Difficulty progression",
    "Topic mastery insights",
    "Weakness detection by tag",
    "Streak and activity tracking",
    "Submission-based recommendations",
    "LeetCode growth analytics",
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="relative p-8 sm:p-10 md:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_36%)]" />

          <div className="relative max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-300">
              LeetNode
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Track your LeetCode growth with real analytics.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
              LeetNode turns your LeetCode activity into actionable insights:
              difficulty progression, topic mastery, streak consistency,
              weaknesses, and recommendations to help you improve faster.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={start}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.14]"
              >
                Signup with GitHub
              </a>

              <a
                href={start}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.07]"
              >
                Login with GitHub
              </a>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
              Before getting started, make sure your LeetCode account has GitHub
              linked to it. Then sign into LeetNode with GitHub and connect your
              LeetCode username.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300">
            Workflow
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            How it works
          </h2>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Getting started takes just a few steps.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl border border-white/10 bg-zinc-950/55 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur transition hover:border-emerald-400/20 hover:bg-white/[0.04]"
            >
              <p className="text-sm font-semibold text-emerald-300">
                {step.number}
              </p>

              <h3 className="mt-3 text-lg font-semibold text-white">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="grid gap-10 p-8 sm:p-10 md:grid-cols-2 md:items-start md:p-12">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300">
              Analytics
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              What you get
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-zinc-400">
              LeetNode helps you understand how you are actually progressing
              instead of just looking at solved counts.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-medium text-zinc-200"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Setup checklist
                </h3>

                <p className="mt-1 text-sm text-zinc-400">
                  Connect GitHub, link LeetCode, and start syncing.
                </p>
              </div>

              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                3 steps
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-zinc-300">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold text-white">
                  1. Link GitHub on LeetCode
                </p>
                <p className="mt-2 leading-6 text-zinc-400">
                  Your LeetCode account must already have GitHub connected.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold text-white">
                  2. Sign into LeetNode with GitHub
                </p>
                <p className="mt-2 leading-6 text-zinc-400">
                  Use GitHub login to create or access your LeetNode account.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold text-white">
                  3. Add your LeetCode username
                </p>
                <p className="mt-2 leading-6 text-zinc-400">
                  Once connected, LeetNode can start syncing your progress.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <a
                href={start}
                className="inline-flex rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.14]"
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
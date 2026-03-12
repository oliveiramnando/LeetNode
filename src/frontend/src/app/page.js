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
    <main className="mx-auto max-w-6xl px-6 py-20">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-10 md:p-14">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-400">
            LeetNode
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Track your LeetCode growth with real analytics.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
            LeetNode turns your LeetCode activity into actionable insights:
            difficulty progression, topic mastery, streak consistency,
            weaknesses, and recommendations to help you improve faster.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={start}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Signup with GitHub
            </a>
            <a
              href={start}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/5"
            >
              Login with GitHub
            </a>
          </div>

          <p className="mt-4 text-sm text-zinc-400">
            Before getting started, make sure your LeetCode account has GitHub
            linked to it. Then sign into LeetNode with GitHub and connect your
            LeetCode username.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
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
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm font-semibold text-orange-400">
                {step.number}
              </p>
              <h3 className="mt-3 text-lg font-medium text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-10 md:p-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              What you get
            </h2>
            <p className="mt-4 max-w-xl text-zinc-400">
              LeetNode helps you understand how you are actually progressing
              instead of just looking at solved counts.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-200"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <h3 className="text-lg font-medium text-white">
              Setup checklist
            </h3>

            <div className="mt-5 space-y-4 text-sm text-zinc-300">
              <div className="rounded-xl border border-white/10 p-4">
                <p className="font-medium text-white">
                  1. Link GitHub on LeetCode
                </p>
                <p className="mt-2 text-zinc-400">
                  Your LeetCode account must already have GitHub connected.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-4">
                <p className="font-medium text-white">
                  2. Sign into LeetNode with GitHub
                </p>
                <p className="mt-2 text-zinc-400">
                  Use GitHub login to create or access your LeetNode account.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 p-4">
                <p className="font-medium text-white">
                  3. Add your LeetCode username
                </p>
                <p className="mt-2 text-zinc-400">
                  Once connected, LeetNode can start syncing your progress.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <a
                href={start}
                className="inline-flex rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-400"
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
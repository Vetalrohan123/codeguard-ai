"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CircleHelp,
  Crown,
  GitPullRequest,
  Infinity,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

type Billing = "monthly" | "yearly";

const plans = [
  {
    name: "Free",
    description:
      "For developers exploring AI-powered code review.",
    monthly: 0,
    yearly: 0,
    popular: false,
    icon: Zap,
    iconClass: "text-zinc-300",
    features: [
      "10 PR reviews / month",
      "Basic security findings",
      "Logic & bug detection",
      "Public repositories",
      "Standard AI explanations",
      "Community support",
    ],
    muted: [
      "Custom review rules",
      "Advanced analytics",
      "Team workspaces",
    ],
    cta: "Start for free",
  },
  {
    name: "Pro",
    description:
      "For developers who want deeper, repository-aware reviews.",
    monthly: 29,
    yearly: 24,
    popular: true,
    icon: Sparkles,
    iconClass: "text-violet-300",
    features: [
      "Unlimited PR reviews",
      "Private repositories",
      "Full repository context",
      "Security & performance analysis",
      "Architecture findings",
      "Custom review rules",
      "PR inline comments",
      "Slack & email notifications",
    ],
    muted: [],
    cta: "Start Pro",
  },
  {
    name: "Team",
    description:
      "For engineering teams building consistent review standards.",
    monthly: 79,
    yearly: 66,
    popular: false,
    icon: Users,
    iconClass: "text-cyan-300",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared review rules",
      "Organization dashboard",
      "Team analytics",
      "RBAC & permissions",
      "Review activity history",
      "Priority support",
    ],
    muted: [],
    cta: "Build your team",
  },
];

const comparisonRows = [
  {
    label: "PR reviews",
    free: "10 / month",
    pro: "Unlimited",
    team: "Unlimited",
  },
  {
    label: "Repository context",
    free: "Basic",
    pro: "Full",
    team: "Full",
  },
  {
    label: "Security analysis",
    free: true,
    pro: true,
    team: true,
  },
  {
    label: "Performance analysis",
    free: false,
    pro: true,
    team: true,
  },
  {
    label: "Architecture analysis",
    free: false,
    pro: true,
    team: true,
  },
  {
    label: "Custom rules",
    free: false,
    pro: true,
    team: true,
  },
  {
    label: "Team analytics",
    free: false,
    pro: false,
    team: true,
  },
  {
    label: "RBAC",
    free: false,
    pro: false,
    team: true,
  },
];

function ComparisonValue({
  value,
}: {
  value: string | boolean;
}) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 p-1">
        <Check className="h-3.5 w-3.5 text-emerald-300" />
      </span>
    );
  }

  if (value === false) {
    return <span className="text-zinc-700">—</span>;
  }

  return (
    <span className="text-zinc-300">
      {value}
    </span>
  );
}

export function PricingSection() {
  const [billing, setBilling] =
    useState<Billing>("monthly");

  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] px-4 py-28 sm:px-6 lg:px-8"
    >
      {/* =========================================================
          BACKGROUND
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="absolute left-1/2 top-20 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.07] blur-[140px]" />

        <div className="absolute bottom-0 left-1/4 h-[300px] w-[400px] rounded-full bg-cyan-500/[0.035] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* =========================================================
            HEADER
        ========================================================== */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              margin: "-100px",
            }}
            transition={{
              duration: 0.5,
            }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300"
          >
            <Sparkles className="h-3.5 w-3.5" />

            Simple developer pricing
          </motion.div>

          <motion.h2
            initial={{
              opacity: 0,
              y: 18,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              margin: "-100px",
            }}
            transition={{
              duration: 0.6,
              delay: 0.05,
            }}
            className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"
          >
            Start small.
            <br />

            <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
              Scale with your codebase.
            </span>
          </motion.h2>

          <motion.p
            initial={{
              opacity: 0,
              y: 18,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              margin: "-100px",
            }}
            transition={{
              duration: 0.6,
              delay: 0.1,
            }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base"
          >
            Use AI code review when you need it.
            Upgrade when your repositories and
            engineering team grow.
          </motion.p>
        </div>

        {/* =========================================================
            BILLING TOGGLE
        ========================================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
            delay: 0.15,
          }}
          className="mt-10 flex justify-center"
        >
          <div className="inline-flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-1.5 shadow-2xl shadow-black/20">
            <button
              type="button"
              onClick={() =>
                setBilling("monthly")
              }
              className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                billing === "monthly"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() =>
                setBilling("yearly")
              }
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                billing === "yearly"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Yearly

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  billing === "yearly"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-emerald-400/10 text-emerald-300"
                }`}
              >
                SAVE 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* =========================================================
            PLANS
        ========================================================== */}
        <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan, index) => {
            const Icon = plan.icon;

            const price =
              billing === "monthly"
                ? plan.monthly
                : plan.yearly;

            return (
              <motion.div
                key={plan.name}
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  margin: "-80px",
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.08,
                }}
                className={`relative flex flex-col overflow-hidden rounded-3xl border ${
                  plan.popular
                    ? "border-violet-400/40 bg-gradient-to-b from-violet-500/[0.10] via-white/[0.035] to-white/[0.02] shadow-[0_0_80px_rgba(139,92,246,0.10)]"
                    : "border-white/[0.08] bg-white/[0.025]"
                }`}
              >
                {/* Recommended top line */}
                {plan.popular && (
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
                )}

                {/* Recommended badge */}
                {plan.popular && (
                  <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-400/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-violet-300">
                    <Crown className="h-3 w-3" />

                    Recommended
                  </div>
                )}

                {/* Plan header */}
                <div className="p-7 sm:p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                    <Icon
                      className={`h-5 w-5 ${plan.iconClass}`}
                    />
                  </div>

                  <h3 className="mt-6 text-xl font-semibold text-white">
                    {plan.name}
                  </h3>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-zinc-500">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-7 flex items-end gap-2">
                    <motion.span
                      key={`${plan.name}-${billing}`}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="text-5xl font-semibold tracking-[-0.05em] text-white"
                    >
                      ${price}
                    </motion.span>

                    <span className="mb-1.5 text-sm text-zinc-600">
                      {price === 0
                        ? "forever"
                        : "/ month"}
                    </span>
                  </div>

                  {/* Annual savings */}
                  {billing === "yearly" &&
                    price > 0 && (
                      <p className="mt-2 text-xs text-emerald-300">
                        Billed annually · save $
                        {plan.monthly * 12 -
                          price * 12}
                      </p>
                    )}

                  {/* CTA */}
                  <button
                    type="button"
                    className={`mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      plan.popular
                        ? "bg-white text-black hover:bg-violet-50"
                        : "border border-white/[0.10] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {plan.cta}

                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Divider */}
                <div className="mx-7 h-px bg-white/[0.06] sm:mx-8" />

                {/* Features */}
                <div className="flex-1 p-7 sm:p-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                    Includes
                  </p>

                  <ul className="mt-5 space-y-3.5">
                    {plan.features.map(
                      (feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm text-zinc-300"
                        >
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/10">
                            <Check className="h-3 w-3 text-emerald-300" />
                          </span>

                          <span>
                            {feature}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>

                  {plan.muted.length > 0 && (
                    <>
                      <div className="my-6 h-px bg-white/[0.05]" />

                      <ul className="space-y-3.5">
                        {plan.muted.map(
                          (feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-3 text-sm text-zinc-600"
                            >
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/[0.06]">
                                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                              </span>

                              {feature}
                            </li>
                          ),
                        )}
                      </ul>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* =========================================================
            USAGE METER
        ========================================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 24,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            margin: "-80px",
          }}
          transition={{
            duration: 0.6,
          }}
          className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]"
        >
          <div className="grid lg:grid-cols-[1fr_auto]">
            <div className="p-7 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="h-4 w-4 text-violet-300" />

                    <span className="text-sm font-medium text-white">
                      Review usage
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    Track your monthly review volume as
                    your repositories grow.
                  </p>
                </div>

                <div className="font-mono text-xs text-zinc-400">
                  <span className="text-white">
                    7
                  </span>{" "}
                  / 10 reviews
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  whileInView={{
                    width: "70%",
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.2,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                />
              </div>

              <div className="mt-3 flex justify-between font-mono text-[10px] text-zinc-600">
                <span>0</span>

                <span>
                  FREE PLAN LIMIT
                </span>

                <span>10</span>
              </div>
            </div>

            <div className="flex items-center border-t border-white/[0.06] p-7 lg:border-l lg:border-t-0 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
                  <Infinity className="h-5 w-5 text-violet-300" />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Need more reviews?
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Upgrade to Pro for unlimited
                    reviews.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =========================================================
            COMPARISON
        ========================================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 28,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            margin: "-80px",
          }}
          transition={{
            duration: 0.6,
          }}
          className="mt-20"
        >
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">
                Compare plans
              </p>

              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Everything you need to review
                better.
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <CircleHelp className="h-3.5 w-3.5" />

              Demo pricing for the product
              concept
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
            <div className="grid grid-cols-4 border-b border-white/[0.06] bg-white/[0.025] px-5 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 sm:px-7">
              <div>Feature</div>

              <div className="text-center">
                Free
              </div>

              <div className="text-center text-violet-300">
                Pro
              </div>

              <div className="text-center text-cyan-300">
                Team
              </div>
            </div>

            {comparisonRows.map(
              (row, index) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-4 px-5 py-5 text-sm sm:px-7 ${
                    index !==
                    comparisonRows.length - 1
                      ? "border-b border-white/[0.05]"
                      : ""
                  }`}
                >
                  <div className="text-zinc-300">
                    {row.label}
                  </div>

                  <div className="flex justify-center">
                    <ComparisonValue
                      value={row.free}
                    />
                  </div>

                  <div className="flex justify-center">
                    <ComparisonValue
                      value={row.pro}
                    />
                  </div>

                  <div className="flex justify-center">
                    <ComparisonValue
                      value={row.team}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </motion.div>

        {/* =========================================================
            TRUST STRIP
        ========================================================== */}
        <motion.div
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.7,
          }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs text-zinc-600"
        >
          <span className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />

            Private repositories
          </span>

          <span className="hidden h-1 w-1 rounded-full bg-zinc-800 sm:block" />

          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />

            Permission-scoped access
          </span>

          <span className="hidden h-1 w-1 rounded-full bg-zinc-800 sm:block" />

          <span className="flex items-center gap-2">
            <GitPullRequest className="h-3.5 w-3.5" />

            Built around pull requests
          </span>
        </motion.div>

        {/* =========================================================
            BOTTOM CTA
        ========================================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
          }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-zinc-500">
            No complicated setup. Connect your
            repository and start reviewing.
          </p>

          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-violet-300"
          >
            Explore how it works

            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

export default PricingSection;
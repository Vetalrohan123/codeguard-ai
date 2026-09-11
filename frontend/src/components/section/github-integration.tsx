"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

function CommitRow({
  hash,
  message,
  time,
}: {
  hash: string;
  message: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.05] py-3 last:border-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]">
        <GitCommit className="h-3.5 w-3.5 text-white/30" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] text-white/55">
          {message}
        </div>

        <div className="mt-1 flex items-center gap-2 font-mono text-[8px] text-white/20">
          <span>{hash}</span>
          <span>·</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}

function ReviewComment({
  severity,
  title,
  description,
  line,
}: {
  severity: "critical" | "high";
  title: string;
  description: string;
  line: number;
}) {
  const critical = severity === "critical";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-white/[0.06] bg-[#0a0a0c] p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
            critical
              ? "border-red-400/15 bg-red-500/10 text-red-300"
              : "border-orange-400/15 bg-orange-500/10 text-orange-300"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-mono text-[8px] uppercase tracking-[0.15em] ${
                critical ? "text-red-300/70" : "text-orange-300/70"
              }`}
            >
              {critical ? "critical" : "high"}
            </span>

            <span className="font-mono text-[8px] text-white/15">
              line {line}
            </span>
          </div>

          <div className="mt-1.5 text-xs font-medium text-white/75">
            {title}
          </div>

          <p className="mt-2 text-[10px] leading-5 text-white/35">
            {description}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Bot className="h-3 w-3 text-violet-300/60" />

            <span className="font-mono text-[8px] text-white/20">
              ReviewAI
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function GitHubIntegration() {
  return (
    <section className="relative overflow-hidden bg-[#050506] py-24 sm:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[20%] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.055] blur-[150px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5">
            <FaGithub className="h-3.5 w-3.5 text-white/60" />

            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
              works where you work
            </span>
          </div>

          <h2 className="text-3xl font-medium tracking-[-0.035em] text-white sm:text-5xl">
            Your code stays in
            <span className="text-white/30"> GitHub.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
            Connect a repository once. ReviewAI automatically analyzes pull
            requests and brings actionable findings directly into your existing
            workflow.
          </p>
        </motion.div>

        {/* GitHub workflow */}
        <div className="relative mt-16">
          {/* Connector */}
          <div className="pointer-events-none absolute left-1/2 top-16 hidden h-[calc(100%-8rem)] w-px -translate-x-1/2 bg-gradient-to-b from-violet-400/30 via-white/[0.06] to-emerald-400/30 lg:block" />

          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.5fr_0.8fr] lg:items-center">
            {/* Left: developer */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
                  <User className="h-4 w-4 text-white/45" />
                </div>

                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/20">
                    developer
                  </div>

                  <div className="mt-1 text-sm font-medium text-white/75">
                    Push your changes
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-violet-300/70" />

                  <span className="font-mono text-[9px] text-white/35">
                    feature/payment-flow
                  </span>
                </div>

                <div className="mt-4 space-y-0">
                  <CommitRow
                    hash="8d2fa91"
                    message="refactor payment validation"
                    time="2m ago"
                  />

                  <CommitRow
                    hash="f31c8ab"
                    message="add checkout endpoint"
                    time="18m ago"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[10px] text-white/25">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/60" />
                Code pushed successfully
              </div>
            </motion.div>

            {/* Center: GitHub PR */}
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#09090b] shadow-[0_30px_100px_rgba(0,0,0,0.35)]"
            >
              <div className="absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-violet-500/[0.08] blur-[80px]" />

              {/* GitHub top bar */}
              <div className="relative flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-3">
                  <FaGithub className="h-4 w-4 text-white/65" />

                  <span className="text-xs font-medium text-white/60">
                    acme / checkout-api
                  </span>
                </div>

                <span className="rounded-md border border-emerald-400/15 bg-emerald-500/10 px-2 py-1 font-mono text-[8px] text-emerald-300/70">
                  Open
                </span>
              </div>

              {/* PR title */}
              <div className="relative border-b border-white/[0.06] px-5 py-6 sm:px-6">
                <div className="flex items-center gap-2 font-mono text-[9px] text-white/20">
                  <GitPullRequest className="h-3.5 w-3.5 text-emerald-300/60" />

                  #284
                </div>

                <h3 className="mt-3 text-lg font-medium tracking-tight text-white/85">
                  Refactor payment authorization
                </h3>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-violet-500/10 px-2 py-1 font-mono text-[8px] text-violet-300/70">
                    feature/payment-flow
                  </span>

                  <span className="text-white/10">→</span>

                  <span className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[8px] text-white/25">
                    main
                  </span>
                </div>
              </div>

              {/* Review status */}
              <div className="relative border-b border-white/[0.06] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10">
                      <Bot className="h-4 w-4 text-violet-300" />

                      <motion.div
                        animate={{
                          scale: [1, 1.35, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                        className="absolute inset-0 rounded-full border border-violet-400/40"
                      />
                    </div>

                    <div>
                      <div className="text-xs font-medium text-white/65">
                        ReviewAI
                      </div>

                      <div className="mt-1 font-mono text-[8px] text-white/20">
                        completed just now
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[8px] text-emerald-300/60">
                    <Check className="h-3 w-3" />
                    reviewed
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-red-400/10 bg-red-500/[0.035] p-3">
                    <div className="font-mono text-[8px] text-red-300/50">
                      critical
                    </div>

                    <div className="mt-1 text-lg font-medium text-red-200/80">
                      1
                    </div>
                  </div>

                  <div className="rounded-xl border border-orange-400/10 bg-orange-500/[0.035] p-3">
                    <div className="font-mono text-[8px] text-orange-300/50">
                      high
                    </div>

                    <div className="mt-1 text-lg font-medium text-orange-200/80">
                      2
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-400/10 bg-amber-500/[0.035] p-3">
                    <div className="font-mono text-[8px] text-amber-300/50">
                      medium
                    </div>

                    <div className="mt-1 text-lg font-medium text-amber-200/80">
                      4
                    </div>
                  </div>
                </div>
              </div>

              {/* PR comments */}
              <div className="relative space-y-2 p-5">
                <ReviewComment
                  severity="critical"
                  title="Authorization can be bypassed"
                  description="This endpoint retrieves the payment without verifying resource ownership."
                  line={45}
                />

                <ReviewComment
                  severity="high"
                  title="Validation allows unsafe values"
                  description="Quantity can be zero, negative, decimal, or NaN."
                  line={51}
                />
              </div>

              {/* Footer */}
              <div className="relative flex items-center justify-between border-t border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-white/20" />

                  <span className="font-mono text-[8px] text-white/20">
                    7 review comments
                  </span>
                </div>

                <span className="font-mono text-[8px] text-white/15">
                  ReviewAI Bot
                </span>
              </div>
            </motion.div>

            {/* Right: outcome */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                </div>

                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/20">
                    outcome
                  </div>

                  <div className="mt-1 text-sm font-medium text-white/75">
                    Fix before merge
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Security issue identified",
                  "Root cause explained",
                  "Fix direction provided",
                  "Developer notified",
                ].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.35 + index * 0.1,
                    }}
                    className="flex items-center gap-2.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300/60" />

                    <span className="text-[10px] leading-5 text-white/35">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-7 border-t border-white/[0.06] pt-5">
                <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/20">
                  review time
                </div>

                <div className="mt-2 text-2xl font-medium tracking-tight text-white">
                  42 sec
                </div>

                <div className="mt-1 text-[10px] text-white/25">
                  before a human reviewer opened the PR
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Integration features */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mt-8 grid gap-3 sm:grid-cols-3"
        >
          {[
            {
              icon: GitPullRequest,
              title: "Automatic reviews",
              description:
                "Trigger analysis automatically whenever a pull request changes.",
            },
            {
              icon: MessageSquare,
              title: "Inline comments",
              description:
                "Findings appear next to the exact code that caused the issue.",
            },
            {
              icon: Sparkles,
              title: "Context-aware",
              description:
                "Every comment is backed by repository and execution context.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5"
              >
                <Icon className="h-4 w-4 text-violet-300/60" />

                <h3 className="mt-4 text-sm font-medium text-white/70">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-white/30">
                  {item.description}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-white/[0.06] pt-8 sm:flex-row"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/15 bg-violet-500/[0.06]">
              <FaGithub className="h-3.5 w-3.5 text-violet-300" />
            </div>

            <p className="text-xs text-white/35">
              No new workflow to learn. Just open a pull request.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
            connect github

            <ArrowRight className="h-3 w-3" />

            open pr

            <ArrowRight className="h-3 w-3" />

            get reviewed
          </div>
        </motion.div>
      </div>
    </section>
  );
}
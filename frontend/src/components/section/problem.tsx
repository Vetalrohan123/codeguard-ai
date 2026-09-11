"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  FileCode2,
  GitBranch,
  GitPullRequest,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const traditionalSteps = [
  {
    icon: GitPullRequest,
    label: "Pull request",
  },
  {
    icon: FileCode2,
    label: "Changed lines",
  },
  {
    icon: BrainCircuit,
    label: "AI reads diff",
  },
  {
    icon: AlertTriangle,
    label: "Generic comments",
  },
];

const contextSteps = [
  {
    icon: GitPullRequest,
    label: "Pull request",
    detail: "12 changed files",
  },
  {
    icon: FileCode2,
    label: "Repository context",
    detail: "184 related files",
  },
  {
    icon: GitBranch,
    label: "Dependencies",
    detail: "18 dependencies",
  },
  {
    icon: Network,
    label: "Call graph",
    detail: "4 execution paths",
  },
  {
    icon: ScanSearch,
    label: "Project conventions",
    detail: "Detected automatically",
  },
  {
    icon: BrainCircuit,
    label: "AI reasoning",
    detail: "Context-aware analysis",
  },
];

const problems = [
  "Missed regressions outside the changed lines",
  "False positives caused by missing context",
  "Security issues hidden in related code",
  "Recommendations that conflict with project architecture",
];

export function Problem() {
  return (
    <section
      id="product"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] py-24 sm:py-32 lg:py-40"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-violet-500/[0.045] blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <span className="size-1.5 rounded-full bg-violet-400" />
            Context changes everything
          </div>

          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
            Most AI code reviewers
            <br />
            <span className="text-zinc-500">only see the diff.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
            A changed line rarely tells the whole story. ReviewAI traces the
            code around your pull request to understand dependencies, call
            paths, architecture, and the conventions already established in
            your repository.
          </p>
        </motion.div>

        {/* Traditional review */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="mt-16"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                Traditional AI review
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                The context gap
              </p>
            </div>

            <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-rose-400/70 sm:flex">
              <AlertTriangle className="size-3.5" />
              Limited context
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#090a0d]">
            <div className="grid divide-y divide-white/[0.06] md:grid-cols-4 md:divide-x md:divide-y-0">
              {traditionalSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div key={step.label} className="relative">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: 0.15 + index * 0.08,
                      }}
                      className="flex min-h-[116px] items-center gap-4 px-5 py-5 md:block md:px-6 md:py-7"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-zinc-600">
                        <Icon className="size-4" />
                      </div>

                      <div className="mt-0 md:mt-5">
                        <p className="text-sm font-medium text-zinc-400">
                          {step.label}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-zinc-700">
                          01 / 04
                        </p>
                      </div>
                    </motion.div>

                    {index < traditionalSteps.length - 1 ? (
                      <ArrowRight className="absolute right-[-7px] top-1/2 z-10 hidden size-3.5 -translate-y-1/2 text-zinc-700 md:block" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/[0.06] bg-rose-500/[0.025] px-5 py-4 sm:px-6">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {problems.map((problem) => (
                  <div
                    key={problem}
                    className="flex items-center gap-2 text-xs text-zinc-600"
                  >
                    <span className="size-1 rounded-full bg-rose-400/60" />
                    {problem}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Context-aware review */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative mt-8"
        >
          <div className="absolute -inset-4 rounded-[28px] bg-violet-500/[0.035] blur-2xl" />

          <div className="relative overflow-hidden rounded-2xl border border-violet-400/[0.16] bg-[#0a0b0f] shadow-2xl shadow-black/30">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-violet-400/10 text-violet-300">
                    <Sparkles className="size-3.5" />
                  </span>

                  <p className="text-sm font-medium text-white">
                    Context-aware review
                  </p>
                </div>

                <p className="mt-1 pl-8 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                  Repository intelligence pipeline
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full border border-emerald-400/10 bg-emerald-400/[0.04] px-2.5 py-1.5 sm:self-auto">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/80">
                  High confidence
                </span>
              </div>
            </div>

            {/* Pipeline */}
            <div className="overflow-x-auto">
              <div className="flex min-w-[850px] items-stretch px-5 py-6 sm:px-7 sm:py-8">
                {contextSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === contextSteps.length - 1;

                  return (
                    <div
                      key={step.label}
                      className="flex min-w-[132px] flex-1 items-center"
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.45,
                          delay: 0.2 + index * 0.09,
                        }}
                        className="group w-full"
                      >
                        <div className="flex items-center">
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                              isLast
                                ? "border-violet-400/25 bg-violet-400/[0.09] text-violet-300"
                                : "border-white/[0.08] bg-white/[0.025] text-zinc-500"
                            } transition-colors duration-300 group-hover:border-violet-400/20 group-hover:text-violet-300`}
                          >
                            <Icon className="size-4" />
                          </div>

                          {!isLast ? (
                            <div className="relative mx-2 h-px flex-1 bg-white/[0.08]">
                              <motion.div
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{
                                  duration: 0.55,
                                  delay: 0.4 + index * 0.09,
                                }}
                                className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-violet-400/40 to-cyan-400/20"
                              />
                            </div>
                          ) : null}
                        </div>

                        <p className="mt-3 text-xs font-medium text-zinc-300">
                          {step.label}
                        </p>

                        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                          {step.detail}
                        </p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom context stats */}
            <div className="grid border-t border-white/[0.07] sm:grid-cols-3 sm:divide-x sm:divide-white/[0.07]">
              <ContextStat
                label="Files analyzed"
                value="196"
                detail="Changed + related"
              />
              <ContextStat
                label="Execution paths"
                value="4"
                detail="Call graph traced"
              />
              <ContextStat
                label="Confidence"
                value="94%"
                detail="Context-supported"
                accent
              />
            </div>
          </div>
        </motion.div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-16 max-w-2xl text-center"
        >
          <div className="mx-auto mb-5 flex size-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300">
            <ShieldCheck className="size-5" />
          </div>

          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Better context.
            <span className="text-zinc-500"> Better reviews.</span>
          </h3>

          <p className="mt-3 text-sm leading-6 text-zinc-600">
            ReviewAI follows the relationships your code actually has instead
            of treating every changed line as an isolated problem.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-700">
            <Check className="size-3 text-emerald-400/70" />
            Repository-aware analysis
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ContextStat({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 sm:block sm:px-6 sm:py-5">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
          {label}
        </p>

        <p
          className={`mt-1.5 text-lg font-semibold tracking-tight ${
            accent ? "text-emerald-300" : "text-zinc-200"
          }`}
        >
          {value}
        </p>
      </div>

      <p className="font-mono text-[9px] text-zinc-700 sm:mt-1">
        {detail}
      </p>
    </div>
  );
}
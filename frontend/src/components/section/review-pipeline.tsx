"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileCode2,
  GitPullRequest,
  Network,
  Route,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PipelineStep = {
  id: number;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  accent: "violet" | "cyan" | "emerald" | "amber";
  stats: {
    label: string;
    value: string;
  }[];
};

const steps: PipelineStep[] = [
  {
    id: 1,
    number: "01",
    title: "Pull Request Opened",
    shortTitle: "PR Context",
    description:
      "ReviewAI starts with the entire pull request, not just the lines that changed.",
    detail:
      "The reviewer identifies changed files, commits, authors, branches, and the intent behind the pull request before analysis begins.",
    icon: GitPullRequest,
    accent: "violet",
    stats: [
      { label: "Files", value: "24" },
      { label: "Changes", value: "+418 / −127" },
    ],
  },
  {
    id: 2,
    number: "02",
    title: "Repository Context",
    shortTitle: "Full Context",
    description:
      "Relevant files, functions, types, and configuration are pulled into the analysis context.",
    detail:
      "Instead of treating a changed line as an isolated snippet, ReviewAI traces the surrounding implementation and related modules.",
    icon: FileCode2,
    accent: "cyan",
    stats: [
      { label: "Files indexed", value: "1,842" },
      { label: "Symbols", value: "12.4K" },
    ],
  },
  {
    id: 3,
    number: "03",
    title: "Dependency Graph",
    shortTitle: "Relationships",
    description:
      "The system maps how functions, modules, APIs, and data models connect.",
    detail:
      "A dependency graph reveals relationships that ordinary diff-based reviewers cannot see, including callers, consumers, imports, and shared services.",
    icon: Network,
    accent: "emerald",
    stats: [
      { label: "Dependencies", value: "8,291" },
      { label: "Graph depth", value: "7 levels" },
    ],
  },
  {
    id: 4,
    number: "04",
    title: "Execution Tracing",
    shortTitle: "Trace Flow",
    description:
      "Potential execution paths are followed to understand what can actually happen at runtime.",
    detail:
      "ReviewAI follows control flow through validation, authentication, database access, external services, and error handling.",
    icon: Route,
    accent: "amber",
    stats: [
      { label: "Paths traced", value: "143" },
      { label: "Branches", value: "892" },
    ],
  },
  {
    id: 5,
    number: "05",
    title: "AI Reasoning",
    shortTitle: "Reason",
    description:
      "The AI combines repository context, static analysis, and execution paths to reason about risk.",
    detail:
      "Multiple signals are combined before a finding is produced. This helps reduce noisy comments and surface issues that require actual contextual understanding.",
    icon: BrainCircuit,
    accent: "violet",
    stats: [
      { label: "Signals", value: "37" },
      { label: "Confidence", value: "96.8%" },
    ],
  },
  {
    id: 6,
    number: "06",
    title: "Prioritized Findings",
    shortTitle: "Final Review",
    description:
      "Only actionable findings make it to your pull request, ranked by severity and confidence.",
    detail:
      "Every finding includes the affected code, reasoning, severity, confidence, and a practical recommendation for fixing the underlying problem.",
    icon: ShieldCheck,
    accent: "emerald",
    stats: [
      { label: "Findings", value: "7" },
      { label: "Critical", value: "1" },
    ],
  },
];

const accentClasses = {
  violet: {
    icon: "text-violet-300 bg-violet-500/10 border-violet-400/20",
    glow: "bg-violet-500/20",
    line: "bg-violet-400",
    text: "text-violet-300",
  },
  cyan: {
    icon: "text-cyan-300 bg-cyan-500/10 border-cyan-400/20",
    glow: "bg-cyan-500/20",
    line: "bg-cyan-400",
    text: "text-cyan-300",
  },
  emerald: {
    icon: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20",
    glow: "bg-emerald-500/20",
    line: "bg-emerald-400",
    text: "text-emerald-300",
  },
  amber: {
    icon: "text-amber-300 bg-amber-500/10 border-amber-400/20",
    glow: "bg-amber-500/20",
    line: "bg-amber-400",
    text: "text-amber-300",
  },
};

function PipelineIcon({
  step,
  active,
}: {
  step: PipelineStep;
  active: boolean;
}) {
  const Icon = step.icon;
  const styles = accentClasses[step.accent];

  return (
    <div className="relative">
      {active && (
        <motion.div
          layoutId="pipeline-glow"
          className={`absolute inset-0 rounded-2xl blur-xl ${styles.glow}`}
          transition={{ duration: 0.3 }}
        />
      )}

      <motion.div
        animate={{
          scale: active ? 1.05 : 1,
          borderColor: active
            ? "rgba(167,139,250,0.35)"
            : "rgba(255,255,255,0.06)",
        }}
        transition={{ duration: 0.25 }}
        className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border ${styles.icon}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </motion.div>
    </div>
  );
}

function MiniGraph() {
  return (
    <div className="relative h-32 overflow-hidden rounded-xl border border-white/[0.06] bg-black/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:24px_24px]" />

      <svg
        viewBox="0 0 500 128"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <motion.path
          d="M35 72 C100 72, 100 35, 165 35 S230 92, 290 92 S355 48, 415 48 S455 72, 475 72"
          stroke="url(#pipelineGradient)"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />

        <defs>
          <linearGradient id="pipelineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {[
          [35, 72],
          [165, 35],
          [290, 92],
          [415, 48],
          [475, 72],
        ].map(([cx, cy], index) => (
          <motion.g
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.15 + index * 0.12,
              duration: 0.3,
            }}
          >
            <circle
              cx={cx}
              cy={cy}
              r="6"
              fill="#09090b"
              stroke="rgba(167,139,250,0.8)"
              strokeWidth="1.5"
            />
            <circle
              cx={cx}
              cy={cy}
              r="2"
              fill="rgba(196,181,253,0.9)"
            />
          </motion.g>
        ))}
      </svg>

      <div className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
        execution graph
      </div>
    </div>
  );
}

function ReasoningPanel({ step }: { step: PipelineStep }) {
  const styles = accentClasses[step.accent];

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]"
    >
      <div
        className={`absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="relative p-6 sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.2em] ${styles.text}`}
              >
                analysis stage {step.number}
              </span>

              <span className="h-px w-8 bg-white/10" />

              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
                active
              </span>
            </div>

            <h3 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
              {step.title}
            </h3>
          </div>

          <div
            className={`hidden h-10 w-10 items-center justify-center rounded-xl border sm:flex ${styles.icon}`}
          >
            <step.icon className="h-4 w-4" />
          </div>
        </div>

        <p className="max-w-2xl text-sm leading-7 text-white/50">
          {step.detail}
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          {step.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
                {stat.label}
              </div>

              <div className="mt-2 text-lg font-medium tracking-tight text-white">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {step.id === 3 && (
          <div className="mt-5">
            <MiniGraph />
          </div>
        )}

        {step.id === 5 && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-violet-400/10 bg-violet-500/[0.04] p-4">
            <Sparkles className="h-4 w-4 shrink-0 text-violet-300" />

            <p className="text-xs leading-5 text-white/45">
              Multiple evidence sources are evaluated before ReviewAI decides
              whether a finding is worth showing.
            </p>
          </div>
        )}

        {step.id === 6 && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-500/[0.04] p-4">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />

            <p className="text-xs leading-5 text-white/45">
              Findings are optimized for signal — not comment volume.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ReviewPipeline() {
  const [activeStep, setActiveStep] = useState(1);

  const active = steps.find((step) => step.id === activeStep) ?? steps[0];

  return (
    <section className="relative overflow-hidden bg-[#050506] py-24 sm:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.06] blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
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
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.05] px-3 py-1.5">
            <ScanSearch className="h-3.5 w-3.5 text-violet-300" />

            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-200/70">
              beyond the diff
            </span>
          </div>

          <h2 className="text-3xl font-medium tracking-[-0.03em] text-white sm:text-5xl">
            How ReviewAI
            <span className="text-white/35"> thinks</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
            A pull request is more than a collection of changed lines.
            ReviewAI reconstructs the context behind your code before deciding
            what deserves your attention.
          </p>
        </motion.div>

        {/* Pipeline */}
        <div className="mt-16">
          <div className="relative">
            {/* Desktop connecting line */}
            <div className="absolute left-[8%] right-[8%] top-7 hidden h-px bg-white/[0.07] lg:block" />

            <motion.div
              className="absolute left-[8%] top-7 hidden h-px bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 lg:block"
              animate={{
                width: `${((activeStep - 1) / (steps.length - 1)) * 84}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:gap-0">
              {steps.map((step, index) => {
                const isActive = step.id === activeStep;
                const isComplete = step.id < activeStep;

                const styles = accentClasses[step.accent];

                return (
                  <motion.button
                    key={step.id}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.08,
                    }}
                    onClick={() => setActiveStep(step.id)}
                    className="group relative flex flex-col items-center text-center outline-none"
                  >
                    <div className="relative z-10">
                      <PipelineIcon step={step} active={isActive} />

                      {isComplete && (
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#050506] bg-emerald-400">
                          <CheckCircle2 className="h-3 w-3 text-black" />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 px-2">
                      <div
                        className={`font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                          isActive ? styles.text : "text-white/20"
                        }`}
                      >
                        {step.number}
                      </div>

                      <div
                        className={`mt-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-white/40 group-hover:text-white/70"
                        }`}
                      >
                        {step.shortTitle}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active step detail */}
        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          <motion.div
            key={`intro-${active.id}`}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col justify-between rounded-3xl border border-white/[0.07] bg-white/[0.02] p-6 sm:p-8"
          >
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                    accentClasses[active.accent].icon
                  }`}
                >
                  <active.icon className="h-4.5 w-4.5" />
                </div>

                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
                    stage {active.number}
                  </div>

                  <div className="mt-1 text-sm font-medium text-white">
                    {active.shortTitle}
                  </div>
                </div>
              </div>

              <h3 className="max-w-md text-2xl font-medium tracking-tight text-white sm:text-3xl">
                {active.title}
              </h3>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/45">
                {active.description}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
              <Terminal className="h-3.5 w-3.5" />

              context-aware analysis
            </div>
          </motion.div>

          <ReasoningPanel step={active} />
        </div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-white/[0.06] pt-8 sm:flex-row"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/15 bg-violet-500/[0.06]">
              <BrainCircuit className="h-3.5 w-3.5 text-violet-300" />
            </div>

            <p className="text-xs text-white/35">
              From changed lines to actual software behavior.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
            <span>context</span>
            <ArrowRight className="h-3 w-3" />
            <span>reasoning</span>
            <ArrowRight className="h-3 w-3" />
            <span className="text-white/50">confidence</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
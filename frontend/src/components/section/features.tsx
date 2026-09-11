"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  Bug,
  Check,
  Code2,
  LockKeyhole,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { useState } from "react";

type Feature = {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: typeof Code2;
  accent: string;
  tags: string[];
};

const features: Feature[] = [
  {
    id: "context",
    number: "01",
    title: "Full Repository Context",
    description:
      "Understand every review in the context of related files, dependencies, call paths, project conventions, and previous changes.",
    icon: Network,
    accent: "violet",
    tags: ["Call graph", "Dependencies", "History"],
  },
  {
    id: "bugs",
    number: "02",
    title: "Bug Detection",
    description:
      "Find logic errors, edge cases, race conditions, null handling issues, and regressions before they reach production.",
    icon: Bug,
    accent: "rose",
    tags: ["Logic", "Regression", "Edge cases"],
  },
  {
    id: "security",
    number: "03",
    title: "Security Analysis",
    description:
      "Identify suspicious authorization paths, unsafe input handling, injection risks, secrets exposure, and security-sensitive changes.",
    icon: LockKeyhole,
    accent: "amber",
    tags: ["Auth", "Input", "Secrets"],
  },
  {
    id: "architecture",
    number: "04",
    title: "Architectural Awareness",
    description:
      "Review changes against the architecture already established in your codebase instead of suggesting isolated rewrites.",
    icon: BrainCircuit,
    accent: "cyan",
    tags: ["Patterns", "Layers", "Coupling"],
  },
  {
    id: "fixes",
    number: "05",
    title: "AI Fix Suggestions",
    description:
      "Get actionable fixes with reasoning and repository-aware suggestions instead of vague comments.",
    icon: Sparkles,
    accent: "emerald",
    tags: ["Suggested fix", "Reasoning", "Patch"],
  },
  {
    id: "learning",
    number: "06",
    title: "Continuous Learning",
    description:
      "Adapt reviews around your team's existing conventions, review patterns, and evolving codebase.",
    icon: Activity,
    accent: "blue",
    tags: ["Conventions", "Patterns", "Evolution"],
  },
];

const accentClasses = {
  violet: {
    icon: "text-violet-300",
    iconBg: "bg-violet-400/[0.08]",
    border: "border-violet-400/[0.18]",
    glow: "bg-violet-500/[0.06]",
    line: "bg-violet-400",
  },
  rose: {
    icon: "text-rose-300",
    iconBg: "bg-rose-400/[0.08]",
    border: "border-rose-400/[0.16]",
    glow: "bg-rose-500/[0.05]",
    line: "bg-rose-400",
  },
  amber: {
    icon: "text-amber-300",
    iconBg: "bg-amber-400/[0.08]",
    border: "border-amber-400/[0.16]",
    glow: "bg-amber-500/[0.05]",
    line: "bg-amber-400",
  },
  cyan: {
    icon: "text-cyan-300",
    iconBg: "bg-cyan-400/[0.08]",
    border: "border-cyan-400/[0.16]",
    glow: "bg-cyan-500/[0.05]",
    line: "bg-cyan-400",
  },
  emerald: {
    icon: "text-emerald-300",
    iconBg: "bg-emerald-400/[0.08]",
    border: "border-emerald-400/[0.16]",
    glow: "bg-emerald-500/[0.05]",
    line: "bg-emerald-400",
  },
  blue: {
    icon: "text-blue-300",
    iconBg: "bg-blue-400/[0.08]",
    border: "border-blue-400/[0.16]",
    glow: "bg-blue-500/[0.05]",
    line: "bg-blue-400",
  },
} as const;

export function Features() {
  const [activeFeature, setActiveFeature] =
    useState("context");

  const active =
    features.find(
      (feature) => feature.id === activeFeature,
    ) ?? features[0];

  return (
    <section
      id="features"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] py-24 sm:py-32 lg:py-40"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-[-300px] top-[300px] h-[500px] w-[500px] rounded-full bg-violet-500/[0.035] blur-[150px]" />

        <div className="absolute right-[-250px] bottom-[100px] h-[450px] w-[450px] rounded-full bg-cyan-400/[0.025] blur-[150px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 22,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.3,
          }}
          transition={{
            duration: 0.6,
          }}
          className="max-w-3xl"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/80">
              02 / Intelligence
            </span>

            <span className="h-px w-10 bg-white/[0.08]" />

            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-700">
              Built for real codebases
            </span>
          </div>

          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
            More than code review.
            <br />

            <span className="text-zinc-500">
              Repository-level intelligence.
            </span>
          </h2>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
            ReviewAI combines static analysis, repository
            context, dependency relationships, and AI
            reasoning to understand why a change matters
            before it tells you what to change.
          </p>
        </motion.div>

        {/* Main feature workspace */}
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
            amount: 0.12,
          }}
          transition={{
            duration: 0.7,
            delay: 0.1,
          }}
          className="mt-14 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090a0d] shadow-2xl shadow-black/30"
        >
          {/* Workspace header */}
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-zinc-400">
                <Terminal className="size-3.5" />
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  reviewai / intelligence
                </p>

                <p className="mt-0.5 text-xs text-zinc-700">
                  Analysis capabilities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />

              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/70">
                Analysis engine online
              </span>
            </div>
          </div>

          {/* Workspace */}
          <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Feature navigation */}
            <div className="border-b border-white/[0.07] p-2 lg:border-b-0 lg:border-r">
              <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  const isActive =
                    feature.id === activeFeature;

                  const styles =
                    accentClasses[
                      feature.accent as keyof typeof accentClasses
                    ];

                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() =>
                        setActiveFeature(feature.id)
                      }
                      className={`group relative flex min-h-[74px] items-center gap-3 rounded-xl px-3 text-left transition-colors motion-reduce:transition-none ${
                        isActive
                          ? "bg-white/[0.045]"
                          : "hover:bg-white/[0.025]"
                      }`}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="active-feature-indicator"
                          className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${styles.line}`}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      ) : null}

                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${
                          isActive
                            ? `${styles.iconBg} ${styles.border}`
                            : "border-white/[0.06] bg-white/[0.02]"
                        }`}
                      >
                        <Icon
                          className={`size-3.5 ${
                            isActive
                              ? styles.icon
                              : "text-zinc-600"
                          }`}
                        />
                      </span>

                      <span className="min-w-0">
                        <span
                          className={`block truncate text-xs font-medium ${
                            isActive
                              ? "text-zinc-200"
                              : "text-zinc-600"
                          }`}
                        >
                          {feature.title}
                        </span>

                        <span className="mt-1 block font-mono text-[8px] uppercase tracking-wider text-zinc-700">
                          {feature.number}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active feature */}
            <div className="relative min-h-[430px] overflow-hidden">
              <AnimateFeature feature={active} />
            </div>
          </div>
        </motion.div>

        {/* Capability strip */}
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
            amount: 0.3,
          }}
          transition={{
            duration: 0.6,
            delay: 0.15,
          }}
          className="mt-4 grid gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-3"
        >
          <Capability
            icon={ScanSearch}
            label="Static analysis"
            detail="AST + pattern detection"
          />

          <Capability
            icon={Network}
            label="Code intelligence"
            detail="Dependencies + call graph"
          />

          <Capability
            icon={Zap}
            label="AI reasoning"
            detail="Context-aware explanations"
          />
        </motion.div>

        {/* Bottom statement */}
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
            amount: 0.4,
          }}
          transition={{
            duration: 0.6,
          }}
          className="mt-16 text-center"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-700">
            One reviewer · six layers of intelligence
          </p>

          <div className="mx-auto mt-5 flex max-w-md items-center justify-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.08]" />

            <div className="flex size-8 items-center justify-center rounded-lg border border-violet-400/[0.15] bg-violet-400/[0.04] text-violet-300">
              <ShieldCheck className="size-3.5" />
            </div>

            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.08]" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AnimateFeature({
  feature,
}: {
  feature: Feature;
}) {
  const styles =
    accentClasses[
      feature.accent as keyof typeof accentClasses
    ];

  const Icon = feature.icon;

  return (
    <motion.div
      key={feature.id}
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
      }}
      className="relative h-full p-6 sm:p-8 lg:p-10"
    >
      <div
        aria-hidden="true"
        className={`absolute right-[-100px] top-[-100px] size-[320px] rounded-full ${styles.glow} blur-[100px]`}
      />

      {/* Feature heading */}
      <div className="relative flex items-start justify-between gap-5">
        <div>
          <div
            className={`mb-5 flex size-11 items-center justify-center rounded-xl border ${styles.border} ${styles.iconBg}`}
          >
            <Icon
              className={`size-5 ${styles.icon}`}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-700">
              Capability {feature.number}
            </span>

            <ArrowUpRight className="size-3 text-zinc-700" />
          </div>

          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
            {feature.title}
          </h3>

          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-500">
            {feature.description}
          </p>
        </div>
      </div>

      {/* Context visualization */}
      <div className="relative mt-8 overflow-hidden rounded-xl border border-white/[0.07] bg-[#06070a]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Code2 className="size-3 text-zinc-600" />

            <span className="font-mono text-[9px] text-zinc-600">
              analysis.context
            </span>
          </div>

          <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-700">
            live
          </span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {feature.tags.map((tag, index) => (
            <motion.div
              key={tag}
              initial={{
                opacity: 0,
                y: 5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.3,
                delay: 0.08 + index * 0.06,
              }}
              className="rounded-lg border border-white/[0.06] bg-white/[0.018] p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`size-1.5 rounded-full ${styles.line} opacity-70`}
                />

                <span className="font-mono text-[9px] text-zinc-500">
                  {tag}
                </span>
              </div>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${68 + index * 12}%`,
                  }}
                  transition={{
                    duration: 0.65,
                    delay: 0.15 + index * 0.08,
                  }}
                  className={`h-full rounded-full ${styles.line} opacity-40`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Terminal-style output */}
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-[9px]">
            <span className="text-emerald-400/70">
              ✓
            </span>

            <span className="text-zinc-700">
              context analysis completed
            </span>

            <span className="ml-auto text-zinc-800">
              94ms
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Capability({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof Code2;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#090a0d] px-4 py-4 sm:px-5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-600">
        <Icon className="size-3.5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-400">
          {label}
        </p>

        <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-wider text-zinc-700">
          {detail}
        </p>
      </div>

      <Check className="ml-auto size-3 text-emerald-400/50" />
    </div>
  );
}

export default Features;
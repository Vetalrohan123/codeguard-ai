"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  BrainCircuit,
  Check,
  CircleDot,
  FileCode2,
  GitBranch,
  GitPullRequest,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import type { IconType } from "react-icons";

type WorkflowIcon = LucideIcon | IconType;

type WorkflowStepData = {
  number: string;
  title: string;
  description: string;
  icon: WorkflowIcon;
  status: string;
  meta: string;
};

const steps: WorkflowStepData[] = [
  {
    number: "01",
    title: "Connect GitHub",
    description:
      "Connect your repository and give ReviewAI the access it needs to understand your project structure.",
    icon: FaGithub,
    status: "CONNECTED",
    meta: "Repository access",
  },
  {
    number: "02",
    title: "Open a PR",
    description:
      "Open your pull request normally. ReviewAI automatically detects the changes and starts building context.",
    icon: GitPullRequest,
    status: "DETECTED",
    meta: "Pull request #482",
  },
  {
    number: "03",
    title: "AI understands context",
    description:
      "The engine follows dependencies, related files, call chains, conventions, and security-sensitive paths.",
    icon: BrainCircuit,
    status: "ANALYZING",
    meta: "196 files · 4 paths",
  },
  {
    number: "04",
    title: "Ship with confidence",
    description:
      "Get prioritized findings, explanations, and repository-aware fix suggestions directly in your review workflow.",
    icon: ShieldCheck,
    status: "READY",
    meta: "Review complete",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] py-24 sm:py-32 lg:py-40"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[180px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-500/[0.035] blur-[150px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/80">
              03 / Workflow
            </span>

            <span className="h-px w-10 bg-white/[0.08]" />

            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-700">
              From PR to confidence
            </span>
          </div>

          <h2 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
            Your workflow stays the same.
            <br />
            <span className="text-zinc-500">
              The review gets smarter.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
            Connect your repository once. ReviewAI works alongside your
            existing pull-request workflow and handles the context gathering
            automatically.
          </p>
        </motion.div>

        {/* Pipeline */}
        <div className="relative mt-16">
          {/* Desktop connecting line */}
          <div
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-[39px] hidden h-px bg-white/[0.08] lg:block"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 1.2,
                delay: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="h-full origin-left bg-gradient-to-r from-violet-400/40 via-cyan-400/30 to-emerald-400/40"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-4 lg:gap-4">
            {steps.map((step, index) => (
              <WorkflowStep
                key={step.number}
                step={step}
                index={index}
                last={index === steps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Repository analysis terminal */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative mt-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090a0d] shadow-2xl shadow-black/30"
        >
          <div className="absolute right-[-100px] top-[-150px] size-[400px] rounded-full bg-violet-500/[0.035] blur-[120px]" />

          {/* Terminal header */}
          <div className="relative flex flex-col gap-3 border-b border-white/[0.07] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="size-2 rounded-full bg-zinc-700" />
                <span className="size-2 rounded-full bg-zinc-700" />
                <span className="size-2 rounded-full bg-zinc-700" />
              </div>

              <span className="font-mono text-[9px] text-zinc-600">
                reviewai / analysis
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CircleDot className="size-3 text-violet-400/70" />

              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                context pipeline
              </span>
            </div>
          </div>

          {/* Terminal body */}
          <div className="relative grid lg:grid-cols-[1fr_280px]">
            {/* Terminal output */}
            <div className="p-5 sm:p-7">
              <div className="space-y-4 font-mono text-[10px] sm:text-xs">
                <TerminalLine
                  delay={0.1}
                  color="text-violet-300"
                  prefix="$"
                  text="reviewai analyze --pr 482"
                />

                <TerminalLine
                  delay={0.25}
                  color="text-zinc-500"
                  prefix="→"
                  text="Loading repository context..."
                />

                <TerminalLine
                  delay={0.4}
                  color="text-zinc-500"
                  prefix="→"
                  text="Mapping 184 related files..."
                />

                <TerminalLine
                  delay={0.55}
                  color="text-zinc-500"
                  prefix="→"
                  text="Tracing 4 execution paths..."
                />

                <TerminalLine
                  delay={0.7}
                  color="text-zinc-500"
                  prefix="→"
                  text="Checking project conventions..."
                />

                <TerminalLine
                  delay={0.85}
                  color="text-zinc-500"
                  prefix="→"
                  text="Running security analysis..."
                />

                <TerminalLine
                  delay={1}
                  color="text-emerald-400"
                  prefix="✓"
                  text="Context analysis complete"
                />
              </div>
            </div>

            {/* Analysis summary */}
            <div className="border-t border-white/[0.07] p-5 sm:p-7 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-violet-300" />

                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                  Analysis summary
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <SummaryRow
                  icon={FileCode2}
                  label="Files"
                  value="196"
                />

                <SummaryRow
                  icon={Network}
                  label="Call paths"
                  value="4"
                />

                <SummaryRow
                  icon={GitBranch}
                  label="Dependencies"
                  value="18"
                />

                <SummaryRow
                  icon={ScanSearch}
                  label="Findings"
                  value="3"
                />
              </div>

              <div className="mt-5 rounded-lg border border-emerald-400/[0.1] bg-emerald-400/[0.025] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-400/70" />

                  <span className="font-mono text-[9px] text-emerald-400/70">
                    Review ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-14 max-w-xl text-center"
        >
          <p className="text-sm leading-7 text-zinc-600">
            No new workflow to learn. No separate dashboard to constantly
            monitor. Just open a PR and let the context-aware reviewer do the
            investigation.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-700">
            <span className="size-1.5 rounded-full bg-emerald-400/70" />
            Works where your code already lives
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function WorkflowStep({
  step,
  index,
  last,
}: {
  step: WorkflowStepData;
  index: number;
  last: boolean;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.5,
        delay: 0.15 + index * 0.1,
      }}
      className="relative"
    >
      <div className="flex flex-col items-center lg:items-stretch">
        {/* Number / node */}
        <div className="relative z-10 mx-auto flex size-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#090a0d] shadow-xl shadow-black/20 lg:mx-0">
          <div className="flex size-11 items-center justify-center rounded-xl border border-violet-400/[0.12] bg-violet-400/[0.045] text-violet-300">
            <Icon className="size-5" />
          </div>

          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-[#090a0d] bg-zinc-800 font-mono text-[8px] text-zinc-400">
            {step.number}
          </span>
        </div>

        {/* Mobile connector */}
        {!last ? (
          <div className="my-3 flex justify-center lg:hidden">
            <ArrowDown className="size-4 text-zinc-700" />
          </div>
        ) : null}

        {/* Content */}
        <div className="mt-5 text-center lg:text-left">
          <div className="flex items-center justify-center gap-2 lg:justify-start">
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-emerald-400/60">
              {step.status}
            </span>

            <span className="size-1 rounded-full bg-zinc-800" />

            <span className="font-mono text-[8px] text-zinc-700">
              {step.meta}
            </span>
          </div>

          <h3 className="mt-2 text-base font-semibold tracking-tight text-white">
            {step.title}
          </h3>

          <p className="mx-auto mt-2 max-w-[240px] text-xs leading-6 text-zinc-600 lg:mx-0">
            {step.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function TerminalLine({
  prefix,
  text,
  color,
  delay,
}: {
  prefix: string;
  text: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.35,
        delay,
      }}
      className="flex gap-3"
    >
      <span className="w-3 shrink-0 text-zinc-700">
        {prefix}
      </span>

      <span className={color}>{text}</span>
    </motion.div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.018] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className="size-3 text-zinc-600" />

        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
          {label}
        </span>
      </div>

      <span className="font-mono text-[10px] text-zinc-300">
        {value}
      </span>
    </div>
  );
}


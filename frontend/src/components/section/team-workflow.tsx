"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const workflowSteps = [
  {
    number: "01",
    title: "Developer opens a PR",
    description:
      "Push code normally. ReviewAI starts analyzing the pull request automatically.",
    icon: GitPullRequest,
    accent: "violet",
  },
  {
    number: "02",
    title: "ReviewAI investigates",
    description:
      "The reviewer traces changed code through related files, dependencies, and execution paths.",
    icon: Bot,
    accent: "cyan",
  },
  {
    number: "03",
    title: "Team gets prioritized feedback",
    description:
      "Only actionable findings are surfaced with severity, context, explanation, and suggested fixes.",
    icon: MessageSquare,
    accent: "emerald",
  },
  {
    number: "04",
    title: "Fix and merge",
    description:
      "Engineers resolve the important issues and move the pull request toward approval.",
    icon: CheckCircle2,
    accent: "fuchsia",
  },
];

const comments = [
  {
    severity: "CRITICAL",
    title: "Authorization can be bypassed",
    line: "payment.service.ts:45",
    text: "The ownership check happens after the payment record is loaded.",
    accent: "red",
  },
  {
    severity: "HIGH",
    title: "Validation allows unsafe values",
    line: "payment.service.ts:51",
    text: "A negative amount can reach the payment provider.",
    accent: "orange",
  },
];

function WorkflowStep({
  step,
  index,
}: {
  step: (typeof workflowSteps)[number];
  index: number;
}) {
  const Icon = step.icon;

  const accentStyles = {
    violet: {
      border: "border-violet-400/15",
      icon: "bg-violet-500/10 text-violet-300",
      number: "text-violet-300/60",
    },
    cyan: {
      border: "border-cyan-400/15",
      icon: "bg-cyan-500/10 text-cyan-300",
      number: "text-cyan-300/60",
    },
    emerald: {
      border: "border-emerald-400/15",
      icon: "bg-emerald-500/10 text-emerald-300",
      number: "text-emerald-300/60",
    },
    fuchsia: {
      border: "border-fuchsia-400/15",
      icon: "bg-fuchsia-500/10 text-fuchsia-300",
      number: "text-fuchsia-300/60",
    },
  } as const;

  const style =
    accentStyles[step.accent as keyof typeof accentStyles];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
      }}
      className={`relative rounded-2xl border ${style.border} bg-white/[0.02] p-5`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <span
          className={`font-mono text-[10px] tracking-[0.18em] ${style.number}`}
        >
          {step.number}
        </span>
      </div>

      <h3 className="mt-6 text-sm font-semibold text-white/80">
        {step.title}
      </h3>

      <p className="mt-2 text-xs leading-6 text-white/35">
        {step.description}
      </p>
    </motion.div>
  );
}

function ReviewComment({
  comment,
  index,
}: {
  comment: (typeof comments)[number];
  index: number;
}) {
  const critical = comment.accent === "red";

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.45,
        delay: index * 0.12,
      }}
      className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-md px-2 py-1 font-mono text-[8px] font-semibold ${
            critical
              ? "border border-red-400/15 bg-red-500/[0.07] text-red-300/80"
              : "border border-orange-400/15 bg-orange-500/[0.07] text-orange-300/80"
          }`}
        >
          {comment.severity}
        </span>

        <span className="font-mono text-[8px] text-white/20">
          {comment.line}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <ShieldAlert
          className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
            critical ? "text-red-300/70" : "text-orange-300/70"
          }`}
        />

        <div>
          <div className="text-xs font-medium text-white/65">
            {comment.title}
          </div>

          <p className="mt-1 text-[10px] leading-5 text-white/30">
            {comment.text}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/[0.05] pt-3">
        <Bot className="h-3 w-3 text-violet-300/60" />

        <span className="font-mono text-[8px] text-white/20">
          ReviewAI · context-aware finding
        </span>
      </div>
    </motion.div>
  );
}

function Avatar({
  label,
  type,
}: {
  label: string;
  type: "developer" | "ai" | "reviewer";
}) {
  const styles = {
    developer: "bg-violet-500/10 text-violet-300",
    ai: "bg-cyan-500/10 text-cyan-300",
    reviewer: "bg-emerald-500/10 text-emerald-300",
  };

  const icons = {
    developer: User,
    ai: Bot,
    reviewer: Users,
  };

  const Icon = icons[type];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${styles[type]}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
}

export function TeamWorkflow() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] py-28 sm:py-36">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-violet-500/[0.025] blur-[130px]" />

        <div className="absolute right-[8%] bottom-[10%] h-[450px] w-[450px] rounded-full bg-cyan-500/[0.025] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.05] px-3 py-1.5"
          >
            <Workflow className="h-3 w-3 text-violet-300" />

            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
              Built for teams
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-3xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            Your workflow stays the same.
            <br />
            <span className="bg-gradient-to-r from-white via-white/80 to-white/35 bg-clip-text text-transparent">
              Your reviews get better.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/45 sm:text-base"
          >
            Developers keep using the tools they already know. ReviewAI works
            alongside your pull-request workflow and gives the team another
            layer of engineering intelligence.
          </motion.p>
        </div>

        {/* Workflow steps */}
        <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <div key={step.number} className="contents">
              <WorkflowStep step={step} index={index} />

              {index < workflowSteps.length - 1 && (
                <div className="hidden items-center justify-center xl:flex">
                  <ArrowRight className="h-4 w-4 text-white/10" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main workflow visualization */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mt-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]"
        >
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                <FaGithub className="h-4 w-4 text-white/55" />
              </div>

              <div>
                <div className="text-sm font-medium text-white/70">
                  acme / checkout-api
                </div>

                <div className="font-mono text-[9px] text-white/25">
                  pull request #284 · Refactor payment authorization
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-emerald-400/10 bg-emerald-500/[0.04] px-2.5 py-1.5 font-mono text-[9px] text-emerald-300/70">
                review complete
              </span>

              <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[9px] text-white/30">
                42s
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            {/* Developer side */}
            <div className="border-b border-white/[0.06] p-5 sm:p-7 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex items-center justify-between">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
                  pull request activity
                </div>

                <GitPullRequest className="h-3.5 w-3.5 text-white/20" />
              </div>

              {/* Branch */}
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-violet-300/60" />

                  <span className="font-mono text-[10px] text-white/50">
                    feat/payment-auth
                  </span>

                  <ChevronRight className="ml-auto h-3 w-3 text-white/15" />

                  <span className="font-mono text-[10px] text-white/30">
                    main
                  </span>
                </div>
              </div>

              {/* Commit timeline */}
              <div className="relative mt-6 pl-5">
                <div className="absolute bottom-4 left-[7px] top-4 w-px bg-white/[0.07]" />

                {[
                  {
                    hash: "8a7c2d1",
                    title: "Refactor authorization flow",
                    time: "2m ago",
                  },
                  {
                    hash: "4b9e1f8",
                    title: "Add payment ownership check",
                    time: "7m ago",
                  },
                  {
                    hash: "c2d881a",
                    title: "Update payment service tests",
                    time: "12m ago",
                  },
                ].map((commit, index) => (
                  <motion.div
                    key={commit.hash}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative mb-5 last:mb-0"
                  >
                    <span className="absolute -left-[21px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/[0.1] bg-[#08080a]">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-300/50" />
                    </span>

                    <div className="flex items-center gap-2">
                      <GitCommit className="h-3 w-3 text-white/20" />

                      <span className="font-mono text-[9px] text-white/30">
                        {commit.hash}
                      </span>

                      <span className="ml-auto font-mono text-[8px] text-white/15">
                        {commit.time}
                      </span>
                    </div>

                    <div className="mt-1 text-[10px] text-white/40">
                      {commit.title}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Developer */}
              <div className="mt-7 flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.018] p-3">
                <Avatar label="Rohan · developer" type="developer" />

                <div className="flex items-center gap-1.5 font-mono text-[8px] text-white/20">
                  <GitCommit className="h-3 w-3" />
                  3 commits
                </div>
              </div>
            </div>

            {/* ReviewAI side */}
            <div className="p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-cyan-300/70" />

                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
                    ReviewAI findings
                  </span>
                </div>

                <span className="font-mono text-[9px] text-white/20">
                  7 comments
                </span>
              </div>

              <div className="space-y-3">
                {comments.map((comment, index) => (
                  <ReviewComment
                    key={comment.title}
                    comment={comment}
                    index={index}
                  />
                ))}
              </div>

              {/* Additional finding summary */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  {
                    label: "critical",
                    value: "1",
                    className: "text-red-300/80",
                  },
                  {
                    label: "high",
                    value: "2",
                    className: "text-orange-300/80",
                  },
                  {
                    label: "medium",
                    value: "4",
                    className: "text-yellow-300/70",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/[0.05] bg-black/15 p-3 text-center"
                  >
                    <div className={`font-mono text-sm ${item.className}`}>
                      {item.value}
                    </div>

                    <div className="mt-1 font-mono text-[8px] uppercase text-white/20">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI identity */}
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
                <Avatar label="ReviewAI · reviewer" type="ai" />

                <div className="flex items-center gap-1.5 font-mono text-[8px] text-emerald-300/50">
                  <Sparkles className="h-3 w-3" />
                  context-aware
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Collaboration layer */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Human + AI */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                <Users className="h-4 w-4 text-violet-300" />
              </div>

              <div>
                <div className="text-sm font-medium text-white/70">
                  AI + human review
                </div>

                <div className="font-mono text-[9px] text-white/20">
                  augment, don't replace
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-violet-400/10 bg-violet-500/[0.04] p-3 text-center">
                <Bot className="mx-auto h-4 w-4 text-violet-300/70" />
                <div className="mt-2 text-[9px] text-white/30">
                  AI analysis
                </div>
              </div>

              <ArrowRight className="h-3.5 w-3.5 text-white/15" />

              <div className="flex-1 rounded-xl border border-emerald-400/10 bg-emerald-500/[0.04] p-3 text-center">
                <User className="mx-auto h-4 w-4 text-emerald-300/70" />
                <div className="mt-2 text-[9px] text-white/30">
                  Human decision
                </div>
              </div>
            </div>
          </motion.div>

          {/* Faster reviews */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10">
                <Zap className="h-4 w-4 text-cyan-300" />
              </div>

              <div>
                <div className="text-sm font-medium text-white/70">
                  Faster feedback loops
                </div>

                <div className="font-mono text-[9px] text-white/20">
                  feedback before merge
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between font-mono text-[9px]">
                <span className="text-white/25">traditional</span>
                <span className="text-white/30">hours</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.04]">
                <div className="h-full w-[84%] rounded-full bg-white/10" />
              </div>

              <div className="mt-4 flex items-center justify-between font-mono text-[9px]">
                <span className="text-cyan-300/60">ReviewAI</span>
                <span className="text-cyan-300/60">seconds</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "22%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-cyan-300/50"
                />
              </div>
            </div>
          </motion.div>

          {/* Merge confidence */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <Check className="h-4 w-4 text-emerald-300" />
              </div>

              <div>
                <div className="text-sm font-medium text-white/70">
                  Merge with confidence
                </div>

                <div className="font-mono text-[9px] text-white/20">
                  issues visible before approval
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-1">
              <span className="text-3xl font-semibold text-white/80">
                96
              </span>

              <span className="mb-1 text-sm text-white/30">%</span>

              <span className="mb-1 ml-auto font-mono text-[8px] text-emerald-300/60">
                review confidence
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "96%" }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-400/40 to-emerald-300/80"
              />
            </div>
          </motion.div>
        </div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 flex flex-col items-center justify-center gap-3 text-center sm:flex-row"
        >
          <div className="flex items-center gap-2 text-sm text-white/30">
            <Code2 className="h-4 w-4 text-violet-300/50" />
            Developers write the code.
          </div>

          <ArrowRight className="hidden h-4 w-4 text-white/15 sm:block" />

          <div className="flex items-center gap-2 text-sm text-white/30">
            <Bot className="h-4 w-4 text-cyan-300/50" />
            ReviewAI investigates it.
          </div>

          <ArrowRight className="hidden h-4 w-4 text-white/15 sm:block" />

          <div className="flex items-center gap-2 text-sm text-white/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-300/50" />
            Your team decides.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
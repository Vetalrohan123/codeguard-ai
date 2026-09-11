"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bug,
  Check,
  ChevronRight,
  Database,
  Gauge,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
  Zap,
  BrainCircuit,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FindingCategory =
  | "Security"
  | "Logic"
  | "Performance"
  | "Architecture";

type Finding = {
  id: number;
  category: FindingCategory;
  title: string;
  description: string;
  impact: string;
  file: string;
  line: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  icon: LucideIcon;
  codeBefore: string[];
  codeAfter: string[];
  explanation: string;
};

const findings: Finding[] = [
  {
    id: 1,
    category: "Security",
    title: "Authorization bypass across service boundaries",
    description:
      "A privileged operation can be reached without verifying that the current user owns the requested resource.",
    impact:
      "An authenticated user could potentially access another user's payment information.",
    file: "services/payment.service.ts",
    line: 45,
    severity: "CRITICAL",
    icon: LockKeyhole,
    codeBefore: [
      "const payment = await Payment.findById(paymentId);",
      "",
      "return payment;",
    ],
    codeAfter: [
      "const payment = await Payment.findOne({",
      "  _id: paymentId,",
      "  userId: currentUser.id,",
      "});",
      "",
      "if (!payment) throw new NotFoundError();",
      "return payment;",
    ],
    explanation:
      "The repository context shows that payment records belong to users, but this service only validates the payment ID. ReviewAI connects the model relationship with the request context and identifies the missing ownership check.",
  },
  {
    id: 2,
    category: "Logic",
    title: "Validation allows an impossible runtime state",
    description:
      "Input validation accepts values that later violate assumptions made by downstream business logic.",
    impact:
      "Invalid quantities can reach the billing calculation and produce incorrect totals.",
    file: "controllers/order.controller.ts",
    line: 51,
    severity: "HIGH",
    icon: Bug,
    codeBefore: [
      "const quantity = Number(req.body.quantity);",
      "",
      "if (quantity > 100) {",
      "  throw new ValidationError();",
      "}",
    ],
    codeAfter: [
      "const quantity = Number(req.body.quantity);",
      "",
      "if (!Number.isInteger(quantity) ||",
      "    quantity < 1 || quantity > 100) {",
      "  throw new ValidationError();",
      "}",
    ],
    explanation:
      "The reviewer follows the value from the HTTP boundary into the billing logic and detects that zero, negative, decimal, and NaN-like values are not properly constrained.",
  },
  {
    id: 3,
    category: "Performance",
    title: "Repeated database lookup inside a hot path",
    description:
      "A database query executes repeatedly inside a loop even though the required records can be loaded once.",
    impact:
      "Large requests can trigger hundreds of unnecessary database round trips.",
    file: "services/order.service.ts",
    line: 58,
    severity: "MEDIUM",
    icon: Database,
    codeBefore: [
      "for (const item of order.items) {",
      "  const product = await Product.findById(",
      "    item.productId",
      "  );",
      "",
      "  await processItem(product);",
      "}",
    ],
    codeAfter: [
      "const products = await Product.find({",
      "  _id: { $in: productIds },",
      "});",
      "",
      "for (const item of order.items) {",
      "  const product = productMap[item.productId];",
      "  await processItem(product);",
      "}",
    ],
    explanation:
      "ReviewAI recognizes the loop as a request-time execution path and connects it with the database access layer. The issue is not the query itself — it is where and how often the query executes.",
  },
  {
    id: 4,
    category: "Architecture",
    title: "Failure handling breaks the request lifecycle",
    description:
      "An asynchronous failure is swallowed before reaching the application's centralized error boundary.",
    impact:
      "The API can return misleading success responses while the underlying operation has failed.",
    file: "controllers/user.controller.ts",
    line: 64,
    severity: "HIGH",
    icon: Zap,
    codeBefore: [
      "updateProfile(userId, payload)",
      "  .catch((error) => {",
      "    logger.error(error);",
      "  });",
      "",
      "return res.json({ success: true });",
    ],
    codeAfter: [
      "try {",
      "  await updateProfile(userId, payload);",
      "} catch (error) {",
      "  logger.error(error);",
      "  throw error;",
      "}",
      "",
      "return res.json({ success: true });",
    ],
    explanation:
      "The finding becomes visible only when the request lifecycle, async control flow, and centralized error middleware are considered together.",
  },
];

const categories: {
  label: FindingCategory;
  icon: LucideIcon;
}[] = [
  { label: "Security", icon: ShieldAlert },
  { label: "Logic", icon: Bug },
  { label: "Performance", icon: Gauge },
  { label: "Architecture", icon: Zap },
];

const severityStyles = {
  CRITICAL: {
    text: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-400/20",
    dot: "bg-red-400",
  },
  HIGH: {
    text: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-400/20",
    dot: "bg-orange-400",
  },
  MEDIUM: {
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-400/20",
    dot: "bg-amber-400",
  },
};

function CodeBlock({
  title,
  lines,
  variant,
}: {
  title: string;
  lines: string[];
  variant: "before" | "after";
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#08080a]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              variant === "before" ? "bg-red-400/70" : "bg-emerald-400/70"
            }`}
          />

          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
            {title}
          </span>
        </div>

        <span className="font-mono text-[9px] text-white/15">
          TypeScript
        </span>
      </div>

      <div className="overflow-x-auto px-4 py-4">
        <pre className="font-mono text-[10px] leading-6 sm:text-[11px]">
          {lines.map((line, index) => (
            <div key={`${line}-${index}`} className="flex min-w-max">
              <span className="mr-5 w-5 select-none text-right text-white/15">
                {index + 1}
              </span>

              <span
                className={
                  variant === "before"
                    ? "text-white/45"
                    : "text-emerald-100/65"
                }
              >
                {line || " "}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function FindingCard({
  finding,
  active,
  onClick,
}: {
  finding: Finding;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = finding.icon;
  const severity = severityStyles[finding.severity];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      className={`group w-full rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-violet-400/20 bg-violet-500/[0.06]"
          : "border-white/[0.06] bg-white/[0.018] hover:border-white/[0.1] hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            active
              ? "border-violet-400/20 bg-violet-500/10 text-violet-300"
              : "border-white/[0.06] bg-white/[0.025] text-white/35"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[8px] tracking-[0.14em] ${severity.bg} ${severity.border} ${severity.text}`}
            >
              <span className={`h-1 w-1 rounded-full ${severity.dot}`} />
              {finding.severity}
            </span>

            <ChevronRight
              className={`h-3.5 w-3.5 transition-all ${
                active
                  ? "translate-x-0 text-violet-300"
                  : "-translate-x-1 text-white/15 group-hover:translate-x-0 group-hover:text-white/40"
              }`}
            />
          </div>

          <h3 className="mt-3 text-sm font-medium leading-5 text-white/85">
            {finding.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/35">
            {finding.description}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="truncate font-mono text-[9px] text-white/20">
              {finding.file}
            </span>

            <span className="text-white/10">·</span>

            <span className="font-mono text-[9px] text-white/20">
              L{finding.line}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export function ReviewFindings() {
  const [activeFinding, setActiveFinding] = useState(0);
  const finding = findings[activeFinding];

  const SeverityIcon = finding.icon;
  const severity = severityStyles[finding.severity];

  return (
    <section className="relative overflow-hidden bg-[#050506] py-24 sm:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-15%] top-[20%] h-[450px] w-[450px] rounded-full bg-violet-600/[0.06] blur-[140px]" />

        <div className="absolute left-[-10%] bottom-[-10%] h-[350px] w-[350px] rounded-full bg-cyan-500/[0.035] blur-[130px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/15 bg-red-500/[0.04] px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-300" />

            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-200/70">
              signal over noise
            </span>
          </div>

          <h2 className="text-3xl font-medium tracking-[-0.035em] text-white sm:text-5xl">
            Find the bugs
            <span className="text-white/30"> hiding between the lines.</span>
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
            ReviewAI looks beyond syntax and changed lines to uncover security,
            logic, performance, and architectural problems that require real
            repository context.
          </p>
        </motion.div>

        {/* Main workspace */}
        <div className="mt-14 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Findings list */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
                detected findings
              </div>

              <div className="font-mono text-[9px] text-white/20">
                {findings.length} issues
              </div>
            </div>

            <div className="space-y-2">
              {findings.map((item, index) => (
                <FindingCard
                  key={item.id}
                  finding={item}
                  active={activeFinding === index}
                  onClick={() => setActiveFinding(index)}
                />
              ))}
            </div>
          </motion.div>

          {/* Detail workspace */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="min-w-0 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.018]"
          >
            {/* Top bar */}
            <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${severity.bg} ${severity.border} ${severity.text}`}
                >
                  <SeverityIcon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <div className="truncate font-mono text-[10px] text-white/45">
                    {finding.file}
                  </div>

                  <div className="mt-1 font-mono text-[9px] text-white/20">
                    line {finding.line} · {finding.category.toLowerCase()}
                  </div>
                </div>
              </div>

              <div
                className={`w-fit rounded-md border px-2.5 py-1.5 font-mono text-[8px] tracking-[0.16em] ${severity.bg} ${severity.border} ${severity.text}`}
              >
                {finding.severity}
              </div>
            </div>

            {/* Finding title */}
            <motion.div
              key={`title-${finding.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border-b border-white/[0.06] px-5 py-6 sm:px-7"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 hidden sm:block">
                  <Sparkles className="h-4 w-4 text-violet-300/70" />
                </div>

                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-violet-300/60">
                    AI finding
                  </div>

                  <h3 className="mt-2 max-w-3xl text-xl font-medium tracking-tight text-white sm:text-2xl">
                    {finding.title}
                  </h3>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/40">
                    {finding.description}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Code comparison */}
            <motion.div
              key={`code-${finding.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="grid gap-3 border-b border-white/[0.06] p-4 sm:grid-cols-2 sm:p-5"
            >
              <CodeBlock
                title="current implementation"
                lines={finding.codeBefore}
                variant="before"
              />

              <CodeBlock
                title="suggested direction"
                lines={finding.codeAfter}
                variant="after"
              />
            </motion.div>

            {/* Explanation */}
            <motion.div
              key={`explanation-${finding.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-5 p-5 sm:grid-cols-[1fr_260px] sm:p-7"
            >
              <div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-3.5 w-3.5 text-violet-300" />

                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
                    why this matters
                  </span>
                </div>

                <p className="mt-3 text-sm leading-7 text-white/45">
                  {finding.explanation}
                </p>

                <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/10 bg-red-500/[0.035] p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300/80" />

                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-red-200/50">
                      potential impact
                    </div>

                    <p className="mt-1.5 text-xs leading-5 text-white/40">
                      {finding.impact}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence card */}
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/25">
                  review confidence
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <span className="text-3xl font-medium tracking-tight text-white">
                    {finding.id === 1
                      ? "98%"
                      : finding.id === 2
                        ? "96%"
                        : finding.id === 3
                          ? "94%"
                          : "91%"}
                  </span>

                  <span className="mb-1 font-mono text-[9px] text-emerald-300/60">
                    high confidence
                  </span>
                </div>

                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        finding.id === 1
                          ? "98%"
                          : finding.id === 2
                            ? "96%"
                            : finding.id === 3
                              ? "94%"
                              : "91%",
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-400"
                  />
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    "Repository context",
                    "Control flow",
                    "Dependency analysis",
                  ].map((signal) => (
                    <div
                      key={signal}
                      className="flex items-center gap-2 text-[10px] text-white/35"
                    >
                      <Check className="h-3 w-3 text-emerald-300/70" />
                      {signal}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Category strip */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <div
                key={category.label}
                className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-3.5 w-3.5 text-white/25" />

                  <span className="text-[10px] text-white/35">
                    {category.label}
                  </span>
                </div>

                <span className="font-mono text-[9px] text-white/15">
                  detected
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Bottom CTA statement */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center"
        >
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-violet-300/60">
              <Zap className="h-3 w-3" />
              less noise
            </div>

            <p className="mt-2 text-sm text-white/35">
              ReviewAI focuses your attention on issues that actually matter.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
            <span>code</span>
            <ArrowRight className="h-3 w-3 text-white/20" />
            <span>context</span>
            <ArrowRight className="h-3 w-3 text-white/20" />
            <span className="text-violet-300/70">insight</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
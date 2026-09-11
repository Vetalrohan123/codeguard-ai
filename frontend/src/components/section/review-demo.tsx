"use client";

import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  FileCode2,
  GitBranch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const codeLines = [
  {
    number: 42,
    content: (
      <>
        <span className="text-violet-300">export async function</span>{" "}
        <span className="text-cyan-300">createPayment</span>(
      </>
    ),
  },
  {
    number: 43,
    content: (
      <>
        {"  "}
        <span className="text-zinc-500">request:</span>{" "}
        <span className="text-emerald-300">PaymentRequest</span>
      </>
    ),
  },
  {
    number: 44,
    content: <>{"{"}</>,
  },
  {
    number: 45,
    content: (
      <>
        {"  "}
        <span className="text-violet-300">const</span>{" "}
        <span className="text-zinc-300">amount</span> ={" "}
        <span className="text-cyan-300">Number</span>(
        <span className="text-zinc-400">request.body.amount</span>);
      </>
    ),
    highlighted: true,
  },
  {
    number: 46,
    content: (
      <>
        {"  "}
        <span className="text-violet-300">return</span>{" "}
        <span className="text-cyan-300">paymentService</span>.
        <span className="text-zinc-300">create</span>({"{"}
      </>
    ),
  },
  {
    number: 47,
    content: (
      <>
        {"    "}amount,
      </>
    ),
  },
  {
    number: 48,
    content: (
      <>
        {"    "}userId: request.userId,
      </>
    ),
  },
  {
    number: 49,
    content: (
      <>
        {"  "}
        {"}"});
      </>
    ),
  },
  {
    number: 50,
    content: <>{"}"}</>,
  },
];

function CodeLine({
  line,
  index,
}: {
  line: (typeof codeLines)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        duration: 0.3,
        delay: index * 0.035,
      }}
      className={[
        "grid min-w-[600px] grid-cols-[48px_minmax(0,1fr)]",
        "border-l-2",
        line.highlighted
          ? "border-violet-400 bg-violet-400/[0.065]"
          : "border-transparent",
      ].join(" ")}
    >
      <span className="select-none border-r border-white/[0.05] pr-3 text-right font-mono text-[10px] leading-8 text-zinc-700">
        {line.number}
      </span>

      <code className="pl-4 font-mono text-[11px] leading-8 text-zinc-500">
        {line.content}
      </code>
    </motion.div>
  );
}

export function ReviewDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative"
    >
      {/* Ambient glow */}
      <div className="absolute -inset-10 rounded-[40px] bg-violet-500/[0.055] blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0b0e] shadow-2xl shadow-black/60">
        {/* Application header */}
        <div className="flex min-h-14 items-center justify-between border-b border-white/[0.07] px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <FaGithub className="size-4 shrink-0 text-zinc-500" />

            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-mono text-[10px] text-zinc-400 sm:text-[11px]">
                acme / payments-api
              </span>

              <ChevronRight className="hidden size-3 shrink-0 text-zinc-700 sm:block" />

              <span className="hidden shrink-0 font-mono text-[10px] text-zinc-600 sm:block">
                PR #482
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[9px] text-zinc-700 sm:block">
              12 files
            </span>

            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-emerald-300">
              <Check className="size-2.5" />
              Complete
            </span>
          </div>
        </div>

        {/* Repository information */}
        <div className="grid border-b border-white/[0.07] sm:grid-cols-3">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:border-b-0 sm:border-r">
            <GitBranch className="size-3 text-violet-300" />

            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-zinc-700">
                Branch
              </p>

              <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                feat/payment-validation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:border-b-0 sm:border-r">
            <FileCode2 className="size-3 text-cyan-300" />

            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-zinc-700">
                Files
              </p>

              <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                12 analyzed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3">
            <ShieldCheck className="size-3 text-emerald-300" />

            <div>
              <p className="font-mono text-[8px] uppercase tracking-wider text-zinc-700">
                Context
              </p>

              <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                4 call paths
              </p>
            </div>
          </div>
        </div>

        {/* Main review area */}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_350px]">
          {/* Code editor */}
          <div className="min-w-0 border-b border-white/[0.07] lg:border-b-0 lg:border-r">
            {/* File header */}
            <div className="flex h-11 items-center justify-between border-b border-white/[0.07] px-4">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-violet-300" />

                <span className="font-mono text-[10px] text-zinc-300">
                  payment.service.ts
                </span>
              </div>

              <span className="font-mono text-[9px] text-zinc-700">
                +1 / -1
              </span>
            </div>

            {/* Diff */}
            <div className="overflow-x-auto py-3 sm:py-4">
              {codeLines.map((line, index) => (
                <CodeLine
                  key={line.number}
                  line={line}
                  index={index}
                />
              ))}
            </div>

            {/* Diff comment anchor */}
            <div className="border-t border-violet-400/10 bg-violet-400/[0.025] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3 text-violet-300" />

                <span className="font-mono text-[9px] uppercase tracking-wider text-violet-300/70">
                  AI is reviewing this change
                </span>

                <span className="ml-auto font-mono text-[9px] text-zinc-700">
                  87%
                </span>
              </div>

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ width: "0%" }}
                  whileInView={{ width: "87%" }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 1.4,
                    delay: 0.5,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-violet-400/70"
                />
              </div>
            </div>
          </div>

          {/* AI review panel */}
          <div className="bg-[#090a0d]">
            <div className="flex h-11 items-center justify-between border-b border-white/[0.07] px-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-violet-300" />

                <span className="text-[10px] font-medium text-zinc-300">
                  AI review
                </span>
              </div>

              <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-700">
                3 findings
              </span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {/* Finding 1 */}
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.55, duration: 0.45 }}
                className="p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-red-300">
                    <span className="size-1.5 rounded-full bg-red-400" />
                    High
                  </span>

                  <span className="font-mono text-[8px] text-zinc-700">
                    L45
                  </span>
                </div>

                <h3 className="mt-3 text-xs font-medium text-zinc-200">
                  Potential numeric validation issue
                </h3>

                <p className="mt-2 text-[10px] leading-5 text-zinc-600">
                  `amount` comes directly from the request and can contain NaN
                  or unexpected values before reaching PaymentService.
                </p>

                <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="font-mono text-[8px] uppercase tracking-wider text-zinc-700">
                    Suggested fix
                  </p>

                  <p className="mt-2 font-mono text-[9px] leading-5 text-zinc-500">
                    Validate and normalize the value before passing it to
                    PaymentService.
                  </p>
                </div>
              </motion.div>

              {/* Finding 2 */}
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.45 }}
                className="p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-amber-300">
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    Medium
                  </span>

                  <span className="font-mono text-[8px] text-zinc-700">
                    L48
                  </span>
                </div>

                <h3 className="mt-3 text-xs font-medium text-zinc-300">
                  Authorization path should be checked
                </h3>

                <p className="mt-2 text-[10px] leading-5 text-zinc-600">
                  ReviewAI traced this call into the payment service and found
                  a missing permission guard.
                </p>
              </motion.div>

              {/* Finding 3 */}
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.85, duration: 0.45 }}
                className="p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                    <span className="size-1.5 rounded-full bg-zinc-500" />
                    Low
                  </span>

                  <span className="font-mono text-[8px] text-zinc-700">
                    L49
                  </span>
                </div>

                <h3 className="mt-3 text-xs font-medium text-zinc-400">
                  Consider simplifying this abstraction
                </h3>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Footer status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[8px] text-zinc-700">
            <span>12 FILES</span>
            <span>•</span>
            <span>4 CALL PATHS</span>
            <span>•</span>
            <span>18 DEPENDENCIES</span>
          </div>

          <div className="flex items-center gap-2">
            <Check className="size-3 text-emerald-300" />

            <span className="font-mono text-[8px] uppercase tracking-wider text-emerald-300/70">
              Context analyzed
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
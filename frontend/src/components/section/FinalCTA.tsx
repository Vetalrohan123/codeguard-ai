"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  GitPullRequest,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const analysisSteps = [
  {
    label: "Repository context",
    value: "12 files",
    status: "complete",
  },
  {
    label: "Execution paths",
    value: "8 traced",
    status: "complete",
  },
  {
    label: "Security analysis",
    value: "3 checks",
    status: "complete",
  },
  {
    label: "AI reasoning",
    value: "Ready",
    status: "active",
  },
] as const;

export function FinalCTA() {
  return (
    <section
      id="get-started"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] px-4 py-28 sm:px-6 lg:px-8"
    >
      {/* =========================================================
          AMBIENT BACKGROUND
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Main animated glow */}
        <motion.div
          animate={{
            opacity: [0.06, 0.1, 0.06],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[160px]"
        />

        {/* Cyan glow */}
        <div className="absolute left-0 top-1/3 h-[300px] w-[300px] rounded-full bg-cyan-500/[0.04] blur-[130px]" />

        {/* Fuchsia glow */}
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-fuchsia-500/[0.035] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* =========================================================
            TOP LABEL
        ========================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Start reviewing
          </div>
        </motion.div>

        {/* =========================================================
            MAIN HEADING
        ========================================================== */}
        <div className="mx-auto mt-7 max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl"
          >
            Stop reviewing diffs.
            <br />

            <span className="bg-gradient-to-r from-violet-200 via-white to-cyan-200 bg-clip-text text-transparent">
              Start reviewing code.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base"
          >
            Connect your repository and let AI investigate the context behind
            every pull request — so your team can focus on building instead
            of searching for hidden problems.
          </motion.p>
        </div>

        {/* =========================================================
            CTA BUTTONS
        ========================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          {/* Connect GitHub */}
          <button
            type="button"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.08)] transition-all duration-200 hover:bg-violet-50 hover:shadow-[0_0_50px_rgba(139,92,246,0.15)]"
          >
            <FaGithub className="h-4 w-4" />

            <span>Connect GitHub</span>

            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          {/* How it works */}
          <button
            type="button"
            onClick={() => {
              document
                .getElementById("workflow")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-6 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white"
          >
            <span>View how it works</span>

            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* =========================================================
            TRUST LINE
        ========================================================== */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-zinc-600"
        >
          <span className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-emerald-400" />
            Free to get started
          </span>

          <span className="hidden h-1 w-1 rounded-full bg-zinc-800 sm:block" />

          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            Permission-scoped access
          </span>

          <span className="hidden h-1 w-1 rounded-full bg-zinc-800 sm:block" />

          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-violet-300" />
            Built for pull requests
          </span>
        </motion.div>

        {/* =========================================================
            PRODUCT SIMULATION
        ========================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 45, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            duration: 0.8,
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mx-auto mt-20 max-w-6xl"
        >
          {/* Outer glow */}
          <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-violet-500/[0.05] blur-3xl" />

          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#08080a] shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
            {/* =====================================================
                WINDOW BAR
            ====================================================== */}
            <div className="flex h-12 items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 sm:px-5">
              {/* Traffic lights */}
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
              </div>

              {/* Repository */}
              <div className="hidden items-center gap-2 font-mono text-[10px] text-zinc-600 sm:flex">
                <Code2 className="h-3.5 w-3.5" />
                reviewai / checkout-api
              </div>

              {/* Analysis status */}
              <div className="flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>

                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300">
                  analysis ready
                </span>
              </div>
            </div>

            {/* =====================================================
                MAIN WORKSPACE
            ====================================================== */}
            <div className="grid lg:grid-cols-[1fr_320px]">
              {/* ===================================================
                  CODE SIDE
              ==================================================== */}
              <div className="min-w-0 border-b border-white/[0.06] lg:border-b-0 lg:border-r">
                {/* File header */}
                <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/10">
                      <Terminal className="h-3.5 w-3.5 text-violet-300" />
                    </div>

                    <div>
                      <p className="font-mono text-[11px] text-zinc-300">
                        payment.service.ts
                      </p>

                      <p className="font-mono text-[9px] text-zinc-600">
                        src/services/payment/
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[9px] text-zinc-600">
                    PR #284
                  </span>
                </div>

                {/* Code */}
                <div className="overflow-x-auto px-3 py-5 sm:px-5">
                  <div className="space-y-1 font-mono text-[10px] leading-6 sm:text-[11px]">
                    <CodeLine number="39">
                      <span className="text-violet-300">
                        async
                      </span>{" "}
                      <span className="text-cyan-300">
                        authorizePayment
                      </span>
                      <span className="text-zinc-500">
                        (
                      </span>
                      <span className="text-orange-200">
                        paymentId
                      </span>
                      <span className="text-zinc-500">
                        ,
                      </span>{" "}
                      <span className="text-orange-200">
                        userId
                      </span>
                      <span className="text-zinc-500">
                        ) {"{"}
                      </span>
                    </CodeLine>

                    <CodeLine number="40">
                      <span className="text-violet-300">
                        const
                      </span>{" "}
                      <span className="text-zinc-300">
                        payment
                      </span>{" "}
                      <span className="text-zinc-500">
                        =
                      </span>{" "}
                      <span className="text-violet-300">
                        await
                      </span>{" "}
                      <span className="text-cyan-300">
                        db
                      </span>
                      <span className="text-zinc-500">
                        .
                      </span>
                      <span className="text-cyan-300">
                        payment
                      </span>
                      <span className="text-zinc-500">
                        .
                      </span>
                      <span className="text-cyan-300">
                        findUnique
                      </span>
                      <span className="text-zinc-500">
                        ({"{"}
                      </span>
                    </CodeLine>

                    <CodeLine
                      number="41"
                      indent={1}
                    >
                      <span className="text-orange-200">
                        where
                      </span>
                      <span className="text-zinc-500">
                        :
                      </span>{" "}
                      <span className="text-zinc-300">
                        {"{"}
                      </span>
                    </CodeLine>

                    <CodeLine
                      number="42"
                      indent={2}
                    >
                      <span className="text-orange-200">
                        id
                      </span>
                      <span className="text-zinc-500">
                        :
                      </span>{" "}
                      <span className="text-zinc-300">
                        paymentId
                      </span>
                    </CodeLine>

                    <CodeLine
                      number="43"
                      indent={1}
                    >
                      <span className="text-zinc-300">
                        {"}"}
                      </span>
                    </CodeLine>

                    <CodeLine number="44">
                      <span className="text-zinc-300">
                        {"});"}
                      </span>
                    </CodeLine>

                    {/* Critical finding */}
                    <div className="relative rounded-lg border border-red-400/20 bg-red-400/[0.05] px-2">
                      <div className="absolute -left-2 top-0 h-full w-0.5 rounded-full bg-red-400/70" />

                      <CodeLine number="45">
                        <span className="text-violet-300">
                          if
                        </span>{" "}
                        <span className="text-zinc-500">
                          (
                        </span>
                        <span className="text-zinc-300">
                          payment
                        </span>
                        <span className="text-zinc-500">
                          .
                        </span>
                        <span className="text-orange-200">
                          userId
                        </span>{" "}
                        <span className="text-zinc-500">
                          !==
                        </span>{" "}
                        <span className="text-orange-200">
                          userId
                        </span>
                        <span className="text-zinc-500">
                          )
                        </span>{" "}
                        <span className="text-zinc-500">
                          {"{"}
                        </span>
                      </CodeLine>

                      <CodeLine
                        number="46"
                        indent={1}
                      >
                        <span className="text-violet-300">
                          throw
                        </span>{" "}
                        <span className="text-violet-300">
                          new
                        </span>{" "}
                        <span className="text-cyan-300">
                          ForbiddenError
                        </span>
                        <span className="text-zinc-500">
                          (
                        </span>
                        <span className="text-emerald-300">
                          &quot;Not authorized&quot;
                        </span>
                        <span className="text-zinc-500">
                          );
                        </span>
                      </CodeLine>

                      <CodeLine number="47">
                        <span className="text-zinc-500">
                          {"}"}
                        </span>
                      </CodeLine>
                    </div>

                    <CodeLine number="48">
                      <span className="text-violet-300">
                        return
                      </span>{" "}
                      <span className="text-zinc-300">
                        payment
                      </span>
                      <span className="text-zinc-500">
                        ;
                      </span>
                    </CodeLine>

                    <CodeLine number="49">
                      <span className="text-zinc-500">
                        {"}"}
                      </span>
                    </CodeLine>
                  </div>
                </div>

                {/* Code footer */}
                <div className="flex items-center justify-between border-t border-white/[0.05] px-4 py-3 font-mono text-[9px] text-zinc-600 sm:px-5">
                  <span>typescript</span>
                  <span>9 lines analyzed</span>
                </div>
              </div>

              {/* ===================================================
                  ANALYSIS SIDE
              ==================================================== */}
              <div className="bg-white/[0.015]">
                {/* Analysis header */}
                <div className="border-b border-white/[0.05] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white">
                        Review intelligence
                      </p>

                      <p className="mt-1 font-mono text-[9px] text-zinc-600">
                        AI investigation
                      </p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-400/10">
                      <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* Progress */}
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                        Review progress
                      </span>

                      <span className="font-mono text-[9px] text-violet-300">
                        84%
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "84%" }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 1.2,
                          delay: 0.4,
                        }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Analysis steps */}
                  <div className="mt-5 space-y-2">
                    {analysisSteps.map(
                      (step, index) => (
                        <motion.div
                          key={step.label}
                          initial={{
                            opacity: 0,
                            x: 10,
                          }}
                          whileInView={{
                            opacity: 1,
                            x: 0,
                          }}
                          viewport={{
                            once: true,
                          }}
                          transition={{
                            duration: 0.4,
                            delay:
                              0.35 +
                              index * 0.08,
                          }}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3"
                        >
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                              step.status ===
                              "active"
                                ? "bg-violet-400/10"
                                : "bg-emerald-400/10"
                            }`}
                          >
                            {step.status ===
                            "active" ? (
                              <CircleDot className="h-3.5 w-3.5 animate-pulse text-violet-300" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-emerald-300" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] text-zinc-300">
                              {step.label}
                            </p>
                          </div>

                          <span
                            className={`font-mono text-[9px] ${
                              step.status ===
                              "active"
                                ? "text-violet-300"
                                : "text-zinc-600"
                            }`}
                          >
                            {step.value}
                          </span>
                        </motion.div>
                      ),
                    )}
                  </div>

                  {/* Finding */}
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
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
                      delay: 0.8,
                    }}
                    className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.045] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-md border border-red-400/20 bg-red-400/10 px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-red-300">
                        Critical
                      </span>

                      <span className="font-mono text-[9px] text-zinc-600">
                        96% confidence
                      </span>
                    </div>

                    <p className="mt-3 text-xs font-medium leading-5 text-white">
                      Authorization check can be
                      bypassed.
                    </p>

                    <p className="mt-2 text-[10px] leading-5 text-zinc-500">
                      The comparison uses the same
                      identifier on both sides, so the
                      ownership check does not validate
                      the requesting user.
                    </p>

                    <div className="mt-3 flex items-center gap-2 font-mono text-[9px] text-red-300">
                      <span>
                        payment.service.ts
                      </span>
                      <span className="text-zinc-700">
                        :
                      </span>
                      <span>45</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* =====================================================
                BOTTOM STATUS
            ====================================================== */}
            <div className="flex flex-col gap-3 border-t border-white/[0.06] bg-white/[0.015] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-2">
                <GitPullRequest className="h-3.5 w-3.5 text-violet-300" />

                <span className="font-mono text-[9px] text-zinc-600">
                  feat/payment-auth → main
                </span>
              </div>

              <div className="flex items-center gap-4 font-mono text-[9px] text-zinc-600">
                <span>
                  1 <span className="text-red-300">critical</span>
                </span>

                <span>
                  2 <span className="text-orange-300">high</span>
                </span>

                <span>
                  4 <span className="text-yellow-300">medium</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =========================================================
            FINAL STATEMENT
        ========================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            delay: 0.25,
          }}
          className="mx-auto mt-16 max-w-3xl text-center"
        >
          {/* Label */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-white/[0.12]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
              Developers write code
            </span>

            <span className="h-px w-12 bg-gradient-to-l from-transparent to-white/[0.12]" />
          </div>

          {/* Flow */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-zinc-600">
              →
            </span>

            <span className="text-zinc-400">
              AI investigates
            </span>

            <span className="text-zinc-600">
              →
            </span>

            <span className="text-zinc-400">
              team decides
            </span>

            <span className="text-zinc-600">
              →
            </span>

            <span className="text-emerald-300">
              ship with confidence
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ===============================================================
   CODE LINE
================================================================ */

function CodeLine({
  number,
  children,
  indent = 0,
}: {
  number: string;
  children: React.ReactNode;
  indent?: number;
}) {
  return (
    <div className="flex min-w-max">
      <span className="mr-4 w-5 select-none text-right text-zinc-700">
        {number}
      </span>

      <span
        style={{
          paddingLeft: `${indent * 16}px`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default FinalCTA;

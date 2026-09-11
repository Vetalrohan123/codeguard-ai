"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Play,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

import { ReviewDemo } from "@/components/section/review-demo";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050506]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 developer-grid opacity-40" />

      <div className="pointer-events-none absolute left-1/2 top-[-300px] h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-violet-500/[0.075] blur-[150px]" />

      <div className="pointer-events-none absolute right-[-250px] top-[500px] h-[500px] w-[500px] rounded-full bg-cyan-400/[0.035] blur-[150px]" />

      {/* Hero content */}
      <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-36 sm:px-8 sm:pt-40 lg:px-10 lg:pt-44">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-violet-400/10">
              <FaGithub className="size-3 text-violet-300" />
            </span>

            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
              AI code review, with full repository context
            </span>

            <span className="size-1 rounded-full bg-emerald-300" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mx-auto mt-7 max-w-5xl text-center"
        >
          <h1 className="text-balance text-5xl font-semibold tracking-[-0.055em] text-white sm:text-6xl lg:text-[78px] lg:leading-[1.02]">
            Your AI code reviewer
            <br />
            that{" "}
            <span className="heading-gradient">
              understands the whole codebase.
            </span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.18,
          }}
          className="mx-auto mt-7 max-w-2xl text-center text-sm leading-7 text-zinc-500 sm:text-base"
        >
          Catch bugs, security issues, regressions, and architectural problems
          before they reach production. ReviewAI analyzes your changes in the
          context of the entire repository—not just the diff.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.25,
          }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href="#demo"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-black shadow-xl shadow-white/[0.05] transition-all hover:bg-zinc-200 motion-reduce:transition-none"
          >
            <FaGithub className="size-4" />

            Review your code

            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </a>

          <a
            href="#demo"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.055] hover:text-white motion-reduce:transition-none"
          >
            <Play className="size-3.5 fill-current" />
            View demo
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.35,
          }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-700">
            Built for modern engineering teams
          </span>

          <span className="hidden size-1 rounded-full bg-zinc-800 sm:block" />

          <span className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-700">
            <Check className="size-3 text-emerald-400/70" />
            GitHub
          </span>

          <span className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-700">
            <Check className="size-3 text-emerald-400/70" />
            GitLab
          </span>

          <span className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-700">
            <Check className="size-3 text-emerald-400/70" />
            TypeScript
          </span>
        </motion.div>

        {/* Product UI */}
        <div
          id="demo"
          className="mx-auto mt-16 max-w-6xl scroll-mt-24 sm:mt-20 lg:mt-24"
        >
          <ReviewDemo />
        </div>

        {/* Bottom descriptor */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-5 flex max-w-5xl flex-col items-center justify-between gap-2 px-1 sm:flex-row"
        >
          <span className="font-mono text-[9px] text-zinc-700">
            PULL REQUEST · REPOSITORY CONTEXT · AI REASONING
          </span>

          <span className="font-mono text-[9px] text-emerald-400/60">
            REVIEW COMPLETE
          </span>
        </motion.div>
      </div>
    </section>
  );
}
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  CircleHelp,
  GitBranch,
  Lock,
  MessageSquareCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "How does the AI code reviewer understand my repository?",
    answer:
      "The reviewer is designed to go beyond the changed lines in a pull request. It can combine the PR diff with related files, dependency relationships, call paths, repository conventions, and retrieved code context before generating findings. This allows a finding to be based on how the changed code actually interacts with the rest of the codebase.",
    icon: GitBranch,
  },
  {
    question: "Does it only review the lines changed in a PR?",
    answer:
      "No. The intended review pipeline starts with the changed files, then expands the analysis to relevant repository context. Depending on the finding, the reviewer can inspect related functions, services, models, middleware, configuration, and other files that influence the execution path.",
    icon: MessageSquareCode,
  },
  {
    question: "What types of issues can it detect?",
    answer:
      "The system is designed to identify security vulnerabilities, logic bugs, validation problems, performance bottlenecks, architectural issues, error-handling problems, and maintainability concerns. Deterministic analyzers can provide additional signals that the AI uses when reasoning about the code.",
    icon: ShieldCheck,
  },
  {
    question: "Will it create lots of false-positive comments?",
    answer:
      "The goal is to prioritize actionable findings instead of commenting on every possible issue. Findings can be ranked using severity, confidence, repository context, and the potential impact of the problem. Teams can also define their own review rules and standards to control what matters to them.",
    icon: Sparkles,
  },
  {
    question: "Can I use it with private repositories?",
    answer:
      "The product is designed around permission-scoped repository access. A production implementation should request only the GitHub permissions required for analysis and review workflows, while avoiding unnecessary write or administrative permissions.",
    icon: Lock,
  },
  {
    question: "Can my team define its own review rules?",
    answer:
      "Yes. Team-specific rules are intended to let engineering organizations encode conventions such as API design standards, security requirements, naming conventions, database practices, error-handling patterns, and architectural constraints.",
    icon: MessageSquareCode,
  },
  {
    question: "Does it replace human code review?",
    answer:
      "No. It is designed to handle repetitive investigation and surface potential problems earlier. Engineers still make the final decision about whether a change is correct, safe, and appropriate for the product.",
    icon: CircleHelp,
  },
  {
    question: "How does the pricing work?",
    answer:
      "The pricing shown on this landing page is demo pricing for the product concept. The intended model is developer-focused: a free tier for experimentation, a Pro tier for individual developers and private repositories, and a Team tier for shared engineering workflows and analytics.",
    icon: Sparkles,
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section
      id="faq"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] px-4 py-28 sm:px-6 lg:px-8"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.8) 0.7px, transparent 0.7px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="absolute left-1/2 top-20 h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.06] blur-[150px]" />

        <div className="absolute right-0 top-1/2 h-[350px] w-[350px] rounded-full bg-cyan-500/[0.035] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300"
          >
            <CircleHelp className="h-3.5 w-3.5" />
            Frequently asked
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl"
          >
            Questions developers
            <br />
            <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
              actually ask.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base"
          >
            Everything you need to know about repository-aware reviews,
            security, findings, team workflows, and the product architecture.
          </motion.p>
        </div>

        {/* FAQ layout */}
        <div className="mt-16 grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-16">
          {/* Side panel */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <div className="sticky top-24">
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10">
                  <MessageSquareCode className="h-5 w-5 text-violet-300" />
                </div>

                <h3 className="mt-5 text-sm font-semibold text-white">
                  Still have questions?
                </h3>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Explore the architecture, workflow, and security model to
                  understand how the reviewer fits into your development
                  process.
                </p>

                <button
                  type="button"
                  className="mt-5 text-xs font-medium text-violet-300 transition hover:text-violet-200"
                >
                  Explore the workflow →
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <span className="text-xs text-zinc-500">
                    Security-first analysis
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                  <GitBranch className="h-4 w-4 text-violet-300" />
                  <span className="text-xs text-zinc-500">
                    Repository-aware context
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                  <Lock className="h-4 w-4 text-cyan-300" />
                  <span className="text-xs text-zinc-500">
                    Permission-scoped access
                  </span>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Questions */}
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const Icon = faq.icon;
              const isOpen = openIndex === index;

              return (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.035,
                  }}
                  className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                    isOpen
                      ? "border-violet-400/20 bg-violet-400/[0.035]"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-6"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                        isOpen
                          ? "border-violet-400/20 bg-violet-400/10"
                          : "border-white/[0.07] bg-white/[0.025]"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isOpen ? "text-violet-300" : "text-zinc-500"
                        }`}
                      />
                    </span>

                    <span className="flex-1 pr-3 text-sm font-medium text-white sm:text-[15px]">
                      {faq.question}
                    </span>

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: {
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          },
                          opacity: {
                            duration: 0.2,
                          },
                        }}
                      >
                        <div className="border-t border-white/[0.06] px-5 pb-6 pt-5 sm:px-6">
                          <div className="pl-0 sm:pl-[52px]">
                            <p className="max-w-3xl text-sm leading-7 text-zinc-400">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-14 flex flex-col items-center justify-center gap-3 text-center sm:flex-row"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
          </div>

          <p className="text-xs text-zinc-600">
            Built around one principle:
            <span className="ml-1 text-zinc-400">
              give developers useful context, not more noise.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default FAQSection;
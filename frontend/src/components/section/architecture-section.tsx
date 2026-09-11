"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  Check,
  Code2,
  Database,
  GitBranch,
  Network,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";

const analysisLayers = [
  {
    number: "01",
    title: "Code intelligence",
    description:
      "Parse syntax, detect patterns, and identify deterministic issues before AI reasoning begins.",
    icon: Code2,
    color: "violet",
    tools: ["Tree-sitter", "Semgrep", "ESLint", "Ruff", "Bandit"],
  },
  {
    number: "02",
    title: "Repository context",
    description:
      "Build relationships between files, functions, dependencies, imports, and call paths.",
    icon: Network,
    color: "cyan",
    tools: ["Dependency graph", "Call graph", "Related files"],
  },
  {
    number: "03",
    title: "Context retrieval",
    description:
      "Retrieve the most relevant repository knowledge instead of flooding the model with irrelevant code.",
    icon: Search,
    color: "emerald",
    tools: ["Embeddings", "pgvector", "RAG"],
  },
  {
    number: "04",
    title: "AI reasoning",
    description:
      "Combine findings, context, and repository conventions to reason about real runtime behavior.",
    icon: BrainCircuit,
    color: "fuchsia",
    tools: ["Gemini", "OpenAI", "Confidence"],
  },
];

const outputItems = [
  {
    icon: ShieldCheck,
    label: "Severity",
    value: "CRITICAL",
  },
  {
    icon: Activity,
    label: "Confidence",
    value: "96%",
  },
  {
    icon: GitBranch,
    label: "Context",
    value: "12 files",
  },
  {
    icon: Zap,
    label: "Priority",
    value: "Immediate",
  },
];

function Connector({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center ${
        vertical ? "h-10 w-full" : "h-full w-10"
      }`}
    >
      <div
        className={
          vertical
            ? "h-full w-px bg-gradient-to-b from-violet-400/0 via-violet-400/50 to-cyan-400/0"
            : "h-px w-full bg-gradient-to-r from-violet-400/0 via-violet-400/50 to-cyan-400/0"
        }
      />

      <motion.div
        animate={{
          opacity: [0, 1, 0],
          ...(vertical
            ? { y: [-12, 12] }
            : { x: [-12, 12] }),
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
      />
    </div>
  );
}

function LayerCard({
  layer,
  index,
}: {
  layer: (typeof analysisLayers)[number];
  index: number;
}) {
  const Icon = layer.icon;

  const colorMap = {
    violet: {
      border: "border-violet-400/20",
      bg: "bg-violet-500/[0.07]",
      icon: "bg-violet-500/10 text-violet-300",
      glow: "bg-violet-500/10",
    },
    cyan: {
      border: "border-cyan-400/20",
      bg: "bg-cyan-500/[0.07]",
      icon: "bg-cyan-500/10 text-cyan-300",
      glow: "bg-cyan-500/10",
    },
    emerald: {
      border: "border-emerald-400/20",
      bg: "bg-emerald-500/[0.07]",
      icon: "bg-emerald-500/10 text-emerald-300",
      glow: "bg-emerald-500/10",
    },
    fuchsia: {
      border: "border-fuchsia-400/20",
      bg: "bg-fuchsia-500/[0.07]",
      icon: "bg-fuchsia-500/10 text-fuchsia-300",
      glow: "bg-fuchsia-500/10",
    },
  } as const;

  const colors = colorMap[layer.color as keyof typeof colorMap];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.55,
        delay: index * 0.08,
      }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-2xl border ${colors.border} bg-white/[0.025] p-5 transition-colors duration-300 hover:bg-white/[0.045]`}
    >
      <div
        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${colors.glow}`}
      />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.icon}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <span className="font-mono text-[10px] tracking-[0.2em] text-white/25">
            {layer.number}
          </span>
        </div>

        <h3 className="text-base font-semibold text-white">
          {layer.title}
        </h3>

        <p className="mt-2 min-h-[66px] text-sm leading-6 text-white/45">
          {layer.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {layer.tools.map((tool) => (
            <span
              key={tool}
              className="rounded-md border border-white/[0.07] bg-black/20 px-2 py-1 font-mono text-[9px] text-white/35"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TerminalLine({
  index,
  label,
  status = "done",
}: {
  index: string;
  label: string;
  status?: "done" | "active";
}) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px]">
      <span className="text-white/20">{index}</span>

      <span className="flex-1 text-white/45">{label}</span>

      {status === "done" ? (
        <span className="flex items-center gap-1.5 text-emerald-400/80">
          <Check className="h-3 w-3" />
          done
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-cyan-300/80">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full bg-cyan-300"
          />
          running
        </span>
      )}
    </div>
  );
}

export function ArchitectureSection() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] py-28 sm:py-36">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-20 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-500/[0.035] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
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
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.06] px-3 py-1.5"
          >
            <Server className="h-3 w-3 text-violet-300" />

            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
              Under the hood
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-3xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            One review.
            <br />
            <span className="bg-gradient-to-r from-white via-white/80 to-white/35 bg-clip-text text-transparent">
              Multiple layers of reasoning.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/45 sm:text-base"
          >
            ReviewAI combines deterministic analysis, repository context,
            retrieval, and AI reasoning before producing a single finding.
          </motion.p>
        </div>

        {/* Main architecture */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] shadow-2xl shadow-black/30"
        >
          {/* Window header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.025] px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] text-white/25">
              <Terminal className="h-3 w-3" />
              reviewai / analysis-pipeline
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="font-mono text-[9px] text-white/30">
                pipeline ready
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            {/* Pipeline labels */}
            <div className="mb-7 hidden items-center justify-between lg:flex">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
                <Workflow className="h-3.5 w-3.5" />
                analysis pipeline
              </div>

              <div className="font-mono text-[9px] text-white/20">
                deterministic → contextual → probabilistic
              </div>
            </div>

            {/* Desktop pipeline */}
            <div className="hidden items-stretch lg:flex">
              {/* PR */}
              <div className="w-[130px] shrink-0">
                <motion.div
                  whileHover={{ y: -3 }}
                  className="flex h-full min-h-[220px] flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05]">
                    <GitBranch className="h-4 w-4 text-white/60" />
                  </div>

                  <div className="mt-5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">
                    input
                  </div>

                  <div className="mt-2 text-sm font-medium text-white/80">
                    Pull Request
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-white/35">
                    Changed files, commits, metadata and review rules.
                  </p>

                  <div className="mt-auto rounded-lg border border-white/[0.06] bg-white/[0.025] p-2.5">
                    <div className="font-mono text-[9px] text-white/30">
                      #284
                    </div>
                    <div className="mt-1 truncate text-[10px] text-white/55">
                      Refactor payment auth
                    </div>
                  </div>
                </motion.div>
              </div>

              <Connector />

              {/* Analysis */}
              <div className="flex-1">
                <div className="grid h-full grid-cols-2 gap-3">
                  {analysisLayers.map((layer, index) => (
                    <LayerCard
                      key={layer.number}
                      layer={layer}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              <Connector />

              {/* Output */}
              <div className="w-[180px] shrink-0">
                <motion.div
                  whileHover={{ y: -3 }}
                  className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.035] p-4"
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />

                  <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Sparkles className="h-4 w-4 text-emerald-300" />
                    </div>

                    <div className="mt-5 font-mono text-[9px] uppercase tracking-[0.15em] text-emerald-300/45">
                      output
                    </div>

                    <div className="mt-2 text-sm font-medium text-white/85">
                      Review finding
                    </div>

                    <div className="mt-4 space-y-2">
                      {outputItems.map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.label}
                            className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2"
                          >
                            <Icon className="h-3 w-3 text-emerald-300/70" />

                            <span className="text-[9px] text-white/30">
                              {item.label}
                            </span>

                            <span className="ml-auto font-mono text-[9px] text-white/65">
                              {item.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Mobile / tablet pipeline */}
            <div className="lg:hidden">
              {/* Input */}
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                    <GitBranch className="h-4 w-4 text-white/60" />
                  </div>

                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">
                      input
                    </div>
                    <div className="mt-1 text-sm font-medium text-white/80">
                      Pull Request #284
                    </div>
                  </div>
                </div>
              </div>

              <Connector vertical />

              <div className="grid gap-3 sm:grid-cols-2">
                {analysisLayers.map((layer, index) => (
                  <LayerCard
                    key={layer.number}
                    layer={layer}
                    index={index}
                  />
                ))}
              </div>

              <Connector vertical />

              {/* Output */}
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.035] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Sparkles className="h-4 w-4 text-emerald-300" />
                  </div>

                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-emerald-300/45">
                      output
                    </div>

                    <div className="mt-1 text-sm font-medium text-white/80">
                      Prioritized review finding
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {outputItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2.5"
                      >
                        <Icon className="h-3.5 w-3.5 text-emerald-300/70" />

                        <div>
                          <div className="text-[9px] text-white/30">
                            {item.label}
                          </div>
                          <div className="font-mono text-[10px] text-white/65">
                            {item.value}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Deterministic vs AI */}
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Code2 className="h-4 w-4 text-violet-300" />
              </div>

              <div>
                <div className="text-sm font-medium text-white/80">
                  Deterministic analysis
                </div>
                <div className="font-mono text-[9px] text-white/25">
                  rules + static analysis
                </div>
              </div>

              <span className="ml-auto rounded-full border border-violet-400/15 bg-violet-500/[0.06] px-2 py-1 font-mono text-[8px] text-violet-300/70">
                predictable
              </span>
            </div>

            <div className="space-y-3 p-5">
              {[
                "Syntax and AST analysis",
                "Security rule detection",
                "Lint and type violations",
                "Known dangerous patterns",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-xs text-white/40"
                >
                  <Check className="h-3.5 w-3.5 text-violet-300/70" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border border-cyan-400/10 bg-cyan-500/[0.02]"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                <BrainCircuit className="h-4 w-4 text-cyan-300" />
              </div>

              <div>
                <div className="text-sm font-medium text-white/80">
                  Contextual reasoning
                </div>
                <div className="font-mono text-[9px] text-white/25">
                  repository + AI
                </div>
              </div>

              <span className="ml-auto rounded-full border border-cyan-400/15 bg-cyan-500/[0.06] px-2 py-1 font-mono text-[8px] text-cyan-300/70">
                contextual
              </span>
            </div>

            <div className="space-y-3 p-5">
              {[
                "Cross-file relationships",
                "Call and dependency paths",
                "Repository-specific conventions",
                "Runtime behavior reasoning",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-xs text-white/40"
                >
                  <Check className="h-3.5 w-3.5 text-cyan-300/70" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/30"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-white/35" />

              <span className="font-mono text-[10px] text-white/35">
                analysis.log
              </span>
            </div>

            <span className="font-mono text-[9px] text-white/20">
              live pipeline
            </span>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="mb-5 font-mono text-xs text-white/35">
              <span className="text-violet-300/70">$</span>{" "}
              reviewai analyze pull-request #284
            </div>

            <div className="space-y-3">
              <TerminalLine
                index="[1/5]"
                label="parsing repository"
              />

              <TerminalLine
                index="[2/5]"
                label="building dependency graph"
              />

              <TerminalLine
                index="[3/5]"
                label="retrieving relevant context · 12 files"
              />

              <TerminalLine
                index="[4/5]"
                label="reasoning over execution paths"
              />

              <TerminalLine
                index="[5/5]"
                label="prioritizing findings"
                status="active"
              />
            </div>

            <div className="mt-5 border-t border-white/[0.05] pt-4 font-mono text-[10px] text-white/25">
              <span className="text-emerald-300/70">✓</span>{" "}
              analysis pipeline initialized successfully
            </div>
          </div>
        </motion.div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 flex flex-col items-center justify-center gap-3 text-center sm:flex-row"
        >
          <div className="flex items-center gap-2 text-sm text-white/35">
            <Database className="h-4 w-4 text-violet-300/60" />
            PostgreSQL + pgvector
          </div>

          <ArrowRight className="hidden h-4 w-4 text-white/15 sm:block" />

          <div className="flex items-center gap-2 text-sm text-white/35">
            <BrainCircuit className="h-4 w-4 text-cyan-300/60" />
            Context-aware AI
          </div>

          <ArrowRight className="hidden h-4 w-4 text-white/15 sm:block" />

          <div className="flex items-center gap-2 text-sm text-white/35">
            <ShieldCheck className="h-4 w-4 text-emerald-300/60" />
            Actionable reviews
          </div>
        </motion.div>
      </div>
    </section>
  );
}
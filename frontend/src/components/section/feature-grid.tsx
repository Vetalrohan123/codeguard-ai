"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Braces,
  Code2,
  DatabaseZap,
  Gauge,
  Network,
  ScanSearch,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Code2,
    eyebrow: "LANGUAGES",
    title: "Understands modern codebases",
    description:
      "Analyze the languages and frameworks your team already uses without changing your development workflow.",
    size: "large",
    visual: "languages",
  },
  {
    icon: ShieldCheck,
    eyebrow: "SECURITY",
    title: "Security-first reviews",
    description:
      "Detect authorization flaws, injection risks, unsafe input handling, secrets, and dangerous data flows before they reach production.",
    size: "large",
    visual: "security",
  },
  {
    icon: Network,
    eyebrow: "CONTEXT",
    title: "Repository-aware reasoning",
    description:
      "ReviewAI follows imports, dependencies, callers, and related files instead of treating every changed line in isolation.",
    size: "normal",
    visual: "graph",
  },
  {
    icon: Gauge,
    eyebrow: "PERFORMANCE",
    title: "Find expensive code paths",
    description:
      "Surface repeated database queries, unnecessary work, blocking operations, and performance regressions hiding inside ordinary PRs.",
    size: "normal",
    visual: "performance",
  },
  {
    icon: SlidersHorizontal,
    eyebrow: "RULES",
    title: "Your rules. Your standards.",
    description:
      "Create custom review rules for architecture decisions, naming conventions, security requirements, and team-specific patterns.",
    size: "normal",
    visual: "rules",
  },
  {
    icon: DatabaseZap,
    eyebrow: "RAG",
    title: "Learn from your repository",
    description:
      "Use embeddings and retrieval to bring relevant code, documentation, and architectural context into every review.",
    size: "normal",
    visual: "rag",
  },
  {
    icon: Workflow,
    eyebrow: "CI/CD",
    title: "Fits directly into CI",
    description:
      "Run automated reviews alongside your existing checks and block risky changes before they are merged.",
    size: "wide",
    visual: "pipeline",
  },
  {
    icon: Activity,
    eyebrow: "TEAMS",
    title: "Built for engineering teams",
    description:
      "Give every developer consistent feedback while keeping humans in control of what gets merged.",
    size: "wide",
    visual: "team",
  },
];

const languages = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "SQL",
];

function LanguageVisual() {
  return (
    <div className="mt-7 grid grid-cols-4 gap-2">
      {languages.map((language, index) => (
        <motion.div
          key={language}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.04 }}
          className="flex h-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] font-mono text-[8px] text-white/35"
        >
          {language}
        </motion.div>
      ))}
    </div>
  );
}

function SecurityVisual() {
  return (
    <div className="relative mt-7 overflow-hidden rounded-xl border border-red-400/[0.08] bg-black/20 p-4">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-red-500/[0.06] blur-3xl" />

      <div className="relative space-y-2">
        {[
          {
            label: "Authorization",
            status: "blocked",
            color: "text-red-300/70",
          },
          {
            label: "Input validation",
            status: "checked",
            color: "text-emerald-300/70",
          },
          {
            label: "SQL injection",
            status: "checked",
            color: "text-emerald-300/70",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2"
          >
            <span className="font-mono text-[8px] text-white/30">
              {item.label}
            </span>

            <span className={`font-mono text-[8px] ${item.color}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraphVisual() {
  return (
    <div className="relative mt-7 h-32 overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
      <svg
        viewBox="0 0 360 130"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <path
          d="M55 65 C100 65 95 25 145 25"
          stroke="rgba(167,139,250,0.25)"
          strokeWidth="1"
        />

        <path
          d="M55 65 C105 65 105 105 145 105"
          stroke="rgba(34,211,238,0.2)"
          strokeWidth="1"
        />

        <path
          d="M145 25 C195 25 195 65 245 65"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        <path
          d="M145 105 C195 105 195 65 245 65"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        <path
          d="M245 65 C285 65 295 65 320 65"
          stroke="rgba(52,211,153,0.25)"
          strokeWidth="1"
        />
      </svg>

      {[
        {
          left: "12%",
          top: "50%",
          label: "PR",
          active: false,
        },
        {
          left: "38%",
          top: "19%",
          label: "A",
          active: false,
        },
        {
          left: "38%",
          top: "81%",
          label: "B",
          active: false,
        },
        {
          left: "66%",
          top: "50%",
          label: "CTX",
          active: true,
        },
        {
          left: "88%",
          top: "50%",
          label: "AI",
          active: false,
        },
      ].map((node) => (
        <div
          key={node.label}
          style={{
            left: node.left,
            top: node.top,
          }}
          className={`absolute flex h-7 min-w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border px-1.5 font-mono text-[7px] ${
            node.active
              ? "border-violet-400/25 bg-violet-500/10 text-violet-300/80"
              : "border-white/[0.07] bg-white/[0.025] text-white/25"
          }`}
        >
          {node.label}
        </div>
      ))}
    </div>
  );
}

function PerformanceVisual() {
  return (
    <div className="mt-7 rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="flex items-end gap-1.5">
        {[22, 30, 26, 45, 39, 62, 78, 56, 92, 66, 48, 38].map(
          (height, index) => (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              whileInView={{ height }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.04,
              }}
              className={`flex-1 rounded-sm ${
                index === 8
                  ? "bg-violet-400/45"
                  : "bg-white/[0.08]"
              }`}
            />
          ),
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[7px] text-white/20">
          execution path
        </span>

        <span className="font-mono text-[7px] text-violet-300/60">
          hotspot detected
        </span>
      </div>
    </div>
  );
}

function RulesVisual() {
  return (
    <div className="mt-7 space-y-2 rounded-xl border border-white/[0.06] bg-black/20 p-3">
      {[
        "require-service-layer",
        "no-direct-db-access",
        "validate-api-input",
        "require-error-boundary",
      ].map((rule, index) => (
        <div
          key={rule}
          className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2"
        >
          <Settings2
            className={`h-3 w-3 ${
              index === 0
                ? "text-violet-300/70"
                : "text-white/20"
            }`}
          />

          <span className="font-mono text-[8px] text-white/30">
            {rule}
          </span>

          <CheckIcon />
        </div>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300/50" />
  );
}

function RagVisual() {
  return (
    <div className="relative mt-7 rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/15 bg-violet-500/[0.07]">
          <ScanSearch className="h-3.5 w-3.5 text-violet-300/70" />
        </div>

        <div className="flex-1">
          <div className="h-1.5 w-24 rounded-full bg-white/[0.08]" />
          <div className="mt-2 h-1.5 w-16 rounded-full bg-white/[0.04]" />
        </div>

        <div className="font-mono text-[7px] text-violet-300/50">
          retrieve
        </div>
      </div>

      <div className="my-3 h-px bg-gradient-to-r from-violet-400/20 via-white/[0.06] to-transparent" />

      <div className="grid grid-cols-3 gap-2">
        {["auth.ts", "payment.ts", "schema.prisma"].map((file) => (
          <div
            key={file}
            className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-2 py-2 text-center font-mono text-[7px] text-white/25"
          >
            {file}
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineVisual() {
  const steps = [
    "push",
    "analyze",
    "reason",
    "review",
  ];

  return (
    <div className="mt-7 flex items-center gap-2 overflow-hidden">
      {steps.map((step, index) => (
        <div key={step} className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={`flex h-8 flex-1 items-center justify-center rounded-lg border font-mono text-[8px] ${
              index === 2
                ? "border-violet-400/20 bg-violet-500/[0.08] text-violet-300/70"
                : "border-white/[0.06] bg-white/[0.02] text-white/25"
            }`}
          >
            {step}
          </div>

          {index !== steps.length - 1 && (
            <div className="h-px w-3 shrink-0 bg-white/[0.08]" />
          )}
        </div>
      ))}
    </div>
  );
}

function TeamVisual() {
  return (
    <div className="mt-7 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="flex -space-x-2">
        {[
          "bg-violet-400/20",
          "bg-cyan-400/20",
          "bg-emerald-400/20",
          "bg-orange-400/20",
        ].map((color, index) => (
          <div
            key={index}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#09090b] ${color}`}
          >
            <div className="h-2 w-2 rounded-full bg-white/35" />
          </div>
        ))}
      </div>

      <div className="min-w-0">
        <div className="text-[9px] font-medium text-white/45">
          engineering team
        </div>

        <div className="mt-1 font-mono text-[7px] text-white/20">
          consistent review standards
        </div>
      </div>

      <div className="ml-auto rounded-md border border-emerald-400/10 bg-emerald-500/[0.06] px-2 py-1 font-mono text-[7px] text-emerald-300/50">
        synced
      </div>
    </div>
  );
}

function FeatureVisual({
  type,
}: {
  type: string;
}) {
  switch (type) {
    case "languages":
      return <LanguageVisual />;

    case "security":
      return <SecurityVisual />;

    case "graph":
      return <GraphVisual />;

    case "performance":
      return <PerformanceVisual />;

    case "rules":
      return <RulesVisual />;

    case "rag":
      return <RagVisual />;

    case "pipeline":
      return <PipelineVisual />;

    case "team":
      return <TeamVisual />;

    default:
      return null;
  }
}

export function FeatureGrid() {
  return (
    <section className="relative overflow-hidden bg-[#050506] py-24 sm:py-32">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[18%] top-[15%] h-[420px] w-[420px] rounded-full bg-violet-600/[0.035] blur-[140px]" />

        <div className="absolute right-[12%] top-[48%] h-[380px] w-[380px] rounded-full bg-cyan-500/[0.025] blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
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
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-violet-300/70" />

            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
              engineered for real repositories
            </span>
          </div>

          <h2 className="text-3xl font-medium tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
            Built for
            <span className="text-white/30"> serious codebases.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/40 sm:text-base">
            ReviewAI goes beyond surface-level linting. It combines static
            analysis, repository context, dependency relationships, and AI
            reasoning to understand what your code is actually doing.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            const large = feature.size === "large";
            const wide = feature.size === "wide";

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.045,
                }}
                className={`group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6 transition-colors duration-500 hover:border-violet-400/[0.16] hover:bg-white/[0.025] ${
                  large ? "md:col-span-1 xl:col-span-2" : ""
                } ${
                  wide ? "md:col-span-2 xl:col-span-2" : ""
                }`}
              >
                {/* Card glow */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/[0.035] blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Icon */}
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] transition-colors duration-500 group-hover:border-violet-400/15 group-hover:bg-violet-500/[0.06]">
                  <Icon className="h-4 w-4 text-white/40 transition-colors duration-500 group-hover:text-violet-300/80" />
                </div>

                {/* Copy */}
                <div className="relative mt-6">
                  <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-violet-300/40">
                    {feature.eyebrow}
                  </div>

                  <h3 className="mt-2 text-base font-medium tracking-tight text-white/75 sm:text-lg">
                    {feature.title}
                  </h3>

                  <p className="mt-2 max-w-xl text-xs leading-6 text-white/30 sm:text-sm">
                    {feature.description}
                  </p>
                </div>

                <FeatureVisual type={feature.visual} />

                {/* Bottom accent */}
                <div className="pointer-events-none absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-400/0 to-transparent transition-all duration-500 group-hover:via-violet-400/20" />
              </motion.article>
            );
          })}
        </div>

        {/* Supported stack */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-5 rounded-3xl border border-white/[0.07] bg-white/[0.015] p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/20">
                built around your stack
              </div>

              <div className="mt-2 text-sm font-medium text-white/60">
                Works across languages, frameworks, and infrastructure.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "Next.js",
                "React",
                "Node.js",
                "Python",
                "FastAPI",
                "Java",
                "PostgreSQL",
                "MongoDB",
                "Docker",
                "GitHub Actions",
              ].map((technology) => (
                <div
                  key={technology}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 font-mono text-[8px] text-white/30"
                >
                  {technology}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-16 flex flex-col items-center text-center"
        >
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-white/[0.08]" />

            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/20">
              <Braces className="h-3 w-3" />
              static analysis
            </div>

            <div className="h-px w-10 bg-gradient-to-l from-transparent to-white/[0.08]" />
          </div>

          <p className="mt-4 max-w-xl text-xs leading-6 text-white/25">
            Deterministic tools catch what machines are good at.
            Context-aware AI reasons about what those tools cannot.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
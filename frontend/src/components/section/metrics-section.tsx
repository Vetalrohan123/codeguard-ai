"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  Check,
  Clock3,
  Code2,
  GitPullRequest,
  ShieldCheck,
  Target,
  TrendingDown,
  Zap,
} from "lucide-react";

type MetricType = "violet" | "cyan" | "emerald" | "fuchsia";

type Metric = {
  value: string;
  suffix: string;
  label: string;
  description: string;
  icon: typeof Code2;
  trend: string;
  trendLabel: string;
  type: MetricType;
};

const metrics: Metric[] = [
  {
    value: "12.4k",
    suffix: "",
    label: "Findings analyzed",
    description:
      "Across security, logic, performance, and architecture.",
    icon: Code2,
    trend: "+18.7%",
    trendLabel: "this month",
    type: "violet",
  },
  {
    value: "94.8",
    suffix: "%",
    label: "High-confidence findings",
    description:
      "Prioritized findings backed by repository context.",
    icon: Target,
    trend: "+6.2%",
    trendLabel: "confidence",
    type: "cyan",
  },
  {
    value: "42",
    suffix: "s",
    label: "Average review time",
    description:
      "From pull request analysis to actionable feedback.",
    icon: Clock3,
    trend: "-31%",
    trendLabel: "review time",
    type: "emerald",
  },
  {
    value: "67",
    suffix: "%",
    label: "Less review noise",
    description:
      "Fewer low-value comments reaching engineering teams.",
    icon: TrendingDown,
    trend: "-67%",
    trendLabel: "noise",
    type: "fuchsia",
  },
];

const categoryData = [
  {
    label: "Security",
    value: 31,
    count: "3,844",
    icon: ShieldCheck,
  },
  {
    label: "Logic",
    value: 26,
    count: "3,224",
    icon: BrainCircuit,
  },
  {
    label: "Performance",
    value: 23,
    count: "2,851",
    icon: Zap,
  },
  {
    label: "Architecture",
    value: 20,
    count: "2,481",
    icon: GitPullRequest,
  },
];

const metricStyles: Record<
  MetricType,
  {
    border: string;
    icon: string;
    glow: string;
    trend: string;
  }
> = {
  violet: {
    border: "border-violet-400/15",
    icon: "bg-violet-500/10 text-violet-300",
    glow: "bg-violet-500/[0.08]",
    trend: "text-violet-300",
  },
  cyan: {
    border: "border-cyan-400/15",
    icon: "bg-cyan-500/10 text-cyan-300",
    glow: "bg-cyan-500/[0.08]",
    trend: "text-cyan-300",
  },
  emerald: {
    border: "border-emerald-400/15",
    icon: "bg-emerald-500/10 text-emerald-300",
    glow: "bg-emerald-500/[0.08]",
    trend: "text-emerald-300",
  },
  fuchsia: {
    border: "border-fuchsia-400/15",
    icon: "bg-fuchsia-500/10 text-fuchsia-300",
    glow: "bg-fuchsia-500/[0.08]",
    trend: "text-fuchsia-300",
  },
};

function MetricCard({
  metric,
  index,
}: {
  metric: Metric;
  index: number;
}) {
  const Icon = metric.icon;
  const style = metricStyles[metric.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.55,
        delay: index * 0.08,
      }}
      whileHover={{ y: -5 }}
      className={`group relative overflow-hidden rounded-2xl border ${style.border} bg-white/[0.025] p-5 sm:p-6`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${style.glow}`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.icon}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div
            className={`flex items-center gap-1 font-mono text-[9px] ${style.trend}`}
          >
            <ArrowUpRight className="h-3 w-3" />
            {metric.trend}
          </div>
        </div>

        <div className="mt-7 flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {metric.value}
          </span>

          <span className="text-lg font-medium text-white/40">
            {metric.suffix}
          </span>
        </div>

        <div className="mt-2 text-sm font-medium text-white/70">
          {metric.label}
        </div>

        <p className="mt-2 text-xs leading-5 text-white/35">
          {metric.description}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
          <span className="font-mono text-[9px] text-white/20">
            {metric.trendLabel}
          </span>

          <div className="flex items-end gap-1">
            {[25, 40, 30, 55, 45, 72, 65, 82].map(
              (height, i) => (
                <motion.span
                  key={i}
                  initial={{ height: 2 }}
                  whileInView={{
                    height: `${height / 4}px`,
                  }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08 + i * 0.035,
                  }}
                  className="w-1 rounded-full bg-white/20"
                />
              ),
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryRow({
  item,
  index,
}: {
  item: (typeof categoryData)[number];
  index: number;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="group"
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
          <Icon className="h-3.5 w-3.5 text-white/45" />
        </div>

        <span className="text-xs text-white/55">
          {item.label}
        </span>

        <span className="ml-auto font-mono text-[10px] text-white/30">
          {item.count}
        </span>

        <span className="w-8 text-right font-mono text-[10px] text-white/50">
          {item.value}%
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${item.value}%` }}
          viewport={{ once: true }}
          transition={{
            duration: 0.9,
            delay: index * 0.1,
            ease: "easeOut",
          }}
          className="h-full rounded-full bg-gradient-to-r from-violet-400/60 to-cyan-300/70"
        />
      </div>
    </motion.div>
  );
}

function SignalChart() {
  const points = [
    [0, 72],
    [8, 68],
    [16, 71],
    [24, 61],
    [32, 64],
    [40, 51],
    [48, 55],
    [56, 43],
    [64, 45],
    [72, 34],
    [80, 39],
    [88, 25],
    [96, 28],
    [100, 18],
  ];

  const path = points
    .map(([x, y], index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="relative h-[190px] overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
      {/* Grid */}
      <div className="absolute inset-0">
        {[20, 40, 60, 80].map((position) => (
          <div
            key={`h-${position}`}
            className="absolute left-0 right-0 border-t border-white/[0.035]"
            style={{ top: `${position}%` }}
          />
        ))}

        {[20, 40, 60, 80].map((position) => (
          <div
            key={`v-${position}`}
            className="absolute bottom-0 top-0 border-l border-white/[0.035]"
            style={{ left: `${position}%` }}
          />
        ))}
      </div>

      {/* SVG Chart */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-label="Review noise trend"
        role="img"
      >
        <defs>
          <linearGradient
            id="signalGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor="rgba(167,139,250,0.3)"
            />
            <stop
              offset="50%"
              stopColor="rgba(34,211,238,0.75)"
            />
            <stop
              offset="100%"
              stopColor="rgba(52,211,153,0.85)"
            />
          </linearGradient>

          <linearGradient
            id="areaGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="rgba(34,211,238,0.12)"
            />
            <stop
              offset="100%"
              stopColor="rgba(34,211,238,0)"
            />
          </linearGradient>
        </defs>

        <path
          d={`${path} L 100 100 L 0 100 Z`}
          fill="url(#areaGradient)"
        />

        <motion.path
          d={path}
          fill="none"
          stroke="url(#signalGradient)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
          initial={{
            pathLength: 0,
            opacity: 0,
          }}
          whileInView={{
            pathLength: 1,
            opacity: 1,
          }}
          viewport={{ once: true }}
          transition={{
            duration: 1.8,
            ease: "easeOut",
          }}
        />
      </svg>

      {/* Labels */}
      <div className="absolute left-3 top-3 font-mono text-[9px] text-white/20">
        review noise
      </div>

      <div className="absolute bottom-3 left-3 font-mono text-[9px] text-white/20">
        30 days ago
      </div>

      <div className="absolute bottom-3 right-3 font-mono text-[9px] text-white/20">
        today
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md border border-emerald-400/10 bg-emerald-500/[0.05] px-2 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

        <span className="font-mono text-[9px] text-emerald-300/70">
          -67%
        </span>
      </div>
    </div>
  );
}

export function MetricsSection() {
  return (
    <section
      id="metrics"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] py-28 sm:py-36"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[15%] top-20 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.025] blur-[130px]" />

        <div className="absolute right-[10%] top-[45%] h-[450px] w-[450px] rounded-full bg-violet-500/[0.025] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{ once: true }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-500/[0.05] px-3 py-1.5"
          >
            <Activity className="h-3 w-3 text-cyan-300" />

            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">
              Signal over noise
            </span>
          </motion.div>

          <motion.h2
            initial={{
              opacity: 0,
              y: 15,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{ once: true }}
            transition={{
              delay: 0.08,
            }}
            className="text-3xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            Less noise.
            <br />

            <span className="bg-gradient-to-r from-white via-white/80 to-white/35 bg-clip-text text-transparent">
              More signal.
            </span>
          </motion.h2>

          <motion.p
            initial={{
              opacity: 0,
              y: 15,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{ once: true }}
            transition={{
              delay: 0.16,
            }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/45 sm:text-base"
          >
            A useful code review is not the one that produces the
            most comments. It is the one that helps engineers focus
            on the problems that actually matter.
          </motion.p>
        </div>

        {/* Metrics */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.label}
              metric={metric}
              index={index}
            />
          ))}
        </div>

        {/* Dashboard */}
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            margin: "-80px",
          }}
          transition={{
            duration: 0.7,
          }}
          className="mt-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]"
        >
          {/* Dashboard header */}
          <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                <Activity className="h-4 w-4 text-white/50" />
              </div>

              <div>
                <div className="text-sm font-medium text-white/75">
                  Review intelligence
                </div>

                <div className="font-mono text-[9px] text-white/25">
                  repository activity · last 30 days
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[9px] text-white/30">
                30D
              </span>

              <span className="rounded-lg border border-cyan-400/10 bg-cyan-500/[0.05] px-2.5 py-1.5 font-mono text-[9px] text-cyan-300/70">
                all repositories
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
            {/* Chart */}
            <div className="border-b border-white/[0.06] p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
                    review noise
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-white">
                      33%
                    </span>

                    <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-300/70">
                      <TrendingDown className="h-3 w-3" />
                      67% lower
                    </span>
                  </div>
                </div>

                <div className="hidden text-right sm:block">
                  <div className="font-mono text-[9px] text-white/20">
                    baseline
                  </div>

                  <div className="mt-1 font-mono text-[10px] text-white/40">
                    100%
                  </div>
                </div>
              </div>

              <SignalChart />

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["Reviews", "1,284"],
                  ["Findings", "12.4k"],
                  ["Resolved", "9.7k"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.05] bg-black/15 p-3"
                  >
                    <div className="font-mono text-[9px] text-white/20">
                      {label}
                    </div>

                    <div className="mt-1 text-sm font-medium text-white/65">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="p-5 sm:p-6">
              <div className="mb-6">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
                  findings by category
                </div>

                <div className="mt-2 text-sm text-white/55">
                  Where ReviewAI finds the most value
                </div>
              </div>

              <div className="space-y-6">
                {categoryData.map((item, index) => (
                  <CategoryRow
                    key={item.label}
                    item={item}
                    index={index}
                  />
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-emerald-400/10 bg-emerald-500/[0.035] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Check className="h-4 w-4 text-emerald-300" />
                  </div>

                  <div>
                    <div className="text-xs font-medium text-white/65">
                      Focus on what matters
                    </div>

                    <p className="mt-1 text-[11px] leading-5 text-white/35">
                      Findings are ranked using severity, confidence,
                      execution context, and repository relationships.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Proof row */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: GitPullRequest,
              value: "1,284",
              label: "pull requests reviewed",
            },
            {
              icon: ShieldCheck,
              value: "3,844",
              label: "security issues surfaced",
            },
            {
              icon: Check,
              value: "9,701",
              label: "findings resolved",
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.label}
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.08,
                }}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.018] p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                  <Icon className="h-4 w-4 text-white/45" />
                </div>

                <div>
                  <div className="font-mono text-sm text-white/70">
                    {item.value}
                  </div>

                  <div className="mt-0.5 text-[10px] text-white/25">
                    {item.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Closing statement */}
        <motion.div
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <p className="text-sm text-white/25">
            Designed to make engineering teams{" "}
            <span className="text-white/55">
              faster, quieter, and more confident.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default MetricsSection;
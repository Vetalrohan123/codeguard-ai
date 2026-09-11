"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Database,
  EyeOff,
  Fingerprint,
  GitBranch,
  KeyRound,
  Lock,
  Network,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  UserCheck,
  X,
  Zap,
} from "lucide-react";

const securityItems = [
  {
    icon: Lock,
    title: "Encrypted in transit",
    description:
      "Keep repository communication protected while code moves between your infrastructure and the review pipeline.",
    status: "TLS",
  },
  {
    icon: EyeOff,
    title: "No unnecessary exposure",
    description:
      "Retrieve only the repository context required to understand a finding instead of sending an entire codebase to the model.",
    status: "Scoped",
  },
  {
    icon: KeyRound,
    title: "Least-privilege access",
    description:
      "Connect repositories using narrowly scoped permissions and avoid requesting access that the reviewer does not need.",
    status: "Minimal",
  },
  {
    icon: Database,
    title: "Controlled retention",
    description:
      "Define how long review artifacts, embeddings, and repository metadata should remain available.",
    status: "Configurable",
  },
];

const accessFlow = [
  {
    number: "01",
    label: "Repository",
    description: "Permission-scoped access",
    icon: GitBranch,
  },
  {
    number: "02",
    label: "Analysis",
    description: "Isolated processing",
    icon: Server,
  },
  {
    number: "03",
    label: "Context",
    description: "Relevant code only",
    icon: Network,
  },
  {
    number: "04",
    label: "Finding",
    description: "Actionable output",
    icon: ShieldCheck,
  },
];

function SecurityCard({
  item,
  index,
}: {
  item: (typeof securityItems)[number];
  index: number;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
      }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors hover:border-emerald-400/15 hover:bg-white/[0.035]"
    >
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-500/[0.04] blur-3xl transition-opacity group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/[0.08] text-emerald-300">
            <Icon className="h-5 w-5" />
          </div>

          <span className="rounded-full border border-emerald-400/10 bg-emerald-500/[0.04] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-300/60">
            {item.status}
          </span>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-white/80">
          {item.title}
        </h3>

        <p className="mt-2 text-xs leading-6 text-white/35">
          {item.description}
        </p>

        <div className="mt-5 flex items-center gap-2 border-t border-white/[0.05] pt-4">
          <Check className="h-3.5 w-3.5 text-emerald-300/60" />
          <span className="font-mono text-[9px] text-white/25">
            security control
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function AccessNode({
  item,
  index,
}: {
  item: (typeof accessFlow)[number];
  index: number;
}) {
  const Icon = item.icon;

  return (
    <div className="contents">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{
          delay: index * 0.1,
          duration: 0.45,
        }}
        className="relative flex min-w-0 flex-1 flex-col items-center text-center"
      >
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-xl shadow-black/20">
            <Icon className="h-5 w-5 text-white/55" />
          </div>

          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-white/[0.08] bg-[#09090b] px-1 font-mono text-[8px] text-white/30">
            {item.number}
          </span>
        </div>

        <div className="mt-4 text-xs font-medium text-white/65">
          {item.label}
        </div>

        <div className="mt-1 text-[9px] text-white/25">
          {item.description}
        </div>
      </motion.div>

      {index < accessFlow.length - 1 && (
        <div className="mt-7 hidden h-px flex-1 bg-gradient-to-r from-white/[0.03] via-emerald-400/20 to-white/[0.03] sm:block">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{
              duration: 0.7,
              delay: index * 0.12 + 0.2,
            }}
            className="h-px bg-emerald-300/40"
          />
        </div>
      )}
    </div>
  );
}

function PermissionRow({
  label,
  access,
  enabled,
}: {
  label: string;
  access: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.05] py-3 last:border-0">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-md ${
          enabled ? "bg-emerald-500/10" : "bg-white/[0.035]"
        }`}
      >
        {enabled ? (
          <Check className="h-3 w-3 text-emerald-300/80" />
        ) : (
          <X className="h-3 w-3 text-white/20" />
        )}
      </div>

      <span className="flex-1 text-xs text-white/50">{label}</span>

      <span className="font-mono text-[9px] text-white/25">{access}</span>
    </div>
  );
}

export function SecuritySection() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] py-28 sm:py-36">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/[0.025] blur-[150px]" />

        <div className="absolute bottom-0 left-[8%] h-[300px] w-[300px] rounded-full bg-cyan-500/[0.02] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
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
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/[0.05] px-3 py-1.5"
          >
            <Shield className="h-3 w-3 text-emerald-300" />

            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300/80">
              Security by design
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-3xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            Your source code is
            <br />
            <span className="bg-gradient-to-r from-white via-white/80 to-white/35 bg-clip-text text-transparent">
              not just another data point.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/45 sm:text-base"
          >
            Security should be part of the architecture from the first
            repository connection—not an afterthought added after the product
            is built.
          </motion.p>
        </div>

        {/* Security cards */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {securityItems.map((item, index) => (
            <SecurityCard
              key={item.title}
              item={item}
              index={index}
            />
          ))}
        </div>

        {/* Access architecture */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mt-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]"
        >
          <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/[0.08]">
                <Fingerprint className="h-4 w-4 text-emerald-300/80" />
              </div>

              <div>
                <div className="text-sm font-medium text-white/70">
                  Controlled review pipeline
                </div>

                <div className="font-mono text-[9px] text-white/25">
                  repository → analysis → context → finding
                </div>
              </div>

              <div className="ml-auto hidden items-center gap-2 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                <span className="font-mono text-[9px] text-emerald-300/50">
                  protected flow
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-3">
              {accessFlow.map((item, index) => (
                <AccessNode
                  key={item.number}
                  item={item}
                  index={index}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Permission + data isolation */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Permissions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]"
          >
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/[0.08]">
                  <UserCheck className="h-4 w-4 text-violet-300/80" />
                </div>

                <div>
                  <div className="text-sm font-medium text-white/70">
                    Permission model
                  </div>

                  <div className="font-mono text-[9px] text-white/25">
                    least privilege by default
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5">
              <PermissionRow
                label="Read repository"
                access="required"
                enabled
              />

              <PermissionRow
                label="Read pull requests"
                access="required"
                enabled
              />

              <PermissionRow
                label="Write inline comments"
                access="optional"
                enabled
              />

              <PermissionRow
                label="Push code"
                access="not needed"
                enabled={false}
              />

              <PermissionRow
                label="Delete repository"
                access="not needed"
                enabled={false}
              />

              <PermissionRow
                label="Modify repository settings"
                access="not needed"
                enabled={false}
              />
            </div>
          </motion.div>

          {/* Data isolation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-cyan-500/[0.018]"
          >
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-500/[0.04] blur-[80px]" />

            <div className="relative border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/[0.08]">
                  <EyeOff className="h-4 w-4 text-cyan-300/80" />
                </div>

                <div>
                  <div className="text-sm font-medium text-white/70">
                    Context-aware data flow
                  </div>

                  <div className="font-mono text-[9px] text-white/25">
                    retrieve what matters
                  </div>
                </div>
              </div>
            </div>

            <div className="relative p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Changed files",
                    value: "4",
                    icon: GitBranch,
                  },
                  {
                    label: "Related files",
                    value: "8",
                    icon: Network,
                  },
                  {
                    label: "Context window",
                    value: "12",
                    icon: Database,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/[0.05] bg-black/20 p-4"
                    >
                      <Icon className="h-4 w-4 text-cyan-300/60" />

                      <div className="mt-4 font-mono text-xl text-white/70">
                        {item.value}
                      </div>

                      <div className="mt-1 text-[9px] leading-4 text-white/25">
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-white/[0.05] bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/[0.08]">
                    <Zap className="h-3.5 w-3.5 text-cyan-300/70" />
                  </div>

                  <div className="flex-1">
                    <div className="text-[10px] text-white/50">
                      Relevant context selected
                    </div>

                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "78%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400/40 to-emerald-300/70"
                      />
                    </div>
                  </div>

                  <span className="font-mono text-[9px] text-emerald-300/60">
                    78%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Security checklist */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3 lg:w-[280px]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/[0.08]">
                <ShieldCheck className="h-4 w-4 text-emerald-300/80" />
              </div>

              <div>
                <div className="text-sm font-medium text-white/65">
                  Security principles
                </div>

                <div className="font-mono text-[9px] text-white/20">
                  built into the review flow
                </div>
              </div>
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Least privilege",
                "Scoped context",
                "Controlled retention",
                "Auditable access",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-black/15 px-3 py-2.5"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-300/60" />
                  <span className="text-[10px] text-white/40">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-col items-center justify-center gap-3 text-center sm:flex-row"
        >
          <div className="flex items-center gap-2 text-sm text-white/30">
            <Terminal className="h-4 w-4 text-emerald-300/50" />
            Security should be visible, not assumed.
          </div>

          <ArrowRight className="hidden h-4 w-4 text-white/15 sm:block" />

          <span className="font-mono text-[10px] text-white/20">
            verify every control before production deployment
          </span>
        </motion.div>
      </div>
    </section>
  );
}
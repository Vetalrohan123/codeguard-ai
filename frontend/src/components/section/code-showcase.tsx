"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileCode2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Lightbulb,
  Lock,
  Search,
  ShieldAlert,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type Finding = {
  id: number;
  severity: Severity;
  title: string;
  line: number;
  explanation: string;
  why: string;
  fix: string;
};

type TreeNodeData = {
  name: string;
  type: "folder" | "file";
  active?: boolean;
  children?: TreeNodeData[];
};

type CodeLine = {
  number: number;
  content: string;
  finding?: number;
};

type SeverityStyle = {
  text: string;
  border: string;
  background: string;
  icon: LucideIcon;
};

const findings: Finding[] = [
  {
    id: 1,
    severity: "CRITICAL",
    title: "Authorization can be bypassed",
    line: 45,
    explanation:
      "This validation occurs before the permission check used by the payment mutation path.",
    why:
      "The traced call chain shows this method can be reached from an authenticated route that does not enforce the required account-level permission.",
    fix:
      "Move the authorization check into the service boundary so every caller is required to pass the same permission guard.",
  },
  {
    id: 2,
    severity: "HIGH",
    title: "Numeric validation allows unsafe values",
    line: 51,
    explanation:
      "The amount is converted to a number without checking whether the resulting value is finite and positive.",
    why:
      "The downstream payment provider expects a positive finite amount. Invalid values can reach the provider boundary.",
    fix:
      "Validate the parsed amount with Number.isFinite() and require it to be greater than zero.",
  },
  {
    id: 3,
    severity: "MEDIUM",
    title: "Database lookup is repeated",
    line: 58,
    explanation:
      "The customer record is fetched again even though the parent service already loaded it.",
    why:
      "ReviewAI traced the request through PaymentService → CustomerService → CustomerRepository and found the same lookup twice.",
    fix:
      "Pass the existing customer entity through the service call instead of issuing another repository query.",
  },
  {
    id: 4,
    severity: "LOW",
    title: "Consider simplifying this branch",
    line: 64,
    explanation:
      "The conditional can be expressed more clearly using the existing payment status helper.",
    why:
      "The repository already uses the helper in adjacent payment workflows.",
    fix:
      "Reuse isPendingPayment() to keep this path consistent with the surrounding project conventions.",
  },
];

const codeLines: CodeLine[] = [
  {
    number: 39,
    content: "  async validatePayment(input: PaymentInput) {",
  },
  {
    number: 40,
    content: "    const payment = await this.paymentRepo.findById(",
  },
  {
    number: 41,
    content: "      input.paymentId",
  },
  {
    number: 42,
    content: "    );",
  },
  {
    number: 43,
    content: "",
  },
  {
    number: 44,
    content: "    if (!payment) {",
  },
  {
    number: 45,
    content: "      return this.validateAmount(input.amount);",
    finding: 1,
  },
  {
    number: 46,
    content: "    }",
  },
  {
    number: 47,
    content: "",
  },
  {
    number: 48,
    content: "    const customer = await this.customerService",
  },
  {
    number: 49,
    content: "      .findById(payment.customerId);",
  },
  {
    number: 50,
    content: "",
  },
  {
    number: 51,
    content: "    const amount = Number(input.amount);",
    finding: 2,
  },
  {
    number: 52,
    content: "",
  },
  {
    number: 53,
    content: "    if (!customer) {",
  },
  {
    number: 54,
    content: "      throw new NotFoundError('Customer');",
  },
  {
    number: 55,
    content: "    }",
  },
  {
    number: 56,
    content: "",
  },
  {
    number: 57,
    content: "    await this.customerService.findById(",
  },
  {
    number: 58,
    content: "      payment.customerId",
    finding: 3,
  },
  {
    number: 59,
    content: "    );",
  },
  {
    number: 60,
    content: "",
  },
  {
    number: 61,
    content: "    if (payment.status === 'pending') {",
  },
  {
    number: 62,
    content: "      return this.createValidationResult(amount);",
  },
  {
    number: 63,
    content: "    }",
  },
  {
    number: 64,
    content: "    return this.createValidationResult(amount);",
    finding: 4,
  },
  {
    number: 65,
    content: "  }",
  },
];

const tree: TreeNodeData[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "controllers",
        type: "folder",
        children: [
          {
            name: "payment.controller.ts",
            type: "file",
          },
        ],
      },
      {
        name: "services",
        type: "folder",
        children: [
          {
            name: "payment.service.ts",
            type: "file",
            active: true,
          },
          {
            name: "customer.service.ts",
            type: "file",
          },
        ],
      },
      {
        name: "repositories",
        type: "folder",
        children: [
          {
            name: "payment.repository.ts",
            type: "file",
          },
          {
            name: "customer.repository.ts",
            type: "file",
          },
        ],
      },
      {
        name: "middleware",
        type: "folder",
        children: [
          {
            name: "auth.middleware.ts",
            type: "file",
          },
          {
            name: "permissions.ts",
            type: "file",
          },
        ],
      },
    ],
  },
];

const severityStyles: Record<Severity, SeverityStyle> = {
  CRITICAL: {
    text: "text-rose-300",
    border: "border-rose-400/[0.16]",
    background: "bg-rose-400/[0.045]",
    icon: ShieldAlert,
  },

  HIGH: {
    text: "text-orange-300",
    border: "border-orange-400/[0.14]",
    background: "bg-orange-400/[0.04]",
    icon: AlertTriangle,
  },

  MEDIUM: {
    text: "text-amber-300",
    border: "border-amber-400/[0.14]",
    background: "bg-amber-400/[0.04]",
    icon: AlertTriangle,
  },

  LOW: {
    text: "text-zinc-400",
    border: "border-white/[0.08]",
    background: "bg-white/[0.025]",
    icon: Lightbulb,
  },
};

export function CodeShowcase() {
  const [activeFinding, setActiveFinding] = useState(1);

  const selectedFinding =
    findings.find((finding) => finding.id === activeFinding) ?? findings[0];

  return (
    <section
      id="code-showcase"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#050506] py-24 sm:py-32 lg:py-40"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-[-180px] top-[320px] size-[500px] rounded-full bg-violet-500/[0.035] blur-[150px]" />

        <div className="absolute right-[-220px] top-[600px] size-[550px] rounded-full bg-cyan-400/[0.025] blur-[160px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/80">
              04 / Code intelligence
            </span>

            <span className="h-px w-10 bg-white/[0.08]" />

            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-700">
              See the reasoning
            </span>
          </div>

          <h2 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
            Not just comments.
            <br />

            <span className="text-zinc-500">
              Evidence behind every finding.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
            ReviewAI connects the changed code to the surrounding repository,
            traces execution paths, and explains why a finding matters before
            suggesting a fix.
          </p>
        </motion.div>

        {/* Review workspace */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative mt-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090a0d] shadow-2xl shadow-black/30"
        >
          {/* Workspace header */}
          <div className="flex flex-col border-b border-white/[0.07] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <div className="flex gap-1.5">
                <span className="size-2 rounded-full bg-zinc-700" />
                <span className="size-2 rounded-full bg-zinc-700" />
                <span className="size-2 rounded-full bg-zinc-700" />
              </div>

              <div className="h-4 w-px bg-white/[0.07]" />

              <FaGithub className="size-3.5 text-zinc-500" />

              <span className="font-mono text-[9px] text-zinc-500">
                acme / payments-api
              </span>

              <span className="rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 font-mono text-[8px] text-zinc-600">
                PR #482
              </span>
            </div>

            <div className="flex items-center gap-4 border-t border-white/[0.07] px-4 py-3.5 sm:border-t-0 sm:px-5">
              <div className="flex items-center gap-1.5">
                <GitPullRequest className="size-3 text-emerald-400/70" />

                <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-600">
                  Review complete
                </span>
              </div>

              <span className="hidden h-3 w-px bg-white/[0.07] sm:block" />

              <span className="font-mono text-[8px] text-zinc-700">
                4 findings
              </span>
            </div>
          </div>

          {/* Main workspace */}
          <div className="grid xl:grid-cols-[220px_minmax(0,1fr)_330px]">
            {/* Repository tree */}
            <div className="border-b border-white/[0.07] bg-[#08090c] xl:border-b-0 xl:border-r">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-600">
                  Repository
                </span>

                <Search className="size-3 text-zinc-700" />
              </div>

              <div className="p-3">
                <TreeNode node={tree[0]} depth={0} />
              </div>

              <div className="mx-3 mt-3 rounded-lg border border-violet-400/[0.08] bg-violet-400/[0.025] p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3 text-violet-300/70" />

                  <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-500">
                    Context loaded
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <ContextStat label="Files" value="196" />
                  <ContextStat label="Dependencies" value="18" />
                  <ContextStat label="Call paths" value="4" />
                </div>
              </div>
            </div>

            {/* Code editor */}
            <div className="min-w-0 border-b border-white/[0.07] xl:border-b-0 xl:border-r">
              {/* Editor tabs */}
              <div className="flex min-w-0 items-center border-b border-white/[0.06] bg-[#08090c]">
                <div className="flex min-w-0 items-center gap-2 border-r border-white/[0.06] bg-[#0b0c10] px-4 py-3">
                  <FileCode2 className="size-3 text-blue-300/70" />

                  <span className="max-w-[150px] truncate font-mono text-[9px] text-zinc-400">
                    payment.service.ts
                  </span>

                  <span className="size-1 rounded-full bg-violet-300/70" />
                </div>

                <div className="hidden items-center gap-2 px-4 py-3 sm:flex">
                  <GitCommitHorizontal className="size-3 text-zinc-700" />

                  <span className="font-mono text-[8px] text-zinc-700">
                    feat/payment-validation
                  </span>
                </div>
              </div>

              {/* Diff toolbar */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-400/[0.08] px-1.5 py-0.5 font-mono text-[8px] text-emerald-400/70">
                    +8
                  </span>

                  <span className="rounded bg-rose-400/[0.08] px-1.5 py-0.5 font-mono text-[8px] text-rose-300/70">
                    -3
                  </span>

                  <span className="font-mono text-[8px] text-zinc-700">
                    changed lines
                  </span>
                </div>

                <span className="font-mono text-[8px] text-zinc-700">
                  TypeScript
                </span>
              </div>

              {/* Code */}
              <div className="overflow-x-auto py-3">
                <div className="min-w-[580px] font-mono text-[10px] leading-6 sm:text-[11px]">
                  {codeLines.map((line) => {
                    const isFinding = Boolean(line.finding);
                    const isActive = line.finding === activeFinding;

                    return (
                      <button
                        key={line.number}
                        type="button"
                        onClick={() => {
                          if (line.finding) {
                            setActiveFinding(line.finding);
                          }
                        }}
                        className={`group flex w-full min-w-0 text-left transition-colors ${
                          isActive
                            ? "bg-rose-400/[0.07]"
                            : isFinding
                              ? "bg-white/[0.018] hover:bg-white/[0.035]"
                              : "hover:bg-white/[0.015]"
                        }`}
                      >
                        <span className="w-12 shrink-0 select-none pr-3 text-right text-[9px] text-zinc-800">
                          {line.number}
                        </span>

                        <span
                          className={`mr-3 mt-[7px] h-3 w-0.5 shrink-0 rounded-full ${
                            isActive
                              ? "bg-rose-400"
                              : isFinding
                                ? "bg-amber-400/50"
                                : "bg-transparent"
                          }`}
                        />

                        <span
                          className={`whitespace-pre ${
                            isActive
                              ? "text-zinc-200"
                              : isFinding
                                ? "text-zinc-400"
                                : "text-zinc-600"
                          }`}
                        >
                          {renderCode(line.content)}
                        </span>

                        {isFinding ? (
                          <span className="ml-auto mr-4 flex shrink-0 items-center">
                            <CircleDot
                              className={`size-2.5 ${
                                isActive
                                  ? "text-rose-400"
                                  : "text-amber-400/60"
                              }`}
                            />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Review panel */}
            <div className="min-w-0 bg-[#08090c]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-violet-300" />

                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-500">
                    AI Review
                  </span>
                </div>

                <span className="rounded-full border border-emerald-400/[0.12] bg-emerald-400/[0.04] px-2 py-0.5 font-mono text-[7px] uppercase tracking-wider text-emerald-400/70">
                  Context aware
                </span>
              </div>

              {/* Findings */}
              <div className="border-b border-white/[0.06] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-700">
                    Findings
                  </span>

                  <span className="font-mono text-[8px] text-zinc-700">
                    4 total
                  </span>
                </div>

                <div className="space-y-1">
                  {findings.map((finding) => (
                    <FindingButton
                      key={finding.id}
                      finding={finding}
                      active={finding.id === activeFinding}
                      onClick={() => setActiveFinding(finding.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Selected finding */}
              <motion.div
                key={selectedFinding.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="p-4"
              >
                <FindingDetail finding={selectedFinding} />
              </motion.div>
            </div>
          </div>

          {/* Workspace footer */}
          <div className="flex flex-col gap-2 border-t border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />

                <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-600">
                  Analysis complete
                </span>
              </div>

              <span className="hidden h-3 w-px bg-white/[0.07] sm:block" />

              <span className="font-mono text-[8px] text-zinc-700">
                12 files changed · 196 files analyzed
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[8px] text-zinc-700">
              <Lock className="size-3" />
              Repository context
            </div>
          </div>
        </motion.div>

        {/* Bottom explanation */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <ExplainCard
            icon={GitBranch}
            label="Repository context"
            text="The reviewer follows imports, dependencies, shared services, and related files."
            delay={0}
          />

          <ExplainCard
            icon={Terminal}
            label="Execution paths"
            text="It traces how the changed code is actually reached across your application."
            delay={0.08}
          />

          <ExplainCard
            icon={ShieldAlert}
            label="Prioritized findings"
            text="Issues are ranked by impact so engineers can focus on what matters first."
            delay={0.16}
          />
        </div>
      </div>
    </section>
  );
}

function TreeNode({
  node,
  depth,
}: {
  node: TreeNodeData;
  depth: number;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = Boolean(node.children?.length);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) {
            setOpen((value) => !value);
          }
        }}
        className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-white/[0.03] ${
          node.active ? "bg-violet-400/[0.055]" : ""
        }`}
        style={{
          paddingLeft: `${depth * 10 + 6}px`,
        }}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown className="size-3 shrink-0 text-zinc-700" />
          ) : (
            <ChevronRight className="size-3 shrink-0 text-zinc-700" />
          )
        ) : (
          <span className="size-3 shrink-0" />
        )}

        {node.type === "folder" ? (
          <span className="font-mono text-[9px] text-zinc-500">
            {node.name}
          </span>
        ) : (
          <>
            <FileCode2
              className={`size-3 shrink-0 ${
                node.active ? "text-blue-300/70" : "text-zinc-700"
              }`}
            />

            <span
              className={`truncate font-mono text-[8px] ${
                node.active ? "text-zinc-300" : "text-zinc-600"
              }`}
            >
              {node.name}
            </span>
          </>
        )}
      </button>

      {hasChildren && open ? (
        <div>
          {node.children?.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ContextStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[8px] text-zinc-700">
        {label}
      </span>

      <span className="font-mono text-[8px] text-zinc-500">
        {value}
      </span>
    </div>
  );
}

function FindingButton({
  finding,
  active,
  onClick,
}: {
  finding: Finding;
  active: boolean;
  onClick: () => void;
}) {
  const styles = severityStyles[finding.severity];
  const Icon = styles.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
        active
          ? `${styles.border} ${styles.background}`
          : "border-transparent hover:border-white/[0.05] hover:bg-white/[0.02]"
      }`}
    >
      <Icon
        className={`size-3 shrink-0 ${
          active ? styles.text : "text-zinc-700"
        }`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-[7px] tracking-wider ${
              active ? styles.text : "text-zinc-700"
            }`}
          >
            {finding.severity}
          </span>

          <span className="font-mono text-[7px] text-zinc-800">
            L{finding.line}
          </span>
        </div>

        <p
          className={`mt-0.5 truncate text-[9px] ${
            active ? "text-zinc-300" : "text-zinc-600"
          }`}
        >
          {finding.title}
        </p>
      </div>

      {active ? (
        <ChevronRight className="size-3 shrink-0 text-zinc-600" />
      ) : null}
    </button>
  );
}

function FindingDetail({
  finding,
}: {
  finding: Finding;
}) {
  const styles = severityStyles[finding.severity];
  const Icon = styles.icon;

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${styles.border} ${styles.background}`}
        >
          <Icon className={`size-3.5 ${styles.text}`} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-mono text-[8px] uppercase tracking-wider ${styles.text}`}
            >
              {finding.severity}
            </span>

            <span className="font-mono text-[8px] text-zinc-700">
              line {finding.line}
            </span>
          </div>

          <h4 className="mt-1 text-xs font-semibold leading-5 text-zinc-200">
            {finding.title}
          </h4>
        </div>
      </div>

      <DetailBlock
        label="What we found"
        text={finding.explanation}
      />

      <DetailBlock
        label="Why it matters"
        text={finding.why}
      />

      <div className="mt-4 rounded-lg border border-violet-400/[0.1] bg-violet-400/[0.025] p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3 text-violet-300/80" />

          <span className="font-mono text-[8px] uppercase tracking-wider text-violet-300/70">
            Suggested fix
          </span>
        </div>

        <p className="mt-2 text-[9px] leading-5 text-zinc-500">
          {finding.fix}
        </p>
      </div>

      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] py-2.5 font-mono text-[8px] uppercase tracking-wider text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
      >
        <Check className="size-3" />
        View suggested patch
      </button>
    </div>
  );
}

function DetailBlock({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="mt-4">
      <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-zinc-700">
        {label}
      </span>

      <p className="mt-1.5 text-[9px] leading-5 text-zinc-500">
        {text}
      </p>
    </div>
  );
}

function ExplainCard({
  icon: Icon,
  label,
  text,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  text: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.5,
        delay,
      }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4"
    >
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-violet-300/60" />

        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-zinc-600">
          {label}
        </span>
      </div>

      <p className="mt-2 text-xs leading-6 text-zinc-600">
        {text}
      </p>
    </motion.div>
  );
}

function renderCode(code: string) {
  if (!code) {
    return "\u00A0";
  }

  const trimmed = code.trimStart();

  const indentation = code.slice(
    0,
    code.length - trimmed.length,
  );

  if (trimmed.startsWith("const ")) {
    const [declaration, ...rest] = trimmed.split(" = ");

    return (
      <>
        {indentation}

        <span className="text-violet-300/80">const</span>{" "}

        <span className="text-sky-300/70">
          {declaration.replace("const ", "")}
        </span>

        {rest.length > 0 ? (
          <>
            {" = "}

            <span className="text-zinc-400">
              {rest.join(" = ")}
            </span>
          </>
        ) : null}
      </>
    );
  }

  if (trimmed.startsWith("return ")) {
    return (
      <>
        {indentation}

        <span className="text-violet-300/80">return</span>{" "}

        <span className="text-zinc-400">
          {trimmed.slice(7)}
        </span>
      </>
    );
  }

  if (
    trimmed.startsWith("if ") ||
    trimmed.startsWith("if(") ||
    trimmed.startsWith("if (")
  ) {
    return (
      <>
        {indentation}

        <span className="text-violet-300/80">if</span>

        <span className="text-zinc-400">
          {trimmed.slice(2)}
        </span>
      </>
    );
  }

  if (trimmed.startsWith("await ")) {
    return (
      <>
        {indentation}

        <span className="text-violet-300/80">await</span>{" "}

        <span className="text-zinc-400">
          {trimmed.slice(6)}
        </span>
      </>
    );
  }

  if (trimmed.startsWith("async ")) {
    return (
      <>
        {indentation}

        <span className="text-violet-300/80">async</span>{" "}

        <span className="text-zinc-400">
          {trimmed.slice(6)}
        </span>
      </>
    );
  }

  if (
    trimmed.startsWith("throw ") ||
    trimmed.includes("NotFoundError")
  ) {
    return (
      <>
        {indentation}

        <span className="text-violet-300/80">
          {trimmed.startsWith("throw ") ? "throw" : ""}
        </span>

        {trimmed.startsWith("throw ") ? " " : ""}

        <span className="text-zinc-400">
          {trimmed.startsWith("throw ")
            ? trimmed.slice(6)
            : trimmed}
        </span>
      </>
    );
  }

  return (
    <>
      {indentation}

      <span className="text-zinc-500">
        {trimmed}
      </span>
    </>
  );
}
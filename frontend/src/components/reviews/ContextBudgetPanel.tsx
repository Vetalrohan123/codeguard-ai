"use client";

import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Files,
  Scissors,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
  ContextBudget,
  ContextFileBudget,
  ContextPriority,
  PriorityTier,
  ReviewContextBudget,
} from "@/types/context-budget";

interface ContextBudgetPanelProps {
  data: ReviewContextBudget;
}

const MAX_CONTEXT_TOKENS = 15000;

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatSize(characters: number): string {
  if (characters < 1000) {
    return `${characters} chars`;
  }

  if (characters < 1_000_000) {
    return `${(characters / 1000).toFixed(1)}K chars`;
  }

  return `${(characters / 1_000_000).toFixed(1)}M chars`;
}

function getTierStyles(tier: PriorityTier): string {
  switch (tier) {
    case "high":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "medium":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "low":
    default:
      return "border-zinc-700 bg-zinc-800/70 text-zinc-400";
  }
}

function getProgressStyles(percent: number): string {
  if (percent >= 90) {
    return "bg-red-500";
  }

  if (percent >= 70) {
    return "bg-yellow-500";
  }

  return "bg-emerald-500";
}

function getPriorityBarStyles(score: number): string {
  if (score >= 70) {
    return "bg-red-500";
  }

  if (score >= 40) {
    return "bg-yellow-500";
  }

  return "bg-zinc-500";
}

function FileBudgetRow({
  file,
  current,
}: {
  file: ContextFileBudget;
  current?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-md bg-zinc-800 p-1.5">
            <FileCode2 className="h-4 w-4 text-zinc-400" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-zinc-200">
                {file.path}
              </p>

              {current && (
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-400">
                  Current
                </span>
              )}

              {file.truncated && (
                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-yellow-400">
                  <Scissors className="h-3 w-3" />
                  Truncated
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              {file.language}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-zinc-200">
            {formatNumber(file.estimated_tokens)}
          </p>

          <p className="text-[11px] text-zinc-500">
            tokens
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3 text-xs">
        <div>
          <p className="text-zinc-500">Included</p>
          <p className="mt-1 font-medium text-zinc-300">
            {formatSize(file.characters)}
          </p>
        </div>

        <div>
          <p className="text-zinc-500">Original</p>
          <p className="mt-1 font-medium text-zinc-300">
            {formatSize(file.original_characters)}
          </p>
        </div>
      </div>
    </div>
  );
}

function BudgetCard({
  path,
  budget,
}: {
  path: string;
  budget: ContextBudget;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-zinc-800/30"
      >
        <div className="flex min-w-0 items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-200">
              {path}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {formatNumber(budget.total_estimated_tokens)} estimated tokens
              {" · "}
              {formatSize(budget.total_characters)}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-xs text-zinc-500">
          {budget.related_files.length} related
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-zinc-800 p-4">
          <FileBudgetRow
            file={budget.current_file}
            current
          />

          {budget.related_files.map((file) => (
            <FileBudgetRow
              key={file.path}
              file={file}
            />
          ))}

          {budget.dropped_files.length > 0 && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />

                <p className="text-xs font-medium text-yellow-400">
                  Dropped from this context
                </p>
              </div>

              <div className="mt-2 space-y-1">
                {budget.dropped_files.map((file) => (
                  <p
                    key={file}
                    className="truncate text-xs text-zinc-500"
                  >
                    {file}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PriorityRow({
  priority,
}: {
  priority: ContextPriority;
}) {
  const score = Math.min(
    100,
    Math.max(0, priority.score)
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-zinc-800 p-1.5">
          <FileCode2 className="h-4 w-4 text-zinc-400" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-zinc-200">
              {priority.path}
            </p>

            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getTierStyles(
                priority.tier
              )}`}
            >
              {priority.tier}
            </span>
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {priority.reason}
          </p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${getPriorityBarStyles(
                score
              )}`}
              style={{
                width: `${score}%`,
              }}
            />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold text-zinc-100">
            {score.toFixed(0)}
          </p>

          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            score
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-lg bg-zinc-900 p-2">
          <p className="text-[10px] text-zinc-600">Imports</p>
          <p className="mt-1 text-xs font-medium text-zinc-300">
            {priority.import_score.toFixed(0)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-900 p-2">
          <p className="text-[10px] text-zinc-600">Static</p>
          <p className="mt-1 text-xs font-medium text-zinc-300">
            {priority.static_finding_score.toFixed(0)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-900 p-2">
          <p className="text-[10px] text-zinc-600">Size</p>
          <p className="mt-1 text-xs font-medium text-zinc-300">
            {priority.size_score.toFixed(0)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-900 p-2">
          <p className="text-[10px] text-zinc-600">Language</p>
          <p className="mt-1 text-xs font-medium text-zinc-300">
            {priority.language_score.toFixed(0)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-900 p-2">
          <p className="text-[10px] text-zinc-600">Dependency</p>
          <p className="mt-1 text-xs font-medium text-zinc-300">
            {priority.dependency_score.toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ContextBudgetPanel({
  data,
}: ContextBudgetPanelProps) {
  const tokenPercent = Math.min(
    100,
    Math.round(
      (data.total_estimated_tokens /
        MAX_CONTEXT_TOKENS) *
        100
    )
  );

  const includedBudgetFiles = useMemo(() => {
    return Object.entries(data.budgets);
  }, [data.budgets]);

  const highPriorityCount = data.priorities.filter(
    (priority) => priority.tier === "high"
  ).length;

  const mediumPriorityCount = data.priorities.filter(
    (priority) => priority.tier === "medium"
  ).length;

  const lowPriorityCount = data.priorities.filter(
    (priority) => priority.tier === "low"
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
      <div className="border-b border-zinc-800 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2">
                <Zap className="h-5 w-5 text-purple-400" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Context Budget
                </h2>

                <p className="mt-0.5 text-sm text-zinc-500">
                  How repository context was prioritized and sent to the AI reviewer.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-400">
              {highPriorityCount} high
            </span>

            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
              {mediumPriorityCount} medium
            </span>

            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
              {lowPriorityCount} low
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Estimated tokens
            </p>

            <BarChart3 className="h-4 w-4 text-purple-400" />
          </div>

          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {formatNumber(data.total_estimated_tokens)}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            of {formatNumber(MAX_CONTEXT_TOKENS)} budget
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Characters
            </p>

            <FileCode2 className="h-4 w-4 text-blue-400" />
          </div>

          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {formatSize(data.total_characters)}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            included in AI context
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Files included
            </p>

            <Files className="h-4 w-4 text-emerald-400" />
          </div>

          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {formatNumber(data.files_included)}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            across review contexts
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Files dropped
            </p>

            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </div>

          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {formatNumber(data.files_dropped)}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            excluded from context
          </p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-300">
                Token utilization
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                {tokenPercent}% of the configured context token budget
              </p>
            </div>

            <p className="text-sm font-semibold text-zinc-200">
              {formatNumber(data.total_estimated_tokens)}
              {" / "}
              {formatNumber(MAX_CONTEXT_TOKENS)}
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${getProgressStyles(
                tokenPercent
              )}`}
              style={{
                width: `${tokenPercent}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 border-t border-zinc-800 p-5 xl:grid-cols-2">
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">
              File priorities
            </h3>

            <p className="mt-1 text-xs text-zinc-600">
              Files are ranked using imports, static findings, size,
              language risk, and dependency centrality.
            </p>
          </div>

          {data.priorities.length > 0 ? (
            <div className="space-y-3">
              {data.priorities.map((priority) => (
                <PriorityRow
                  key={priority.path}
                  priority={priority}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
              <p className="text-sm text-zinc-500">
                No file priority information available.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">
              Context allocation
            </h3>

            <p className="mt-1 text-xs text-zinc-600">
              Expand a reviewed file to see its current file, related
              files, truncation, and dropped context.
            </p>
          </div>

          {includedBudgetFiles.length > 0 ? (
            <div className="space-y-3">
              {includedBudgetFiles.map(
                ([path, budget]) => (
                  <BudgetCard
                    key={path}
                    path={path}
                    budget={budget}
                  />
                )
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
              <p className="text-sm text-zinc-500">
                No context allocation information available.
              </p>
            </div>
          )}
        </div>
      </div>

      {data.files_truncated > 0 && (
        <div className="border-t border-zinc-800 px-5 py-4">
          <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <Scissors className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />

            <div>
              <p className="text-sm font-medium text-yellow-400">
                {data.files_truncated} file
                {data.files_truncated === 1 ? "" : "s"} truncated
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Large files were shortened to stay within the configured
                character and token budgets. The current file receives
                priority over related files.
              </p>
            </div>
          </div>
        </div>
      )}

      {data.files_dropped > 0 && (
        <div className="border-t border-zinc-800 px-5 py-4">
          <div className="flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-orange-400">
                {data.files_dropped} file
                {data.files_dropped === 1 ? "" : "s"} dropped
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                These files were excluded because of priority limits or
                the available context budget.
              </p>

              <div className="mt-3 space-y-1">
                {Array.from(
                  new Set(
                    Object.values(data.budgets).flatMap(
                      (budget) => budget.dropped_files
                    )
                  )
                ).map((file) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 text-xs text-zinc-500"
                  >
                    <ChevronRight className="h-3 w-3 shrink-0 text-zinc-700" />

                    <span className="truncate">
                      {file}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
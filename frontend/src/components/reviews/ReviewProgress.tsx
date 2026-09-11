"use client";

import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
} from "lucide-react";

interface ReviewProgressProps {
  status: string;
  error?: string | null;
  startedAt?: string | null;
}

interface ReviewStage {
  key: string;
  label: string;
  description: string;
}

const stages: ReviewStage[] = [
  {
    key: "queued",
    label: "Queued",
    description: "Review is waiting to start",
  },
  {
    key: "running",
    label: "Analyzing code",
    description: "Running static analysis and code checks",
  },
  {
    key: "ai",
    label: "AI review",
    description: "AI is reviewing the changed code",
  },
  {
    key: "completed",
    label: "Completed",
    description: "Review report is ready",
  },
];

function getStageIndex(status: string): number {
  switch (status.toLowerCase()) {
    case "queued":
      return 0;

    case "running":
      return 1;

    case "ai":
      return 2;

    case "completed":
      return 3;

    default:
      return 1;
  }
}

function formatElapsed(
  startedAt: string | null | undefined
): string | null {
  if (!startedAt) {
    return null;
  }

  const started = new Date(startedAt).getTime();

  if (Number.isNaN(started)) {
    return null;
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - started) / 1000)
  );

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

export default function ReviewProgress({
  status,
  error,
  startedAt,
}: ReviewProgressProps) {
  const normalizedStatus = status.toLowerCase();

  const isFailed =
    normalizedStatus === "failed" ||
    normalizedStatus === "error";

  const isCompleted =
    normalizedStatus === "completed";

  const currentStage =
    getStageIndex(normalizedStatus);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0f16] p-5 shadow-2xl">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isFailed ? (
              <XCircle className="h-5 w-5 text-red-400" />
            ) : isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            )}

            <h3 className="text-sm font-semibold text-white">
              {isFailed
                ? "Review failed"
                : isCompleted
                  ? "Review completed"
                  : "AI review in progress"}
            </h3>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            {isFailed
              ? "The review could not be completed."
              : isCompleted
                ? "Your code review report is ready."
                : "CodeGuard is analyzing your pull request."}
          </p>
        </div>

        {!isFailed && !isCompleted && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
            {formatElapsed(startedAt) ?? "Running"}
          </div>
        )}
      </div>

      {/* Failed state */}
      {isFailed ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-xs font-medium text-red-300">
            Review error
          </div>

          <p className="mt-1 break-words text-xs leading-5 text-red-200/70">
            {error || "An unexpected error occurred."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const completed =
              isCompleted ||
              index < currentStage;

            const active =
              !isCompleted &&
              index === currentStage;

            return (
              <div
                key={stage.key}
                className="relative flex items-center gap-3"
              >
                {/* Connector */}
                {index < stages.length - 1 && (
                  <div
                    className={`absolute left-[15px] top-8 h-7 w-px ${
                      completed
                        ? "bg-emerald-500/50"
                        : "bg-white/10"
                    }`}
                  />
                )}

                {/* Stage indicator */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    completed
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : active
                        ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                        : "border-white/10 bg-white/[0.03] text-slate-600"
                  }`}
                >
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>

                {/* Stage information */}
                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      completed
                        ? "text-emerald-300"
                        : active
                          ? "text-white"
                          : "text-slate-600"
                    }`}
                  >
                    {stage.label}
                  </div>

                  <div
                    className={`text-xs ${
                      active || completed
                        ? "text-slate-400"
                        : "text-slate-700"
                    }`}
                  >
                    {stage.description}
                  </div>
                </div>

                {/* Active indicator */}
                {active && (
                  <div className="ml-auto text-[10px] uppercase tracking-wider text-violet-400">
                    Active
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      {!isFailed && !isCompleted && (
        <div className="mt-5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-1 rounded-full bg-violet-500 transition-all duration-700"
            style={{
              width: `${Math.min(
                95,
                ((currentStage + 1) /
                  stages.length) *
                  100
              )}%`,
            }}
          />
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          All review stages completed successfully.
        </div>
      )}
    </div>
  );
}
"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Code2,
  FileCode2,
  GitPullRequest,
  Info,
  Loader2,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getReview,
  ReviewFinding,
  ReviewRunResponse,
} from "@/lib/api";

interface ApiErrorResponse {
  detail?: unknown;
  message?: unknown;
}

const cardClass =
  "rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-2xl shadow-black/20 backdrop-blur-xl";

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[#050506]" />

      <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-[150px]" />

      <div className="absolute right-0 top-[30%] h-[550px] w-[550px] rounded-full bg-cyan-500/[0.045] blur-[150px]" />

      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-fuchsia-600/[0.035] blur-[150px]" />

      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050506] text-white">
      <Background />

      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
        </div>

        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-300">
            Review intelligence
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Loading review...
          </p>
        </div>
      </div>
    </main>
  );
}

function ErrorScreen({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] text-white">
      <Background />

      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.05] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
              <XCircle className="h-5 w-5 text-rose-400" />
            </div>

            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rose-300/70">
                Review error
              </p>

              <h1 className="mt-2 text-lg font-semibold text-white">
                Unable to load review
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (typeof error !== "object" || error === null) {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }

  const axiosLikeError = error as {
    response?: {
      status?: number;
      data?: unknown;
    };
    message?: string;
  };

  const responseData =
    axiosLikeError.response?.data as
      | ApiErrorResponse
      | undefined;

  const detail =
    responseData?.detail ?? responseData?.message;

  if (Array.isArray(detail)) {
    const firstError = detail[0];

    if (
      typeof firstError === "object" &&
      firstError !== null &&
      "msg" in firstError
    ) {
      const message = (
        firstError as { msg?: unknown }
      ).msg;

      if (message !== undefined && message !== null) {
        return String(message);
      }
    }

    return fallback;
  }

  if (
    detail !== undefined &&
    detail !== null &&
    detail !== ""
  ) {
    return String(detail);
  }

  if (axiosLikeError.message) {
    return axiosLikeError.message;
  }

  return fallback;
}

function scoreClass(score: number): string {
  if (score >= 90) {
    return "text-emerald-300";
  }

  if (score >= 75) {
    return "text-amber-300";
  }

  if (score >= 50) {
    return "text-orange-300";
  }

  return "text-rose-300";
}

function scoreGlowClass(score: number): string {
  if (score >= 90) {
    return "bg-emerald-500/[0.08]";
  }

  if (score >= 75) {
    return "bg-amber-500/[0.08]";
  }

  if (score >= 50) {
    return "bg-orange-500/[0.08]";
  }

  return "bg-rose-500/[0.08]";
}

function severityClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";

    case "high":
      return "border-orange-500/20 bg-orange-500/10 text-orange-300";

    case "medium":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";

    case "low":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";

    default:
      return "border-white/[0.08] bg-white/[0.04] text-zinc-400";
  }
}

function severityIcon(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return <ShieldAlert className="h-4 w-4" />;

    case "high":
      return <AlertCircle className="h-4 w-4" />;

    case "medium":
      return <AlertTriangle className="h-4 w-4" />;

    default:
      return <Info className="h-4 w-4" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (normalized === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5" />
        Partial
      </span>
    );
  }

  if (normalized === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300">
        <XCircle className="h-3.5 w-3.5" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
      <Clock3 className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent = "violet",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "violet" | "cyan" | "emerald" | "rose";
}) {
  const accentClasses = {
    violet: {
      glow: "bg-violet-500/10",
      icon: "border-violet-400/15 bg-violet-500/10 text-violet-300",
    },
    cyan: {
      glow: "bg-cyan-500/10",
      icon: "border-cyan-400/15 bg-cyan-500/10 text-cyan-300",
    },
    emerald: {
      glow: "bg-emerald-500/10",
      icon: "border-emerald-400/15 bg-emerald-500/10 text-emerald-300",
    },
    rose: {
      glow: "bg-rose-500/10",
      icon: "border-rose-400/15 bg-rose-500/10 text-rose-300",
    },
  };

  const colors = accentClasses[accent];

  return (
    <div
      className={`${cardClass} group relative overflow-hidden p-5 transition duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${colors.glow}`}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
            {label}
          </span>

          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${colors.icon}`}
          >
            {icon}
          </div>
        </div>

        <div className="mt-5 text-2xl font-semibold tracking-tight text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

function FindingCard({
  finding,
}: {
  finding: ReviewFinding;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-xl shadow-black/10 backdrop-blur-xl transition hover:border-white/[0.1]">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="w-full p-5 text-left transition hover:bg-white/[0.025] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${severityClass(
                finding.severity,
              )}`}
            >
              {severityIcon(finding.severity)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-wider ${severityClass(
                    finding.severity,
                  )}`}
                >
                  {finding.severity}
                </span>

                <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] text-zinc-500">
                  {finding.category}
                </span>
              </div>

              <h3 className="mt-3 text-sm font-semibold leading-6 text-white">
                {finding.title}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5" />
                  {finding.file}
                </span>

                <span className="text-zinc-800">•</span>

                <span>Line {finding.line}</span>
              </div>
            </div>
          </div>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-600 transition group-hover:text-zinc-400">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] p-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-violet-400" />

                <h4 className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-300/70">
                  Description
                </h4>
              </div>

              <p className="text-sm leading-7 text-zinc-400">
                {finding.description}
              </p>
            </div>

            {finding.why_it_matters && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-amber-400" />

                  <h4 className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-300/70">
                    Why it matters
                  </h4>
                </div>

                <p className="text-sm leading-7 text-zinc-400">
                  {finding.why_it_matters}
                </p>
              </div>
            )}

            {finding.suggested_fix && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />

                  <h4 className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">
                    Suggested fix
                  </h4>
                </div>

                <p className="text-sm leading-7 text-zinc-400">
                  {finding.suggested_fix}
                </p>
              </div>
            )}

            {finding.fixed_code && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-cyan-400" />

                    <h4 className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
                      Suggested code
                    </h4>
                  </div>

                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-700">
                    Patch
                  </span>
                </div>

                <pre className="overflow-x-auto rounded-xl border border-white/[0.07] bg-black/40 p-4 text-xs leading-6 text-zinc-300 shadow-inner">
                  <code>{finding.fixed_code}</code>
                </pre>
              </div>
            )}

            {finding.confidence !== null &&
              finding.confidence !== undefined && (
                <div className="flex items-center gap-2 rounded-xl border border-violet-400/10 bg-violet-500/[0.04] px-4 py-3 text-xs text-zinc-500">
                  <Sparkles className="h-3.5 w-3.5 text-violet-300" />

                  <span>AI confidence</span>

                  <span className="font-semibold text-violet-200">
                    {Math.round(finding.confidence * 100)}%
                  </span>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

function FindingsSection({
  findings,
}: {
  findings: ReviewFinding[];
}) {
  const counts = useMemo(() => {
    return {
      critical: findings.filter(
        (item) =>
          item.severity.toLowerCase() === "critical",
      ).length,

      high: findings.filter(
        (item) =>
          item.severity.toLowerCase() === "high",
      ).length,

      medium: findings.filter(
        (item) =>
          item.severity.toLowerCase() === "medium",
      ).length,

      low: findings.filter(
        (item) =>
          item.severity.toLowerCase() === "low",
      ).length,
    };
  }, [findings]);

  return (
    <section>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-rose-400" />

            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-rose-300">
              Static + AI analysis
            </span>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-white">
            Findings
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            Issues identified during this review.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(counts).map(
            ([severity, count]) => (
              <span
                key={severity}
                className={`rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider ${severityClass(
                  severity,
                )}`}
              >
                {severity}: {count}
              </span>
            ),
          )}
        </div>
      </div>

      {findings.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-8 text-center shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-white">
            No issues found
          </h3>

          <p className="mt-2 text-sm text-zinc-600">
            CodeGuard did not identify any issues in this review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {findings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ContextBudgetSection({
  contextBudget,
}: {
  contextBudget: ReviewRunResponse["context_budget"];
}) {
  if (!contextBudget) {
    return null;
  }

  return (
    <section>
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-cyan-400" />

          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">
            Repository intelligence
          </span>
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-white">
          AI Context Budget
        </h2>

        <p className="mt-1 text-sm text-zinc-600">
          How CodeGuard prioritized source files for AI analysis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Estimated tokens"
          value={contextBudget.total_estimated_tokens.toLocaleString()}
          icon={<Code2 className="h-4 w-4" />}
          accent="violet"
        />

        <StatCard
          label="Characters"
          value={contextBudget.total_characters.toLocaleString()}
          icon={<FileCode2 className="h-4 w-4" />}
          accent="cyan"
        />

        <StatCard
          label="Files included"
          value={contextBudget.files_included}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="emerald"
        />

        <StatCard
          label="Files dropped"
          value={contextBudget.files_dropped}
          icon={<XCircle className="h-4 w-4" />}
          accent="rose"
        />
      </div>

      {contextBudget.priorities.length > 0 && (
        <div className={`${cardClass} mt-4 overflow-hidden`}>
          <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                File priorities
              </h3>

              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-700">
                Context ranking
              </span>
            </div>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {contextBudget.priorities.map(
              (priority) => (
                <div
                  key={priority.path}
                  className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between md:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025]">
                        <FileCode2 className="h-3.5 w-3.5 text-cyan-300" />
                      </div>

                      <span className="truncate text-sm text-zinc-200">
                        {priority.path}
                      </span>
                    </div>

                    <p className="mt-2 pl-10 text-xs leading-5 text-zinc-600">
                      {priority.reason}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-10 md:pl-0">
                    <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                      {priority.tier}
                    </span>

                    <span className="font-mono text-sm font-semibold text-white">
                      {priority.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawReviewId = params.reviewId;

  const reviewId = Number(
    Array.isArray(rawReviewId)
      ? rawReviewId[0]
      : rawReviewId,
  );

  const [data, setData] =
    useState<ReviewRunResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadReview = useCallback(async () => {
    if (
      !Number.isInteger(reviewId) ||
      reviewId <= 0
    ) {
      setError("Invalid review ID.");
      setLoading(false);
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getReview(reviewId);

      setData(response);
    } catch (requestError: unknown) {
      console.error(
        "Failed to load review:",
        requestError,
      );

      const errorWithResponse =
        typeof requestError === "object" &&
        requestError !== null
          ? (requestError as {
              response?: {
                status?: number;
              };
            })
          : null;

      const status =
        errorWithResponse?.response?.status;

      if (status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }

      if (status === 404) {
        setError("Review not found.");
      } else {
        setError(
          getApiErrorMessage(
            requestError,
            "Failed to load review.",
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [reviewId, router]);

  useEffect(() => {
    void loadReview();
  }, [loadReview]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !data) {
    return (
      <ErrorScreen
        message={
          error ?? "Review data is unavailable."
        }
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  const { review } = data;

  const createdDate = new Date(
    review.created_at,
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] text-white">
      <Background />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="group mb-7 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to dashboard
          </button>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5">
                  <GitPullRequest className="h-3.5 w-3.5 text-violet-300" />

                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-500">
                    Review #{review.id}
                  </span>
                </div>

                <StatusBadge status={review.status} />
              </div>

              <div className="mt-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />

                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-violet-300">
                  Review intelligence
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                CodeGuard Review
              </h1>

              {review.summary && (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-500 sm:text-base">
                  {review.summary}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-wide text-zinc-700">
                <span>
                  Created {createdDate.toLocaleString()}
                </span>

                <span className="hidden text-zinc-900 sm:inline">
                  •
                </span>

                <span>
                  PR #{review.pull_request_id}
                </span>

                <span className="hidden text-zinc-900 sm:inline">
                  •
                </span>

                <span>
                  Repository #{review.repository_id}
                </span>
              </div>
            </div>

            {/* Score */}
            <div
              className={`${cardClass} relative min-w-[220px] overflow-hidden px-8 py-7 text-center`}
            >
              <div
                className={`pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full blur-3xl ${scoreGlowClass(
                  review.score,
                )}`}
              />

              <div className="relative">
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                  Review Score
                </div>

                <div
                  className={`mt-2 text-5xl font-semibold tracking-tight ${scoreClass(
                    review.score,
                  )}`}
                >
                  {review.score.toFixed(1)}
                </div>

                <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-700">
                  Out of 100
                </div>

                <div className="mx-auto mt-5 h-1.5 max-w-[150px] overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      review.score >= 90
                        ? "bg-emerald-400"
                        : review.score >= 75
                          ? "bg-amber-400"
                          : review.score >= 50
                            ? "bg-orange-400"
                            : "bg-rose-400"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.max(review.score, 0),
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Files analyzed"
            value={data.files_analyzed}
            icon={
              <FileCode2 className="h-4 w-4" />
            }
            accent="violet"
          />

          <StatCard
            label="Files failed"
            value={data.files_failed}
            icon={
              <XCircle className="h-4 w-4" />
            }
            accent="rose"
          />

          <StatCard
            label="AI findings"
            value={data.ai_findings}
            icon={
              <Sparkles className="h-4 w-4" />
            }
            accent="cyan"
          />

          <StatCard
            label="Static findings"
            value={data.static_findings}
            icon={<Bug className="h-4 w-4" />}
            accent="emerald"
          />
        </section>

        {/* Review pipeline indicator */}
        <section className="mb-12">
          <div className={`${cardClass} overflow-hidden`}>
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />

                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300">
                    Analysis pipeline
                  </span>
                </div>

                <p className="text-sm text-zinc-500">
                  Repository context processed through static
                  analysis and AI reasoning.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-wider">
                <span className="rounded-lg border border-violet-400/10 bg-violet-500/[0.05] px-3 py-2 text-violet-300">
                  Source
                </span>

                <ArrowRight className="h-3 w-3 text-zinc-700" />

                <span className="rounded-lg border border-cyan-400/10 bg-cyan-500/[0.05] px-3 py-2 text-cyan-300">
                  Context
                </span>

                <ArrowRight className="h-3 w-3 text-zinc-700" />

                <span className="rounded-lg border border-amber-400/10 bg-amber-500/[0.05] px-3 py-2 text-amber-300">
                  Analysis
                </span>

                <ArrowRight className="h-3 w-3 text-zinc-700" />

                <span className="rounded-lg border border-emerald-400/10 bg-emerald-500/[0.05] px-3 py-2 text-emerald-300">
                  Findings
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Findings */}
        <div className="space-y-14">
          <FindingsSection findings={data.findings} />

          <ContextBudgetSection
            contextBudget={data.context_budget}
          />
        </div>

        {/* Footer status */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/[0.05] pt-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
              Review analysis complete
            </span>
          </div>

          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-800">
            AI · Static Analysis · Repository Context
          </div>
        </div>
      </div>
    </main>
  );
}
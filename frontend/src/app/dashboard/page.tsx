"use client";

import axios from "axios";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Code2,
  GitBranch,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa";

import api from "@/lib/api";

interface GitHubStatus {
  connected: boolean;
  username?: string | null;
  avatar_url?: string | null;
  repositories_count?: number;
}

interface Repository {
  id: number;
  name: string;
  full_name?: string;
  description?: string | null;
  private?: boolean;
  language?: string | null;
  html_url?: string | null;
  updated_at?: string | null;
}

interface DashboardStats {
  average_score: number;
  total_reviews: number;
  critical_findings: number;
  total_findings: number;
}

interface ReviewTrend {
  date: string;
  score: number;
}

interface FindingSeverity {
  severity: string;
  count: number;
}

interface RecentReview {
  id: number;
  repository_id?: number | null;
  pull_request_id?: number | null;
  pull_request_number?: number | null;
  repository_name?: string | null;
  score?: number | null;
  status: string;
  summary?: string | null;
  created_at: string;
  updated_at?: string | null;
}

interface DashboardData {
  stats?: DashboardStats;
  review_trend?: ReviewTrend[];
  findings_by_severity?: FindingSeverity[];
  recent_reviews?: RecentReview[];
}

interface ApiErrorResponse {
  detail?: unknown;
  message?: unknown;
}

const cardClass =
  "rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-2xl shadow-black/20 backdrop-blur-xl";

const formatDate = (date: string) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatScore = (score?: number | null) => {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return "—";
  }

  return `${Math.round(score)}%`;
};

const getStatusIcon = (status: string) => {
  const normalized = status?.toLowerCase();

  if (normalized === "completed" || normalized === "success") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }

  if (normalized === "failed" || normalized === "error") {
    return <XCircle className="h-4 w-4 text-rose-400" />;
  }

  if (
    normalized === "queued" ||
    normalized === "pending" ||
    normalized === "running" ||
    normalized === "processing" ||
    normalized === "analyzing" ||
    normalized === "ai"
  ) {
    return <Clock3 className="h-4 w-4 text-amber-400" />;
  }

  return <Activity className="h-4 w-4 text-zinc-500" />;
};

const getStatusLabel = (status: string) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getSeverityClass = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20";
    case "low":
      return "bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-500/20";
    default:
      return "bg-white/[0.05] text-zinc-300 ring-1 ring-inset ring-white/[0.08]";
  }
};

const getSeverityBarClass = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-rose-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-amber-400";
    case "low":
      return "bg-cyan-400";
    default:
      return "bg-zinc-500";
  }
};

const getScoreClass = (score?: number | null) => {
  if (score === null || score === undefined) {
    return "text-zinc-500";
  }

  if (score >= 80) {
    return "text-emerald-300";
  }

  if (score >= 60) {
    return "text-amber-300";
  }

  return "text-rose-300";
};

const extractFindingsCount = (summary?: string | null) => {
  if (!summary) {
    return null;
  }

  const match = summary.match(/found\s+(\d+)\s+issues?/i);

  return match ? Number(match[1]) : null;
};

const extractAiFindings = (summary?: string | null) => {
  if (!summary) {
    return null;
  }

  const match = summary.match(/`(\d+)\s+AI,\s*(\d+)\s+static`/i);

  if (!match) {
    return null;
  }

  return {
    ai: Number(match[1]),
    static: Number(match[2]),
  };
};

export default function DashboardPage() {
  const router = useRouter();

  const [github, setGithub] = useState<GitHubStatus | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [
          githubResponse,
          repositoryResponse,
          dashboardResponse,
        ] = await Promise.all([
          api.get<GitHubStatus>("/github/status"),
          api.get<{ repositories?: Repository[] }>(
            "/github/repositories",
          ),
          api.get<DashboardData>("/dashboard/"),
        ]);

        setGithub(githubResponse.data);
        setRepositories(repositoryResponse.data?.repositories ?? []);
        setDashboard(dashboardResponse.data);
      } catch (error: unknown) {
        console.error("Dashboard loading failed:", error);

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            localStorage.removeItem("access_token");
            router.replace("/login");
            return;
          }

          const responseData = error.response?.data as
            | ApiErrorResponse
            | undefined;

          const detail =
            responseData?.detail ?? responseData?.message;

          setError(
            detail
              ? String(detail)
              : error.message || "Failed to load dashboard data.",
          );

          return;
        }

        if (error instanceof Error) {
          setError(
            error.message || "Failed to load dashboard data.",
          );
          return;
        }

        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats;
  const recentReviews = dashboard?.recent_reviews ?? [];
  const severityData = dashboard?.findings_by_severity ?? [];
  const trendData = dashboard?.review_trend ?? [];

  const totalRepositories = repositories.length;
  const totalReviews = stats?.total_reviews ?? recentReviews.length;
  const averageScore = stats?.average_score ?? null;
  const totalFindings = stats?.total_findings ?? 0;
  const criticalFindings = stats?.critical_findings ?? 0;

  const completedReviews = recentReviews.filter(
    (review) => review.status?.toLowerCase() === "completed",
  ).length;

  const failedReviews = recentReviews.filter((review) => {
    const status = review.status?.toLowerCase();

    return status === "failed" || status === "error";
  }).length;

  const pendingReviews = recentReviews.filter((review) => {
    const status = review.status?.toLowerCase();

    return (
      status === "queued" ||
      status === "pending" ||
      status === "running" ||
      status === "processing" ||
      status === "analyzing"
    );
  }).length;

  const highFindings =
    severityData.find(
      (item) => item.severity?.toLowerCase() === "high",
    )?.count ?? 0;

  const mediumFindings =
    severityData.find(
      (item) => item.severity?.toLowerCase() === "medium",
    )?.count ?? 0;

  const lowFindings =
    severityData.find(
      (item) => item.severity?.toLowerCase() === "low",
    )?.count ?? 0;

  const maxTrendScore = Math.max(
    ...trendData.map((item) => item.score),
    1,
  );

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050506] text-white">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[#050506]" />

          <div className="absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-[150px]" />

          <div className="absolute right-0 top-[35%] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[150px]" />

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            </div>

            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-300">
                Initializing
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Loading review intelligence...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] text-white">
      {/* Background */}
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

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />

                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-300/80">
                  Command center · Review intelligence
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Monitor your repositories, code reviews, and security
                findings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {github?.connected && (
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 backdrop-blur-xl">
                  <FaGithub className="h-4 w-4 text-white" />

                  <span className="max-w-[140px] truncate text-sm text-zinc-300">
                    {github.username ?? "GitHub"}
                  </span>

                  <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                    Connected
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin text-violet-400"
                      : "text-zinc-500 group-hover:text-violet-300"
                  }`}
                />

                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                </div>

                <div>
                  <p className="text-sm font-medium text-rose-200">
                    Unable to load dashboard
                  </p>

                  <p className="mt-1 text-sm text-rose-300/70">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15"
              >
                Retry
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* GitHub Connection */}
        {!github?.connected && (
          <section className="relative mb-6 overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20">
                  <FaGithub className="h-5 w-5 text-white" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-white">
                      Connect GitHub
                    </h2>

                    <span className="rounded-full bg-violet-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-violet-300 ring-1 ring-inset ring-violet-400/20">
                      Required
                    </span>
                  </div>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
                    Connect your GitHub account to import repositories and
                    run automated AI code reviews.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/settings")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                <FaGithub className="h-4 w-4" />
                Connect GitHub
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Repositories */}
          <div
            className={`${cardClass} group relative overflow-hidden p-5 transition duration-300 hover:border-violet-400/20 hover:bg-white/[0.04]`}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/15" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10">
                  <GitBranch className="h-4 w-4 text-violet-300" />
                </div>

                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                  Repositories
                </span>
              </div>

              <p className="text-3xl font-semibold tracking-tight text-white">
                {totalRepositories}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Connected repositories
              </p>
            </div>
          </div>

          {/* Reviews */}
          <div
            className={`${cardClass} group relative overflow-hidden p-5 transition duration-300 hover:border-cyan-400/20 hover:bg-white/[0.04]`}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl transition group-hover:bg-cyan-500/15" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-500/10">
                  <Code2 className="h-4 w-4 text-cyan-300" />
                </div>

                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                  Total reviews
                </span>
              </div>

              <p className="text-3xl font-semibold tracking-tight text-white">
                {totalReviews}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Automated code reviews
              </p>
            </div>
          </div>

          {/* Score */}
          <div
            className={`${cardClass} group relative overflow-hidden p-5 transition duration-300 hover:border-emerald-400/20 hover:bg-white/[0.04]`}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl transition group-hover:bg-emerald-500/15" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                </div>

                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                  Avg score
                </span>
              </div>

              <p
                className={`text-3xl font-semibold tracking-tight ${getScoreClass(
                  averageScore,
                )}`}
              >
                {formatScore(averageScore)}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Overall code quality
              </p>
            </div>
          </div>

          {/* Findings */}
          <div
            className={`${cardClass} group relative overflow-hidden p-5 transition duration-300 hover:border-rose-400/20 hover:bg-white/[0.04]`}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-500/10 blur-3xl transition group-hover:bg-rose-500/15" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/15 bg-rose-500/10">
                  <AlertCircle className="h-4 w-4 text-rose-300" />
                </div>

                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                  Findings
                </span>
              </div>

              <p className="text-3xl font-semibold tracking-tight text-white">
                {totalFindings}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {criticalFindings} critical findings
              </p>
            </div>
          </div>
        </section>

        {/* Main analytics */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Recent Reviews */}
          <div className={`${cardClass} xl:col-span-2`}>
            <div className="flex items-center justify-between border-b border-white/[0.06] p-5 sm:p-6">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-violet-400" />

                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-violet-300">
                    Review stream
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-white">
                  Recent Reviews
                </h2>
              </div>

              <button
                type="button"
                onClick={() => router.push("/reviews")}
                className="group inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-white"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {recentReviews.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                  <Code2 className="h-5 w-5 text-zinc-500" />
                </div>

                <h3 className="mt-4 text-sm font-medium text-white">
                  No reviews yet
                </h3>

                <p className="mt-1 max-w-sm text-sm text-zinc-600">
                  Your latest code reviews will appear here once analysis
                  begins.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {recentReviews.map((review) => {
                  const findings =
                    extractFindingsCount(review.summary);

                  const aiFindings = extractAiFindings(
                    review.summary,
                  );

                  return (
                    <button
                      key={review.id}
                      type="button"
                      onClick={() =>
                        router.push(`/reviews/${review.id}`)
                      }
                      className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.025] sm:px-6"
                    >
                      <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] sm:flex">
                        {getStatusIcon(review.status)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {review.repository_name ||
                              "Unknown repository"}
                          </span>

                          {review.pull_request_number && (
                            <span className="rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                              PR #{review.pull_request_number}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-400">
                            {getStatusIcon(review.status)}
                            {getStatusLabel(review.status)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wide text-zinc-600">
                          <span>{formatDate(review.created_at)}</span>

                          {findings !== null && (
                            <span>{findings} findings</span>
                          )}

                          {aiFindings && (
                            <span>
                              {aiFindings.ai} AI ·{" "}
                              {aiFindings.static} static
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`text-base font-semibold ${getScoreClass(
                            review.score,
                          )}`}
                        >
                          {formatScore(review.score)}
                        </span>

                        <ArrowRight className="h-4 w-4 text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Finding Severity */}
          <div className={cardClass}>
            <div className="border-b border-white/[0.06] p-5 sm:p-6">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-rose-400" />

                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-rose-300">
                  Risk distribution
                </span>
              </div>

              <h2 className="text-lg font-semibold text-white">
                Finding Severity
              </h2>
            </div>

            {severityData.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-500/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </div>

                <h3 className="mt-4 text-sm font-medium text-white">
                  No findings
                </h3>

                <p className="mt-1 text-sm text-zinc-600">
                  Severity data will appear after reviews are analyzed.
                </p>
              </div>
            ) : (
              <div className="space-y-6 p-5 sm:p-6">
                {severityData.map((item) => {
                  const percentage =
                    totalFindings > 0
                      ? Math.round(
                          (item.count / totalFindings) * 100,
                        )
                      : 0;

                  return (
                    <div key={item.severity}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${getSeverityClass(
                              item.severity,
                            )}`}
                          >
                            {item.severity}
                          </span>
                        </div>

                        <span className="font-mono text-xs text-zinc-500">
                          {item.count}
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className={`h-full rounded-full transition-all ${getSeverityBarClass(
                            item.severity,
                          )}`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <div className="mt-1.5 text-right font-mono text-[9px] text-zinc-700">
                        {percentage}%
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-white/[0.06] pt-5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-rose-500/10 bg-rose-500/[0.04] p-3">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-rose-300/60">
                        Critical
                      </p>
                      <p className="mt-1 text-lg font-semibold text-rose-300">
                        {criticalFindings}
                      </p>
                    </div>

                    <div className="rounded-xl border border-orange-500/10 bg-orange-500/[0.04] p-3">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-orange-300/60">
                        High
                      </p>
                      <p className="mt-1 text-lg font-semibold text-orange-300">
                        {highFindings}
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-3">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-amber-300/60">
                        Medium
                      </p>
                      <p className="mt-1 text-lg font-semibold text-amber-300">
                        {mediumFindings}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.04] p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-cyan-300/60">
                        Low
                      </p>

                      <p className="text-lg font-semibold text-cyan-300">
                        {lowFindings}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Review Activity */}
        <section className={`${cardClass} mt-6`}>
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-cyan-400" />

                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">
                  Quality telemetry
                </span>
              </div>

              <h2 className="text-lg font-semibold text-white">
                Review Activity
              </h2>
            </div>

            {trendData.length > 0 && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                Score trend
              </div>
            )}
          </div>

          {trendData.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <TrendingUp className="h-5 w-5 text-zinc-500" />
              </div>

              <h3 className="mt-4 text-sm font-medium text-white">
                No activity yet
              </h3>

              <p className="mt-1 text-sm text-zinc-600">
                Review score history will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto p-5 sm:p-6">
              <div className="flex min-w-[620px] items-end gap-3">
                {trendData.map((item, index) => {
                  const height =
                    Math.max(
                      (item.score / maxTrendScore) * 180,
                      8,
                    );

                  return (
                    <div
                      key={`${item.date}-${index}`}
                      className="group flex min-w-[42px] flex-1 flex-col items-center gap-3"
                    >
                      <div className="relative flex h-[190px] w-full items-end justify-center">
                        <div
                          className="w-full max-w-8 rounded-t-lg bg-gradient-to-t from-violet-600/70 to-cyan-400 transition-all duration-300 group-hover:from-violet-500 group-hover:to-cyan-300"
                          style={{
                            height: `${height}px`,
                          }}
                        />

                        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-[#0b0b0e] px-2 py-1 font-mono text-[9px] text-white opacity-0 shadow-xl transition group-hover:opacity-100">
                          {Math.round(item.score)}%
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="font-mono text-[9px] uppercase tracking-wide text-zinc-600">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Repositories */}
        <section className={`${cardClass} mt-6`}>
          <div className="flex items-center justify-between border-b border-white/[0.06] p-5 sm:p-6">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-violet-400" />

                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-violet-300">
                  Source control
                </span>
              </div>

              <h2 className="text-lg font-semibold text-white">
                Repositories
              </h2>
            </div>

            <button
              type="button"
              onClick={() => router.push("/repositories")}
              className="group inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-white"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {repositories.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <GitBranch className="h-5 w-5 text-zinc-500" />
              </div>

              <h3 className="mt-4 text-sm font-medium text-white">
                No repositories
              </h3>

              <p className="mt-1 max-w-sm text-sm text-zinc-600">
                Connect GitHub and import repositories to start reviewing
                code.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-white/[0.06] md:grid-cols-2 md:divide-x md:divide-y-0">
              {repositories.slice(0, 6).map((repository) => (
                <button
                  key={repository.id}
                  type="button"
                  onClick={() =>
                    router.push(`/repositories/${repository.id}`)
                  }
                  className="group flex min-w-0 items-center gap-4 p-5 text-left transition hover:bg-white/[0.025] sm:p-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
                    <GitBranch className="h-4 w-4 text-violet-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {repository.name}
                      </span>

                      {repository.private && (
                        <span className="rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-zinc-500">
                          Private
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate font-mono text-[10px] text-zinc-600">
                      {repository.full_name ||
                        repository.name}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      {repository.language && (
                        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-500">
                          {repository.language}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Review Status */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Completed */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5 backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                </div>

                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-300/50">
                  Status 01
                </span>
              </div>

              <p className="mt-5 text-2xl font-semibold text-emerald-200">
                {completedReviews}
              </p>

              <p className="mt-1 text-sm text-emerald-300/50">
                Completed reviews
              </p>
            </div>
          </div>

          {/* Pending */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-5 backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <Clock3 className="h-4 w-4 text-amber-300" />
                </div>

                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-300/50">
                  Status 02
                </span>
              </div>

              <p className="mt-5 text-2xl font-semibold text-amber-200">
                {pendingReviews}
              </p>

              <p className="mt-1 text-sm text-amber-300/50">
                Pending reviews
              </p>
            </div>
          </div>

          {/* Failed */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/15 bg-rose-500/[0.04] p-5 backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10">
                  <XCircle className="h-4 w-4 text-rose-300" />
                </div>

                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-rose-300/50">
                  Status 03
                </span>
              </div>

              <p className="mt-5 text-2xl font-semibold text-rose-200">
                {failedReviews}
              </p>

              <p className="mt-1 text-sm text-rose-300/50">
                Failed reviews
              </p>
            </div>
          </div>
        </section>

        {/* Footer status */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.05] pt-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
              ReviewAI systems operational
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
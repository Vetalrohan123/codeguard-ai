"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCode2,
  GitBranch,
  Loader2,
  LogOut,
  Play,
  Sparkles,
} from "lucide-react";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
  getPullRequest,
  getPullRequestFiles,
  getReview,
  getReviewJob,
  runAsyncReview,
  type PullRequest,
  type PullRequestFile,
  type ReviewRunResponse,
  type ReviewFinding,
} from "@/lib/api";

import ContextBudgetPanel from "@/components/reviews/ContextBudgetPanel";
import ReviewProgress from "@/components/reviews/ReviewProgress";

/* ==========================================================================
   Page Types
   ========================================================================== */

interface PageProps {
  params: Promise<{
    repositoryId: string;
    pullNumber: string;
  }>;
}

interface Repository {
  id: number;
  owner: string;
  name: string;
  full_name: string;
  private: boolean;
  language: string | null;
  html_url: string | null;
  default_branch: string;
}

interface RepositoriesResponse {
  repositories?: Repository[];
}

interface ApiErrorResponse {
  detail?: unknown;
  message?: unknown;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const REVIEW_POLL_INTERVAL = 2000;
const REVIEW_MAX_POLL_ATTEMPTS = 300;

const severityStyles: Record<string, string> = {
  critical:
    "border-red-500/25 bg-red-500/[0.07] text-red-300",

  high:
    "border-orange-500/25 bg-orange-500/[0.07] text-orange-300",

  medium:
    "border-yellow-500/25 bg-yellow-500/[0.07] text-yellow-300",

  low:
    "border-blue-500/25 bg-blue-500/[0.07] text-blue-300",
};

const severityDotStyles: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-blue-400",
};

/* ==========================================================================
   Shared UI
   ========================================================================== */

const cardClass =
  "rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-2xl shadow-black/20 backdrop-blur-xl";

const softCardClass =
  "rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl";

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050506]">
      <div className="absolute left-1/2 top-[-180px] h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-[150px]" />

      <div className="absolute right-[-180px] top-[18%] h-[480px] w-[480px] rounded-full bg-cyan-500/[0.045] blur-[150px]" />

      <div className="absolute bottom-[-240px] left-[15%] h-[500px] w-[500px] rounded-full bg-fuchsia-500/[0.035] blur-[150px]" />

      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

/* ==========================================================================
   Helpers
   ========================================================================== */

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function getScoreColor(score: number): string {
  if (score >= 90) {
    return "text-emerald-400";
  }

  if (score >= 75) {
    return "text-yellow-400";
  }

  if (score >= 50) {
    return "text-orange-400";
  }

  return "text-red-400";
}

function getFileIcon(status: string | null): string {
  if (status === "added") {
    return "+";
  }

  if (status === "removed") {
    return "-";
  }

  if (status === "renamed") {
    return "R";
  }

  return "M";
}

function getFileIconClass(status: string | null): string {
  if (status === "added") {
    return "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400";
  }

  if (status === "removed") {
    return "border-red-500/25 bg-red-500/[0.08] text-red-400";
  }

  if (status === "renamed") {
    return "border-blue-500/25 bg-blue-500/[0.08] text-blue-400";
  }

  return "border-yellow-500/25 bg-yellow-500/[0.08] text-yellow-400";
}

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | ApiErrorResponse
      | undefined;

    const detail = data?.detail ?? data?.message;

    if (Array.isArray(detail)) {
      const firstError = detail[0];

      if (
        typeof firstError === "object" &&
        firstError !== null &&
        "msg" in firstError
      ) {
        return String(
          (firstError as { msg?: unknown }).msg ??
            fallback
        );
      }

      return fallback;
    }

    if (
      detail !== undefined &&
      detail !== null &&
      String(detail).trim()
    ) {
      return String(detail);
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/* ==========================================================================
   Page
   ========================================================================== */

export default function PullRequestDetailPage({
  params,
}: PageProps) {
  const { repositoryId, pullNumber } = use(params);

  const router = useRouter();

  const repositoryIdNumber = Number(repositoryId);
  const pullNumberNumber = Number(pullNumber);

  const [repository, setRepository] =
    useState<Repository | null>(null);

  const [pullRequest, setPullRequest] =
    useState<PullRequest | null>(null);

  const [files, setFiles] =
    useState<PullRequestFile[]>([]);

  const [reviewResult, setReviewResult] =
    useState<ReviewRunResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [reviewing, setReviewing] =
    useState(false);

  const [reviewStatus, setReviewStatus] =
    useState("");

  const [reviewError, setReviewError] =
    useState("");

  const [reviewStartedAt, setReviewStartedAt] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [expandedFiles, setExpandedFiles] =
    useState<Record<string, boolean>>({});

  /* ==========================================================================
     Load Pull Request
     ========================================================================== */

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL ??
        "http://127.0.0.1:8000/api";

      const token =
        localStorage.getItem("access_token") ?? "";

      const repositoriesResponse = await fetch(
        `${apiBaseUrl}/github/repositories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (repositoriesResponse.status === 401) {
        localStorage.removeItem("access_token");
        router.replace("/login");
        return;
      }

      if (!repositoriesResponse.ok) {
        throw new Error(
          "Failed to load repositories."
        );
      }

      const repositoriesData =
        (await repositoriesResponse.json()) as
          | RepositoriesResponse
          | undefined;

      const repositories =
        repositoriesData?.repositories ?? [];

      const foundRepository =
        repositories.find(
          (item) =>
            item.id === repositoryIdNumber
        );

      if (!foundRepository) {
        setError("Repository not found.");
        return;
      }

      setRepository(foundRepository);

      /* ----------------------------------------------------------------------
         Load Pull Request
         ---------------------------------------------------------------------- */

      const foundPullRequest =
        await getPullRequest(
          repositoryIdNumber,
          pullNumberNumber
        );

      setPullRequest(foundPullRequest);

      /* ----------------------------------------------------------------------
         Load Changed Files
         ---------------------------------------------------------------------- */

      const pullRequestFiles =
        await getPullRequestFiles(
          repositoryIdNumber,
          pullNumberNumber
        );

      setFiles(pullRequestFiles);

      /* ----------------------------------------------------------------------
         Expand First File
         ---------------------------------------------------------------------- */

      if (pullRequestFiles.length > 0) {
        setExpandedFiles({
          [pullRequestFiles[0].filename]: true,
        });
      } else {
        setExpandedFiles({});
      }
    } catch (error: unknown) {
      console.error(
        "Failed to load pull request:",
        error
      );

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        localStorage.removeItem(
          "access_token"
        );

        router.replace("/login");
        return;
      }

      setError(
        getErrorMessage(
          error,
          "Failed to load pull request."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [
    pullNumberNumber,
    repositoryIdNumber,
    router,
  ]);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (
      !Number.isInteger(repositoryIdNumber) ||
      !Number.isInteger(pullNumberNumber) ||
      repositoryIdNumber <= 0 ||
      pullNumberNumber <= 0
    ) {
      setError(
        "Invalid repository or pull request."
      );

      setLoading(false);
      return;
    }

    void loadPage();
  }, [
    loadPage,
    pullNumberNumber,
    repositoryIdNumber,
    router,
  ]);

  /* ==========================================================================
     Run Async AI Review
     ========================================================================== */

  const runAIReview = useCallback(async () => {
    if (!pullRequest || reviewing) {
      return;
    }

    try {
      setReviewing(true);
      setReviewError("");
      setReviewResult(null);

      setReviewStartedAt(
        new Date().toISOString()
      );

      setReviewStatus("queued");

      const job = await runAsyncReview(
        pullRequest.id
      );

      console.log(
        "CodeGuard review job created:",
        job
      );

      setReviewStatus(
        job.status?.toLowerCase() || "queued"
      );

      let attempts = 0;

      while (
        attempts < REVIEW_MAX_POLL_ATTEMPTS
      ) {
        attempts += 1;

        await new Promise<void>(
          (resolve) =>
            setTimeout(
              resolve,
              REVIEW_POLL_INTERVAL
            )
        );

        const currentJob =
          await getReviewJob(job.job_id);

        console.log(
          `Review job ${job.job_id} status:`,
          currentJob.status
        );

        const status =
          currentJob.status.toLowerCase();

        if (status === "queued") {
          setReviewStatus("queued");
          continue;
        }

        if (
          status === "running" ||
          status === "processing"
        ) {
          setReviewStatus("running");
          continue;
        }

        if (
          status === "ai" ||
          status === "analyzing"
        ) {
          setReviewStatus("ai");
          continue;
        }

        if (
          status === "completed" ||
          status === "partial"
        ) {
          setReviewStatus("completed");

          const completedReview =
            await getReview(job.review_id);

          setReviewResult(
            completedReview
          );

          setTimeout(() => {
            setReviewStatus("");
          }, 800);

          return;
        }

        if (
          status === "failed" ||
          status === "error"
        ) {
          throw new Error(
            currentJob.error ||
              "The review worker failed to process this review."
          );
        }

        setReviewStatus(
          currentJob.status
        );
      }

      throw new Error(
        "The review is taking longer than expected. Please check the review status and try again later."
      );
    } catch (error: unknown) {
      console.error(
        "AI review failed:",
        error
      );

      if (axios.isAxiosError(error)) {
        const responseStatus =
          error.response?.status;

        const data =
          error.response?.data as
            | ApiErrorResponse
            | undefined;

        const detail =
          data?.detail ?? data?.message;

        if (responseStatus === 401) {
          const detailText =
            typeof detail === "string"
              ? detail
              : "";

          if (
            detailText
              .toLowerCase()
              .includes("github")
          ) {
            setReviewError(
              detailText ||
                "GitHub authorization has expired. Please reconnect GitHub."
            );

            setReviewStatus("failed");
          } else {
            localStorage.removeItem(
              "access_token"
            );

            router.replace("/login");
          }

          return;
        }

        if (responseStatus === 403) {
          setReviewError(
            typeof detail === "string"
              ? detail
              : "You are not authorized to run this review."
          );

          setReviewStatus("failed");
          return;
        }
      }

      setReviewError(
        getErrorMessage(
          error,
          "Failed to run AI code review."
        )
      );

      setReviewStatus("failed");
    } finally {
      setReviewing(false);
    }
  }, [pullRequest, reviewing, router]);

  /* ==========================================================================
     Toggle Changed File
     ========================================================================== */

  function toggleFile(filename: string) {
    setExpandedFiles((current) => ({
      ...current,
      [filename]: !current[filename],
    }));
  }

  /* ==========================================================================
     Logout
     ========================================================================== */

  function logout() {
    localStorage.removeItem(
      "access_token"
    );

    router.replace("/login");
  }

  /* ==========================================================================
     Statistics
     ========================================================================== */

  const additions = useMemo(
    () =>
      files.reduce(
        (total, file) =>
          total + file.additions,
        0
      ),
    [files]
  );

  const deletions = useMemo(
    () =>
      files.reduce(
        (total, file) =>
          total + file.deletions,
        0
      ),
    [files]
  );

  const totalChanges =
    additions + deletions;

  /* ==========================================================================
     Findings Grouped By Severity
     ========================================================================== */

  const findingsBySeverity =
    useMemo(() => {
      if (!reviewResult) {
        return {} as Record<
          string,
          ReviewFinding[]
        >;
      }

      const groups: Record<
        string,
        ReviewFinding[]
      > = {};

      for (const finding of
        reviewResult.findings) {
        const severity =
          finding.severity.toLowerCase();

        if (!groups[severity]) {
          groups[severity] = [];
        }

        groups[severity].push(finding);
      }

      return groups;
    }, [reviewResult]);

  /* ==========================================================================
     Loading State
     ========================================================================== */

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050506] text-slate-100">
        <Background />

        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-40 rounded bg-white/[0.05]" />

            <div className="h-52 rounded-2xl border border-white/[0.06] bg-white/[0.025]" />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-72 rounded-2xl border border-white/[0.06] bg-white/[0.025] lg:col-span-2" />

              <div className="h-72 rounded-2xl border border-white/[0.06] bg-white/[0.025]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================================
     Error State
     ========================================================================== */

  if (
    error ||
    !pullRequest ||
    !repository
  ) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050506] text-slate-100">
        <Background />

        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
          <div
            className={`${cardClass} w-full border-red-500/15 bg-red-500/[0.025] p-8 text-center`}
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.08]">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>

            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-red-400/70">
              REQUEST FAILED
            </p>

            <h1 className="mt-3 text-xl font-semibold text-white">
              Unable to load pull request
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              {error ||
                "Pull request information is unavailable."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/repositories/${repositoryId}`
                )
              }
              className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to repository
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================================
     Main Page
     ========================================================================== */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] text-slate-100">
      <Background />

      {/* ======================================================================
          Navbar
          ====================================================================== */}

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050506]/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="group flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition group-hover:shadow-violet-500/30">
              C
            </div>

            <span className="text-[15px] font-semibold tracking-tight text-white">
              CodeGuard{" "}
              <span className="text-violet-400">
                AI
              </span>
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/repositories"
                )
              }
              className="rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
            >
              Repositories
            </button>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-8">
        {/* ====================================================================
            Breadcrumb
            ==================================================================== */}

        <div className="mb-7 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/repositories"
              )
            }
            className="text-slate-600 transition hover:text-slate-300"
          >
            Repositories
          </button>

          <span className="text-slate-800">
            /
          </span>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/repositories/${repositoryId}`
              )
            }
            className="text-slate-600 transition hover:text-slate-300"
          >
            {repository.name}
          </button>

          <span className="text-slate-800">
            /
          </span>

          <span className="font-mono text-slate-400">
            PR #{pullRequest.number}
          </span>
        </div>

        {/* ====================================================================
            Pull Request Header
            ==================================================================== */}

        <section className={`${cardClass} overflow-hidden`}>
          <div className="relative p-6 md:p-7">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-500/[0.05] blur-[90px]" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1 text-[11px] font-medium capitalize text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {pullRequest.state}
                  </span>

                  <span className="font-mono text-xs text-slate-600">
                    #{pullRequest.number}
                  </span>
                </div>

                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400/70">
                  CODE REVIEW / PULL REQUEST
                </p>

                <h1 className="max-w-4xl text-2xl font-bold tracking-tight text-white md:text-3xl">
                  {pullRequest.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                  <span>
                    Opened by{" "}
                    <span className="font-medium text-slate-300">
                      {pullRequest.author ||
                        "Unknown"}
                    </span>
                  </span>

                  <span className="hidden text-slate-800 sm:inline">
                    •
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[11px] text-slate-400">
                    <GitBranch className="h-3 w-3 text-violet-400" />
                    {pullRequest.source_branch}
                  </span>

                  <span className="text-slate-700">
                    →
                  </span>

                  <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[11px] text-slate-400">
                    {pullRequest.target_branch}
                  </span>
                </div>
              </div>

              <div className="relative flex shrink-0 flex-wrap gap-2.5">
                {pullRequest.html_url && (
                  <a
                    href={
                      pullRequest.html_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    View on GitHub
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={runAIReview}
                  disabled={reviewing}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing PR...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run AI Review
                    </>
                  )}
                </button>
              </div>
            </div>

            {pullRequest.description && (
              <div className="relative mt-7 border-t border-white/[0.06] pt-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-500">
                  {pullRequest.description}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ====================================================================
            Review Progress
            ==================================================================== */}

        {(reviewing ||
          reviewStatus === "completed" ||
          reviewStatus === "failed") && (
          <section className="mt-6">
            <ReviewProgress
              status={
                reviewStatus ||
                (reviewing
                  ? "queued"
                  : "completed")
              }
              error={
                reviewError || null
              }
              startedAt={
                reviewStartedAt
              }
            />
          </section>
        )}

        {/* ====================================================================
            Review Error
            ==================================================================== */}

        {reviewError &&
          reviewStatus !== "failed" && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.035] p-5">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.08]">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>

                <div>
                  <p className="font-medium text-red-300">
                    Review failed
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-400/70">
                    {reviewError}
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* ====================================================================
            Stats
            ==================================================================== */}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${softCardClass} p-5`}>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Changed files
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {files.length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              files modified
            </p>
          </div>

          <div className={`${softCardClass} p-5`}>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Additions
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-400">
              +{additions}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              lines added
            </p>
          </div>

          <div className={`${softCardClass} p-5`}>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Deletions
            </p>

            <p className="mt-2 text-2xl font-bold text-red-400">
              -{deletions}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              lines removed
            </p>
          </div>

          <div className={`${softCardClass} p-5`}>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              AI score
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                reviewResult
                  ? getScoreColor(
                      reviewResult.review
                        .score
                    )
                  : "text-slate-700"
              }`}
            >
              {reviewResult
                ? `${Math.round(
                    reviewResult.review
                      .score
                  )}/100`
                : "—"}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              code quality
            </p>
          </div>
        </section>

        {/* ====================================================================
            Context Budget
            ==================================================================== */}

        {reviewResult?.context_budget && (
          <section className="mt-6">
            <ContextBudgetPanel
              data={
                reviewResult.context_budget
              }
            />
          </section>
        )}

        {/* ====================================================================
            Main Content
            ==================================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* ==================================================================
              Changed Files
              ================================================================== */}

          <section className="lg:col-span-2">
            <div
              className={`${cardClass} overflow-hidden`}
            >
              <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/70">
                    SOURCE CHANGES
                  </p>

                  <h2 className="mt-1 flex items-center gap-2 font-semibold text-white">
                    <FileCode2 className="h-4 w-4 text-cyan-400" />
                    Changed files
                  </h2>

                  <p className="mt-1 text-xs text-slate-600">
                    {files.length}{" "}
                    {files.length === 1
                      ? "file"
                      : "files"}{" "}
                    changed in this pull request
                  </p>
                </div>

                <span className="w-fit rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 font-mono text-[11px] text-slate-500">
                  <span className="text-emerald-400">
                    +{additions}
                  </span>{" "}
                  /{" "}
                  <span className="text-red-400">
                    -{deletions}
                  </span>
                </span>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {files.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.025]">
                      <FileCode2 className="h-6 w-6 text-slate-700" />
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                      No changed files found.
                    </p>
                  </div>
                ) : (
                  files.map((file) => {
                    const expanded =
                      expandedFiles[
                        file.filename
                      ] ?? false;

                    return (
                      <div
                        key={
                          file.sha ??
                          file.filename
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleFile(
                              file.filename
                            )
                          }
                          className="group flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.025]"
                          aria-expanded={
                            expanded
                          }
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${getFileIconClass(
                              file.status
                            )}`}
                          >
                            {getFileIcon(
                              file.status
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-xs text-slate-300 transition group-hover:text-white">
                              {
                                file.filename
                              }
                            </span>

                            <span className="mt-1 block text-[11px] capitalize text-slate-600">
                              {file.status ||
                                "modified"}
                            </span>
                          </span>

                          <span className="hidden shrink-0 rounded-md bg-white/[0.025] px-2 py-1 text-[11px] sm:block">
                            <span className="text-emerald-400">
                              +{file.additions}
                            </span>

                            <span className="ml-2 text-red-400">
                              -{file.deletions}
                            </span>
                          </span>

                          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition group-hover:text-slate-400">
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                        </button>

                        {expanded && (
                          <div className="border-t border-white/[0.05] bg-[#030405]">
                            {file.patch ? (
                              <pre className="max-h-[600px] overflow-auto p-5 font-mono text-[11px] leading-6 text-slate-500">
                                {
                                  file.patch
                                }
                              </pre>
                            ) : (
                              <div className="p-8 text-center text-xs text-slate-700">
                                No patch available for this file.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {files.length > 0 && (
                <div className="border-t border-white/[0.06] bg-white/[0.01] px-5 py-3.5">
                  <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-wider text-slate-700">
                    <span>
                      {files.length} files
                    </span>

                    <span className="text-emerald-500/80">
                      +{additions} additions
                    </span>

                    <span className="text-red-500/80">
                      -{deletions} deletions
                    </span>

                    <span>
                      {totalChanges} total
                      changes
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================================
              AI Review Summary
              ================================================================== */}

          <aside>
            <div
              className={`${cardClass} p-5`}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/[0.07]">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>

                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-violet-400/60">
                    CODE INTELLIGENCE
                  </p>

                  <h2 className="font-semibold text-white">
                    AI Review
                  </h2>
                </div>
              </div>

              {!reviewResult ? (
                <div className="mt-6">
                  <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-white/[0.07] bg-black/20 p-5">
                    <div className="text-center">
                      {reviewing ? (
                        <>
                          <Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-400" />

                          <p className="mt-3 text-sm text-violet-300">
                            Review in progress
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-700">
                            {reviewStatus ||
                              "Waiting for CodeGuard worker..."}
                          </p>
                        </>
                      ) : (
                        <>
                          <Sparkles className="mx-auto h-7 w-7 text-slate-800" />

                          <p className="mt-3 text-sm text-slate-500">
                            No review yet
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-700">
                            Run AI Review to analyze this PR.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      runAIReview
                    }
                    disabled={reviewing}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.035] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reviewing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Start Review
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {/* Score */}

                  <div className="rounded-xl border border-white/[0.06] bg-black/20 p-5 text-center">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
                      Code quality score
                    </p>

                    <p
                      className={`mt-2 text-5xl font-black ${getScoreColor(
                        reviewResult.review
                          .score
                      )}`}
                    >
                      {Math.round(
                        reviewResult.review
                          .score
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-700">
                      out of 100
                    </p>
                  </div>

                  {/* Status */}

                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Status
                    </p>

                    <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1 text-xs font-medium capitalize text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                      {
                        reviewResult.review
                          .status
                      }
                    </span>
                  </div>

                  {/* Analysis */}

                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Analysis
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {
                        reviewResult.files_analyzed
                      }{" "}
                      {reviewResult.files_analyzed ===
                      1
                        ? "file"
                        : "files"}{" "}
                      analyzed
                    </p>

                    {reviewResult.files_failed >
                      0 && (
                      <p className="mt-1 text-xs text-orange-400">
                        {
                          reviewResult.files_failed
                        }{" "}
                        files failed
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/[0.05] bg-white/[0.025] px-2.5 py-1 text-[10px] text-slate-600">
                        {
                          reviewResult.static_findings
                        }{" "}
                        static
                      </span>

                      <span className="rounded-full border border-white/[0.05] bg-white/[0.025] px-2.5 py-1 text-[10px] text-slate-600">
                        {
                          reviewResult.ai_findings
                        }{" "}
                        AI
                      </span>
                    </div>
                  </div>

                  {/* Context Summary */}

                  {reviewResult.context_budget && (
                    <div>
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        AI context
                      </p>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                          <p className="text-[10px] text-slate-700">
                            Tokens
                          </p>

                          <p className="mt-1 text-sm font-semibold text-cyan-400">
                            {reviewResult.context_budget.total_estimated_tokens.toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                          <p className="text-[10px] text-slate-700">
                            Included
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-300">
                            {
                              reviewResult
                                .context_budget
                                .files_included
                            }
                          </p>
                        </div>

                        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                          <p className="text-[10px] text-slate-700">
                            Truncated
                          </p>

                          <p className="mt-1 text-sm font-semibold text-orange-400">
                            {
                              reviewResult
                                .context_budget
                                .files_truncated
                            }
                          </p>
                        </div>

                        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                          <p className="text-[10px] text-slate-700">
                            Dropped
                          </p>

                          <p className="mt-1 text-sm font-semibold text-red-400">
                            {
                              reviewResult
                                .context_budget
                                .files_dropped
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}

                  {reviewResult.review
                    .summary && (
                    <div>
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Summary
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {
                          reviewResult.review
                            .summary
                        }
                      </p>
                    </div>
                  )}

                  {/* Finding count */}

                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Findings
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {
                        reviewResult.findings
                          .length
                      }{" "}
                      issues detected
                    </p>
                  </div>

                  {/* Reviewed */}

                  <div className="border-t border-white/[0.06] pt-4">
                    <p className="text-[11px] text-slate-700">
                      Reviewed{" "}
                      {formatDate(
                        reviewResult.review
                          .updated_at
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* ====================================================================
            AI Findings
            ==================================================================== */}

        {reviewResult && (
          <section className="mt-6">
            <div
              className={`${cardClass} overflow-hidden`}
            >
              <div className="border-b border-white/[0.06] px-5 py-5 md:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/[0.07]">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                      </div>

                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-violet-400/60">
                          AI ANALYSIS
                        </p>

                        <h2 className="text-lg font-semibold text-white">
                          AI Findings
                        </h2>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {
                        reviewResult.findings
                          .length
                      }{" "}
                      issues detected by CodeGuard AI
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "critical",
                      "high",
                      "medium",
                      "low",
                    ].map((severity) => {
                      const count =
                        findingsBySeverity[
                          severity
                        ]?.length ?? 0;

                      return (
                        <span
                          key={severity}
                          className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${severityStyles[severity]}`}
                        >
                          {severity}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {reviewResult.findings
                .length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07]">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>

                  <h3 className="mt-4 font-semibold text-white">
                    No issues found
                  </h3>

                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                    CodeGuard AI did not identify any significant problems in this pull request.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {[
                    "critical",
                    "high",
                    "medium",
                    "low",
                  ].map((severity) => {
                    const findings =
                      findingsBySeverity[
                        severity
                      ] ?? [];

                    if (
                      findings.length ===
                      0
                    ) {
                      return null;
                    }

                    return (
                      <div
                        key={severity}
                        className="p-5 md:p-6"
                      >
                        <div className="mb-4 flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${severityDotStyles[severity]}`}
                          />

                          <h3 className="text-sm font-semibold capitalize text-white">
                            {severity} issues
                          </h3>

                          <span className="text-xs text-slate-700">
                            (
                            {
                              findings.length
                            }
                            )
                          </span>
                        </div>

                        <div className="space-y-4">
                          {findings.map(
                            (finding) => (
                              <article
                                key={
                                  finding.id
                                }
                                className="rounded-2xl border border-white/[0.06] bg-black/20 p-5 transition hover:border-white/[0.09]"
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${severityStyles[severity]}`}
                                      >
                                        {
                                          severity
                                        }
                                      </span>

                                      <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2 py-0.5 text-[10px] capitalize text-slate-500">
                                        {
                                          finding.category
                                        }
                                      </span>
                                    </div>

                                    <h4 className="mt-3 font-semibold text-white">
                                      {
                                        finding.title
                                      }
                                    </h4>
                                  </div>

                                  <div className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                                    <p className="font-mono text-[11px] text-slate-500">
                                      {
                                        finding.file
                                      }

                                      <span className="text-slate-700">
                                        :
                                      </span>

                                      <span className="text-cyan-400">
                                        {
                                          finding.line
                                        }
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <p className="mt-4 text-sm leading-6 text-slate-500">
                                  {
                                    finding.description
                                  }
                                </p>

                                {finding.why_it_matters && (
                                  <div className="mt-4 rounded-xl border border-orange-500/10 bg-orange-500/[0.035] p-4">
                                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-orange-400">
                                      Why it matters
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                      {
                                        finding.why_it_matters
                                      }
                                    </p>
                                  </div>
                                )}

                                {finding.suggested_fix && (
                                  <div className="mt-4 rounded-xl border border-blue-500/10 bg-blue-500/[0.035] p-4">
                                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-400">
                                      Suggested fix
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                                      {
                                        finding.suggested_fix
                                      }
                                    </p>
                                  </div>
                                )}

                                {finding.fixed_code && (
                                  <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]">
                                    <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.025] px-4 py-2.5">
                                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                        Suggested code
                                      </span>

                                      {finding.confidence !==
                                        null && (
                                        <span className="text-[10px] text-slate-600">
                                          Confidence{" "}
                                          {Math.round(
                                            finding.confidence *
                                              100
                                          )}
                                          %
                                        </span>
                                      )}
                                    </div>

                                    <pre className="max-h-[500px] overflow-auto bg-[#030405] p-4 font-mono text-[11px] leading-6 text-slate-400">
                                      <code>
                                        {
                                          finding.fixed_code
                                        }
                                      </code>
                                    </pre>
                                  </div>
                                )}

                                {!finding.fixed_code &&
                                  finding.confidence !==
                                    null && (
                                    <div className="mt-4 text-[10px] text-slate-700">
                                      AI confidence:{" "}
                                      {Math.round(
                                        finding.confidence *
                                          100
                                      )}
                                      %
                                    </div>
                                  )}
                              </article>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
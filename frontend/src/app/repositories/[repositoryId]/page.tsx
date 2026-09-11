"use client";

import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileCode2,
  GitBranch,
  Loader2,
  LogOut,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

interface Repository {
  id: number;
  github_repo_id: number;
  owner: string;
  name: string;
  full_name: string;
  private: boolean;
  language: string | null;
  html_url: string | null;
  default_branch: string;
}

interface PullRequest {
  id: number;
  repository_id: number;
  github_pr_id: number;
  number: number;
  title: string;
  description: string | null;
  state: string;
  source_branch: string | null;
  target_branch: string | null;
  author: string | null;
  html_url: string | null;
}

interface PageProps {
  params: Promise<{
    repositoryId: string;
  }>;
}

interface RepositoriesResponse {
  repositories?: Repository[];
}

interface SyncPullRequestsResponse {
  pull_requests?: PullRequest[];
  count?: number;
}

interface ApiErrorResponse {
  detail?: unknown;
  message?: unknown;
}

const cardClass =
  "rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-2xl shadow-black/20 backdrop-blur-xl";

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#050506]" />

      <div className="absolute left-1/2 top-0 h-[700px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-[150px]" />

      <div className="absolute right-[-100px] top-[30%] h-[550px] w-[550px] rounded-full bg-cyan-500/[0.045] blur-[150px]" />

      <div className="absolute bottom-[-150px] left-[-100px] h-[500px] w-[500px] rounded-full bg-fuchsia-600/[0.035] blur-[150px]" />

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

function getErrorMessage(
  error: unknown,
  fallback: string,
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
            fallback,
        );
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

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
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
            Repository intelligence
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Loading repository...
          </p>
        </div>
      </div>
    </main>
  );
}

function AlertMessage({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-4 backdrop-blur-xl ${
        isError
          ? "border-rose-500/20 bg-rose-500/[0.05] text-rose-300"
          : "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isError
            ? "bg-rose-500/10"
            : "bg-emerald-500/10"
        }`}
      >
        {isError ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </div>

      <div className="pt-1">
        <p className="text-sm font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}

function PullRequestCard({
  pullRequest,
  repositoryId,
  defaultBranch,
  onOpen,
}: {
  pullRequest: PullRequest;
  repositoryId: string;
  defaultBranch: string;
  onOpen: () => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open pull request #${pullRequest.number}: ${pullRequest.title}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/20 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-violet-950/10 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:p-6"
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-violet-500/[0.06] opacity-0 blur-3xl transition duration-500 group-hover:opacity-100" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Main content */}
        <div className="flex min-w-0 gap-4">
          {/* PR number */}
          <div className="flex shrink-0 flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/[0.06]">
              <span className="font-mono text-[10px] font-semibold text-violet-300">
                #{pullRequest.number}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {/* Title */}
            <h3 className="truncate text-base font-semibold tracking-tight text-white transition group-hover:text-violet-200 sm:text-lg">
              {pullRequest.title}
            </h3>

            {/* Description */}
            <p className="mt-2 max-w-3xl truncate text-xs leading-5 text-zinc-600 sm:text-sm">
              {pullRequest.description ||
                "No description provided."}
            </p>

            {/* Metadata */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {pullRequest.author && (
                <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[9px] text-zinc-500">
                  @{pullRequest.author}
                </span>
              )}

              {pullRequest.source_branch && (
                <span className="flex max-w-[180px] items-center gap-1.5 truncate rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[9px] text-zinc-500">
                  <GitBranch className="h-3 w-3 shrink-0 text-cyan-400" />

                  <span className="truncate">
                    {pullRequest.source_branch}
                  </span>
                </span>
              )}

              <ArrowRight className="h-3 w-3 shrink-0 text-zinc-800" />

              <span className="max-w-[180px] truncate rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[9px] text-zinc-500">
                {pullRequest.target_branch ??
                  defaultBranch}
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
            {pullRequest.state}
          </span>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-700 transition group-hover:border-violet-400/15 group-hover:bg-violet-500/[0.06] group-hover:text-violet-300">
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function RepositoryPage({
  params,
}: PageProps) {
  const { repositoryId } = use(params);
  const router = useRouter();

  const repositoryIdNumber = Number(
    repositoryId,
  );

  const [repository, setRepository] =
    useState<Repository | null>(null);

  const [pullRequests, setPullRequests] =
    useState<PullRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [syncing, setSyncing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadRepository = useCallback(
    async () => {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      if (
        !Number.isInteger(repositoryIdNumber)
      ) {
        setError("Invalid repository ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const repositoriesResponse =
          await api.get<RepositoriesResponse>(
            "/github/repositories",
          );

        const repositories =
          repositoriesResponse.data
            ?.repositories ?? [];

        const foundRepository =
          repositories.find(
            (item) =>
              item.id === repositoryIdNumber,
          );

        if (!foundRepository) {
          setError("Repository not found.");
          setRepository(null);
          setPullRequests([]);
          return;
        }

        setRepository(foundRepository);

        const pullRequestsResponse =
          await api.get<PullRequest[]>(
            `/github/repositories/${repositoryId}/pull-requests`,
            {
              params: {
                state: "open",
              },
            },
          );

        setPullRequests(
          pullRequestsResponse.data ?? [],
        );
      } catch (error: unknown) {
        console.error(
          "Failed to load repository:",
          error,
        );

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          localStorage.removeItem(
            "access_token",
          );

          router.replace("/login");

          return;
        }

        setError(
          getErrorMessage(
            error,
            "Unable to load repository.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [
      repositoryId,
      repositoryIdNumber,
      router,
    ],
  );

  useEffect(() => {
    void loadRepository();
  }, [loadRepository]);

  const syncPullRequests = async () => {
    try {
      setSyncing(true);
      setError("");
      setSuccess("");

      const response =
        await api.post<SyncPullRequestsResponse>(
          `/github/repositories/${repositoryId}/pull-requests/sync`,
        );

      setPullRequests(
        response.data?.pull_requests ?? [],
      );

      setSuccess(
        `Successfully synced ${
          response.data?.count ?? 0
        } pull requests.`,
      );
    } catch (error: unknown) {
      console.error(
        "Failed to sync pull requests:",
        error,
      );

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        localStorage.removeItem(
          "access_token",
        );

        router.replace("/login");

        return;
      }

      setError(
        getErrorMessage(
          error,
          "Unable to sync pull requests.",
        ),
      );
    } finally {
      setSyncing(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    router.replace("/login");
  };

  const openGitHubRepository = () => {
    if (!repository?.html_url) {
      return;
    }

    window.open(
      repository.html_url,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] text-white">
      <Background />

      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.05] bg-[#050506]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="group flex items-center gap-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-400/15 bg-violet-500/10">
              <Code2 className="h-3.5 w-3.5 text-violet-300" />
            </div>

            <span className="text-sm font-semibold tracking-tight text-white">
              CodeGuard
              <span className="text-violet-400">
                {" "}
                AI
              </span>
            </span>
          </button>

          {/* Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-600 transition hover:bg-white/[0.04] hover:text-white"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/repositories")
              }
              className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white"
            >
              Repositories
            </button>
          </nav>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="group flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-rose-400/20 hover:bg-rose-500/[0.05] hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        {/* Back */}
        <button
          type="button"
          onClick={() =>
            router.push("/repositories")
          }
          className="group mb-7 flex items-center gap-2 text-sm text-zinc-600 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />

          Back to repositories
        </button>

        {/* Alerts */}
        {error && (
          <AlertMessage
            type="error"
            message={error}
          />
        )}

        {success && (
          <AlertMessage
            type="success"
            message={success}
          />
        )}

        {repository && (
          <>
            {/* Repository Header */}
            <section
              className={`${cardClass} relative mb-10 overflow-hidden`}
            >
              {/* Glow */}
              <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-500/[0.06] blur-[100px]" />

              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  {/* Repository identity */}
                  <div className="flex min-w-0 items-start gap-5">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 rounded-2xl bg-violet-500/15 blur-xl" />

                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/15 to-cyan-500/[0.08] font-mono text-2xl font-semibold text-violet-200 sm:h-[72px] sm:w-[72px]">
                        {repository.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    </div>

                    <div className="min-w-0">
                      {/* Breadcrumb */}
                      <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-zinc-700">
                        <span>
                          {repository.owner}
                        </span>

                        <span className="text-zinc-800">
                          /
                        </span>

                        <span>
                          {repository.name}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                          {repository.name}
                        </h1>

                        <span
                          className={
                            repository.private
                              ? "rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-amber-300"
                              : "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-emerald-300"
                          }
                        >
                          {repository.private
                            ? "Private"
                            : "Public"}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm text-zinc-600">
                        {repository.full_name}
                      </p>

                      {/* Repository metadata */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />

                          {repository.language ??
                            "Unknown"}
                        </span>

                        <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                          <GitBranch className="h-3 w-3 text-violet-300" />

                          {repository.default_branch}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {repository.html_url && (
                      <button
                        type="button"
                        onClick={
                          openGitHubRepository
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-sm font-semibold text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white"
                      >
                        <FaGithub className="h-4 w-4" />

                        GitHub

                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={
                        syncPullRequests
                      }
                      disabled={syncing}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-200 shadow-lg shadow-violet-950/10 transition hover:border-violet-400/30 hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Sync pull requests
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Repository metrics */}
            <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                className={`${cardClass} relative overflow-hidden p-5`}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                      Open pull requests
                    </span>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10">
                      <GitBranch className="h-4 w-4 text-violet-300" />
                    </div>
                  </div>

                  <div className="mt-5 text-2xl font-semibold text-white">
                    {pullRequests.length}
                  </div>
                </div>
              </div>

              <div
                className={`${cardClass} relative overflow-hidden p-5`}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                      Default branch
                    </span>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-500/10">
                      <Code2 className="h-4 w-4 text-cyan-300" />
                    </div>
                  </div>

                  <div className="mt-5 truncate text-2xl font-semibold text-white">
                    {repository.default_branch}
                  </div>
                </div>
              </div>

              <div
                className={`${cardClass} relative overflow-hidden p-5 sm:col-span-2 lg:col-span-1`}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                      Review engine
                    </span>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-500/10">
                      <Sparkles className="h-4 w-4 text-emerald-300" />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-2xl font-semibold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

                    Ready
                  </div>
                </div>
              </div>
            </section>

            {/* Pull Requests */}
            <section>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-violet-400" />

                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-violet-300">
                      Code review
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    Pull requests
                  </h2>

                  <p className="mt-1 text-sm text-zinc-600">
                    Review your GitHub pull requests
                    with CodeGuard AI.
                  </p>
                </div>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 font-mono text-xs font-semibold text-zinc-400">
                  {pullRequests.length}
                </div>
              </div>

              {pullRequests.length === 0 ? (
                <div
                  className={`${cardClass} flex min-h-[350px] flex-col items-center justify-center px-6 py-16 text-center`}
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-2xl" />

                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                      <GitBranch className="h-6 w-6 text-violet-300" />
                    </div>
                  </div>

                  <h3 className="mt-6 text-lg font-semibold text-white">
                    No open pull requests
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                    Sync this repository to check
                    GitHub for new pull requests.
                  </p>

                  <button
                    type="button"
                    onClick={
                      syncPullRequests
                    }
                    disabled={syncing}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-violet-200 transition hover:border-violet-400/30 hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Sync pull requests
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pullRequests.map(
                    (pullRequest) => (
                      <PullRequestCard
                        key={pullRequest.id}
                        pullRequest={
                          pullRequest
                        }
                        repositoryId={
                          repositoryId
                        }
                        defaultBranch={
                          repository.default_branch
                        }
                        onOpen={() =>
                          router.push(
                            `/repositories/${repositoryId}/pull-requests/${pullRequest.number}`,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </section>

            {/* Footer */}
            <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.05] pt-6 sm:flex-row">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
                  Repository connected
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-800">
                <FaGithub className="h-3 w-3" />

                Source Control · CodeGuard AI
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
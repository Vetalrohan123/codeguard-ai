"use client";

import axios from "axios";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  Code2,
  FileCode2,
  GitBranch,
  Loader2,
  LogOut,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

interface GitHubStatus {
  connected: boolean;
  username: string | null;
  github_user_id: number | null;
}

interface Repository {
  id: number;
  github_repo_id?: number;
  owner: string;
  name: string;
  full_name: string;
  private: boolean;
  language: string | null;
  html_url: string | null;
  default_branch: string;
}

interface GitHubRepositoriesResponse {
  repositories?: Repository[];
}

interface GitHubLoginResponse {
  authorization_url?: string;
}

interface ImportRepositoriesResponse {
  repositories?: Repository[];
  count?: number;
}

const cardClass =
  "rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-2xl shadow-black/20 backdrop-blur-xl";

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

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
            Loading repositories...
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

function RepositoryCard({
  repository,
  onOpen,
}: {
  repository: Repository;
  onOpen: () => void;
}) {
  const initial =
    repository.name.charAt(0).toUpperCase();

  return (
    <article
      role="button"
      tabIndex={0}
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
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-400/20 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-violet-950/10 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/[0.06] opacity-0 blur-3xl transition duration-500 group-hover:opacity-100" />

      {/* Top */}
      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/[0.06] font-mono text-lg font-semibold text-violet-200">
          {initial}
        </div>

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

      {/* Repository name */}
      <div className="relative">
        <h3 className="truncate text-lg font-semibold tracking-tight text-white transition group-hover:text-violet-200">
          {repository.name}
        </h3>

        <p className="mt-1 truncate text-xs text-zinc-600">
          {repository.full_name}
        </p>
      </div>

      {/* Metadata */}
      <div className="relative mt-5 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />

          {repository.language ?? "Unknown"}
        </span>

        <span className="h-1 w-1 rounded-full bg-zinc-800" />

        <span className="flex items-center gap-1.5">
          <GitBranch className="h-3 w-3" />

          {repository.default_branch}
        </span>
      </div>

      {/* Footer */}
      <div className="relative mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
        <span className="text-xs font-medium text-zinc-500 transition group-hover:text-white">
          View pull requests
        </span>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-700 transition group-hover:border-violet-400/15 group-hover:bg-violet-500/[0.06] group-hover:text-violet-300">
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
  );
}

export default function RepositoriesPage() {
  const router = useRouter();

  const [status, setStatus] =
    useState<GitHubStatus | null>(null);

  const [repositories, setRepositories] =
    useState<Repository[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [connecting, setConnecting] =
    useState(false);

  const [importing, setImporting] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        statusResponse,
        repositoriesResponse,
      ] = await Promise.all([
        api.get<GitHubStatus>("/github/status"),

        api.get<GitHubRepositoriesResponse>(
          "/github/repositories",
        ),
      ]);

      setStatus(statusResponse.data);

      setRepositories(
        repositoriesResponse.data?.repositories ??
          [],
      );
    } catch (error: unknown) {
      console.error(
        "Failed to load repositories:",
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
          "Unable to load repositories.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    void loadData();
  }, [router, loadData]);

  async function connectGitHub() {
    try {
      setConnecting(true);
      setError("");
      setSuccess("");

      const response =
        await api.get<GitHubLoginResponse>(
          "/github/login",
        );

      const authorizationUrl =
        response.data?.authorization_url;

      if (!authorizationUrl) {
        throw new Error(
          "GitHub authorization URL was not returned.",
        );
      }

      window.location.href =
        authorizationUrl;
    } catch (error: unknown) {
      console.error(
        "Failed to start GitHub authentication:",
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
          "Unable to start GitHub authentication.",
        ),
      );

      setConnecting(false);
    }
  }

  async function importRepositories() {
    try {
      setImporting(true);
      setError("");
      setSuccess("");

      const response =
        await api.post<ImportRepositoriesResponse>(
          "/github/repositories/import",
        );

      const importedRepositories =
        response.data?.repositories ?? [];

      setRepositories(
        importedRepositories,
      );

      const count =
        response.data?.count ??
        importedRepositories.length;

      setSuccess(
        `Successfully imported ${count} ${
          count === 1
            ? "repository"
            : "repositories"
        }.`,
      );
    } catch (error: unknown) {
      console.error(
        "Failed to import repositories:",
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
          "Unable to import repositories.",
        ),
      );
    } finally {
      setImporting(false);
    }
  }

  async function refreshRepositories() {
    setSuccess("");
    setError("");

    await loadData();

    setSuccess(
      "Repositories refreshed successfully.",
    );
  }

  function logout() {
    localStorage.removeItem("access_token");
    router.replace("/login");
  }

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
        {/* Header */}
        <section className="mb-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />

                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-violet-300">
                  Source control
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Repositories
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
                Connect GitHub and select a repository
                to start reviewing pull requests with
                AI.
              </p>
            </div>

            {status?.connected && (
              <button
                type="button"
                onClick={importRepositories}
                disabled={importing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-violet-200 shadow-lg shadow-violet-950/10 transition hover:border-violet-400/30 hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="h-4 w-4" />
                    Import repositories
                  </>
                )}
              </button>
            )}
          </div>
        </section>

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

        {/* GitHub not connected */}
        {!status?.connected ? (
          <section
            className={`${cardClass} relative overflow-hidden`}
          >
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/[0.06] blur-[100px]" />

            <div className="grid lg:grid-cols-[300px_1fr]">
              {/* GitHub visual */}
              <div className="relative flex min-h-[300px] items-center justify-center border-b border-white/[0.06] bg-white/[0.015] p-8 lg:border-b-0 lg:border-r">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[2rem] bg-violet-500/10 blur-2xl" />

                  <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/[0.08] bg-white/[0.035] shadow-2xl">
                    <FaGithub className="h-14 w-14 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Not connected
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Connect your GitHub account
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
                  CodeGuard AI needs access to your
                  GitHub repositories so it can analyze
                  pull requests and generate AI-powered
                  reviews.
                </p>

                <div className="mt-7">
                  <button
                    type="button"
                    onClick={connectGitHub}
                    disabled={connecting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting to GitHub...
                      </>
                    ) : (
                      <>
                        <FaGithub className="h-4 w-4" />
                        Connect GitHub
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6 flex items-start gap-2 text-xs leading-5 text-zinc-700">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400/70" />

                  <span>
                    Your GitHub credentials are handled
                    through GitHub OAuth. CodeGuard AI
                    never receives your GitHub password.
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Connected GitHub account */}
            <section
              className={`${cardClass} mb-8 overflow-hidden`}
            >
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-xl" />

                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/15 to-cyan-500/10">
                      <FaGithub className="h-6 w-6 text-violet-200" />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-300">
                        GitHub connected
                      </span>
                    </div>

                    <p className="font-semibold text-white">
                      @{status.username}
                    </p>
                  </div>
                </div>

                {/* GitHub actions */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={connectGitHub}
                    disabled={connecting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Reconnecting...
                      </>
                    ) : (
                      <>
                        <FaGithub className="h-4 w-4" />
                        Reconnect GitHub
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={refreshRepositories}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:border-cyan-400/15 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </section>

            {/* Repository list */}
            <section
              className={`${cardClass} overflow-hidden`}
            >
              {/* Header */}
              <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-cyan-400" />

                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">
                      Your GitHub
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold tracking-tight text-white">
                    Your repositories
                  </h2>

                  <p className="mt-1 text-sm text-zinc-600">
                    Select a repository to inspect its
                    pull requests.
                  </p>
                </div>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 font-mono text-xs font-semibold text-zinc-400">
                  {repositories.length}
                </div>
              </div>

              {/* Empty */}
              {repositories.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-2xl" />

                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                      <FileCode2 className="h-6 w-6 text-zinc-600" />
                    </div>
                  </div>

                  <h3 className="mt-6 text-lg font-semibold text-white">
                    No repositories imported
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                    Import your GitHub repositories to
                    get started with AI-powered pull
                    request reviews.
                  </p>

                  <button
                    type="button"
                    onClick={importRepositories}
                    disabled={importing}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="h-4 w-4" />
                        Import repositories
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Repository grid */
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
                  {repositories.map(
                    (repository) => (
                      <RepositoryCard
                        key={repository.id}
                        repository={repository}
                        onOpen={() =>
                          router.push(
                            `/repositories/${repository.id}`,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.05] pt-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
              GitHub integration active
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-800">
            <FaGithub className="h-3 w-3" />
            Source Control · CodeGuard AI
          </div>
        </div>
      </div>
    </main>
  );
}
"use client";

import axios from "axios";
import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

import api from "@/lib/api";

interface LoginResponse {
  access_token: string;
}

interface ApiErrorResponse {
  detail?: unknown;
  message?: unknown;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      localStorage.setItem(
        "access_token",
        response.data.access_token,
      );

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Login failed:", error);

      if (axios.isAxiosError(error)) {
        const responseData =
          error.response?.data as ApiErrorResponse | undefined;

        const message =
          responseData?.detail ?? responseData?.message;

        if (Array.isArray(message)) {
          const firstError = message[0];

          if (
            typeof firstError === "object" &&
            firstError !== null &&
            "msg" in firstError
          ) {
            const validationMessage = (
              firstError as { msg?: unknown }
            ).msg;

            setError(
              validationMessage
                ? String(validationMessage)
                : "Invalid login details.",
            );
          } else {
            setError("Invalid login details.");
          }

          return;
        }

        if (
          message !== undefined &&
          message !== null &&
          message !== ""
        ) {
          setError(String(message));
          return;
        }

        setError(
          error.message ||
            "Login failed. Please check your credentials.",
        );

        return;
      }

      if (error instanceof Error) {
        setError(
          error.message ||
            "Login failed. Please check your credentials.",
        );

        return;
      }

      setError(
        "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050506] text-white">
      {/* ------------------------------------------------------------------ */}
      {/* Background                                                         */}
      {/* ------------------------------------------------------------------ */}

      <div className="pointer-events-none fixed inset-0">
        {/* Violet glow */}
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[140px]" />

        {/* Cyan glow */}
        <div className="absolute -right-40 top-20 h-[450px] w-[450px] rounded-full bg-cyan-500/[0.05] blur-[130px]" />

        {/* Emerald glow */}
        <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-emerald-500/[0.04] blur-[130px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#050506_90%)]" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Top Navigation                                                     */}
      {/* ------------------------------------------------------------------ */}

      <header className="relative z-20 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl px-2 py-1.5"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-white text-black shadow-lg shadow-white/5">
              <ShieldCheck className="size-4" />
            </span>

            <span className="text-sm font-semibold tracking-tight">
              CodeGuard AI
            </span>
          </Link>

          {/* Back */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-zinc-500 backdrop-blur-xl transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />

            Back to home
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main                                                                */}
      {/* ------------------------------------------------------------------ */}

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_440px] lg:gap-20">
          {/* ---------------------------------------------------------------- */}
          {/* Left Information Panel                                           */}
          {/* ---------------------------------------------------------------- */}

          <div className="hidden lg:block">
            <div className="max-w-xl">
              {/* Badge */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/10 bg-violet-400/[0.05] px-3 py-1.5">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-50" />

                  <span className="relative inline-flex size-1.5 rounded-full bg-violet-400" />
                </span>

                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-300">
                  AI code intelligence
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white xl:text-6xl">
                Review code with
                <span className="block bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-transparent">
                  more context.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-zinc-500">
                ReviewAI investigates your repository, traces
                execution paths, and surfaces the issues that
                actually matter.
              </p>

              {/* Capabilities */}
              <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
                <CapabilityCard
                  icon={<BrainCircuit className="size-4" />}
                  label="AI reasoning"
                  value="Repository-aware"
                  type="violet"
                />

                <CapabilityCard
                  icon={<ShieldCheck className="size-4" />}
                  label="Security"
                  value="Context-aware"
                  type="cyan"
                />

                <CapabilityCard
                  icon={<Sparkles className="size-4" />}
                  label="Analysis"
                  value="Multi-layered"
                  type="emerald"
                />

                <CapabilityCard
                  icon={<LockKeyhole className="size-4" />}
                  label="Access"
                  value="Permission-scoped"
                  type="fuchsia"
                />
              </div>

              {/* Terminal */}
              <div className="mt-6 max-w-lg overflow-hidden rounded-2xl border border-white/[0.07] bg-black/30 backdrop-blur-xl">
                {/* Terminal header */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <span className="size-2 rounded-full bg-red-400/60" />

                  <span className="size-2 rounded-full bg-yellow-400/60" />

                  <span className="size-2 rounded-full bg-emerald-400/60" />

                  <span className="ml-2 font-mono text-[10px] text-zinc-600">
                    reviewai / analysis
                  </span>
                </div>

                {/* Terminal content */}
                <div className="space-y-2 px-4 py-4 font-mono text-[11px]">
                  <TerminalLine
                    prefix="01"
                    text="repository context loaded"
                    status="done"
                  />

                  <TerminalLine
                    prefix="02"
                    text="execution paths traced"
                    status="done"
                  />

                  <TerminalLine
                    prefix="03"
                    text="security analysis complete"
                    status="done"
                  />

                  <TerminalLine
                    prefix="04"
                    text="AI reasoning ready"
                    status="active"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Login Card                                                       */}
          {/* ---------------------------------------------------------------- */}

          <div className="w-full">
            <div className="rounded-3xl border border-white/[0.08] bg-[#09090b]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">
              {/* Card Header */}
              <div className="mb-8">
                <div className="mb-5 flex items-center justify-between">
                  {/* Icon */}
                  <div className="flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                    <ShieldCheck className="size-5 text-violet-300" />
                  </div>

                  {/* Secure status */}
                  <div className="flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.05] px-2.5 py-1">
                    <span className="size-1.5 rounded-full bg-emerald-400" />

                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-emerald-300">
                      Secure access
                    </span>
                  </div>
                </div>

                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400">
                  Welcome back
                </p>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                  Sign in to CodeGuard AI
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Continue reviewing pull requests with
                  AI-powered repository intelligence.
                </p>
              </div>

              {/* ------------------------------------------------------------ */}
              {/* Error                                                          */}
              {/* ------------------------------------------------------------ */}

              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-red-400" />

                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* Login Form                                                     */}
              {/* ------------------------------------------------------------ */}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    disabled={loading}
                    required
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-violet-400/40 focus:bg-white/[0.025] focus:ring-4 focus:ring-violet-400/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-[11px] text-violet-400 transition hover:text-violet-300"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    disabled={loading}
                    required
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-violet-400/40 focus:bg-white/[0.025] focus:ring-4 focus:ring-violet-400/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200 focus:outline-none focus:ring-4 focus:ring-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in

                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* ------------------------------------------------------------ */}
              {/* Divider                                                        */}
              {/* ------------------------------------------------------------ */}

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/[0.06]" />

                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-700">
                  secure connection
                </span>

                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* ------------------------------------------------------------ */}
              {/* Security                                                       */}
              {/* ------------------------------------------------------------ */}

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-600">
                <LockKeyhole className="size-3.5" />

                <span>
                  Your credentials are transmitted securely
                </span>
              </div>

              {/* ------------------------------------------------------------ */}
              {/* Register Link                                                  */}
              {/* ------------------------------------------------------------ */}

              <div className="mt-6 border-t border-white/[0.06] pt-6 text-center">
                <p className="text-sm text-zinc-500">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-violet-400 transition hover:text-violet-300"
                  >
                    Create an account
                  </Link>
                </p>
              </div>

              {/* ------------------------------------------------------------ */}
              {/* GitHub                                                         */}
              {/* ------------------------------------------------------------ */}

              <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-zinc-700">
                <FaGithub className="size-3.5" />

                <span>
                  GitHub integration available after login
                </span>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Trust                                                              */}
            {/* ---------------------------------------------------------------- */}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <TrustItem text="Permission scoped" />

              <TrustItem text="Repository aware" />

              <TrustItem text="Human in the loop" />
            </div>

            <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-700">
              ReviewAI · Intelligent code review platform
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ========================================================================== */
/* Capability Card                                                            */
/* ========================================================================== */

interface CapabilityCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  type: "violet" | "cyan" | "emerald" | "fuchsia";
}

function CapabilityCard({
  icon,
  label,
  value,
  type,
}: CapabilityCardProps) {
  const styles = {
    violet: {
      icon: "border-violet-400/10 bg-violet-400/[0.06] text-violet-300",
      dot: "bg-violet-400",
    },

    cyan: {
      icon: "border-cyan-400/10 bg-cyan-400/[0.06] text-cyan-300",
      dot: "bg-cyan-400",
    },

    emerald: {
      icon: "border-emerald-400/10 bg-emerald-400/[0.06] text-emerald-300",
      dot: "bg-emerald-400",
    },

    fuchsia: {
      icon: "border-fuchsia-400/10 bg-fuchsia-400/[0.06] text-fuchsia-300",
      dot: "bg-fuchsia-400",
    },
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5 transition hover:border-white/[0.1] hover:bg-white/[0.025]">
      <div
        className={`mb-3 flex size-8 items-center justify-center rounded-lg border ${styles[type].icon}`}
      >
        {icon}
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`size-1.5 rounded-full ${styles[type].dot}`}
        />

        <span className="text-[10px] text-zinc-600">
          {label}
        </span>
      </div>

      <p className="mt-1 text-xs font-medium text-zinc-300">
        {value}
      </p>
    </div>
  );
}

/* ========================================================================== */
/* Terminal Line                                                              */
/* ========================================================================== */

interface TerminalLineProps {
  prefix: string;
  text: string;
  status: "done" | "active";
}

function TerminalLine({
  prefix,
  text,
  status,
}: TerminalLineProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-zinc-700">
        {prefix}
      </span>

      {status === "done" ? (
        <Check className="size-3 text-emerald-400" />
      ) : (
        <span className="relative flex size-3 items-center justify-center">
          <span className="absolute size-2 animate-ping rounded-full bg-violet-400/30" />

          <span className="relative size-1.5 rounded-full bg-violet-400" />
        </span>
      )}

      <span
        className={
          status === "done"
            ? "text-zinc-500"
            : "text-violet-300"
        }
      >
        {text}
      </span>
    </div>
  );
}

/* ========================================================================== */
/* Trust Item                                                                 */
/* ========================================================================== */

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Check className="size-3 text-emerald-500/70" />

      <span className="text-[10px] text-zinc-600">
        {text}
      </span>
    </div>
  );
}
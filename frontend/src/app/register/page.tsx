"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

interface RegisterResponse {
  access_token?: string;
  token?: string;
  message?: string;
  user?: {
    id?: number;
    email?: string;
    username?: string;
    name?: string;
  };
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    const message = error.response?.data?.message;

    if (typeof detail === "string") {
      return detail;
    }

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(detail)) {
      const first = detail[0];

      if (typeof first === "string") {
        return first;
      }

      if (first && typeof first === "object" && "msg" in first) {
        return String(first.msg);
      }
    }

    if (error.response?.status === 409) {
      return "An account with this email already exists.";
    }

    if (error.response?.status === 400) {
      return "Please check your registration details.";
    }

    return "Unable to create your account. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050506]">
      {/* Violet glow */}
      <div className="absolute left-1/2 top-[-180px] h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-[150px]" />

      {/* Cyan glow */}
      <div className="absolute left-[-180px] top-[35%] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.04] blur-[150px]" />

      {/* Pink glow */}
      <div className="absolute bottom-[-220px] right-[5%] h-[500px] w-[500px] rounded-full bg-fuchsia-500/[0.035] blur-[150px]" />

      {/* Grid */}
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

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordValid = password.length >= 8;

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!passwordValid) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post<RegisterResponse>(
        `${API_BASE_URL}/auth/register`,
        {
          name: trimmedName,
          email: trimmedEmail,
          password,
        },
      );

      const token =
        response.data.access_token ?? response.data.token ?? null;

      if (token) {
        localStorage.setItem("token", token);
      }

      setSuccess("Account created successfully.");

      setTimeout(() => {
        router.push(token ? "/repositories" : "/login");
      }, 700);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-white sm:px-6">
      <Background />

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href="/"
            className="group mb-5 flex items-center gap-3"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 shadow-lg shadow-violet-950/20">
              <ShieldCheck className="h-6 w-6 text-violet-300" />

              <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-xl transition group-hover:bg-violet-500/20" />
            </div>

            <div className="relative text-left">
              <div className="text-lg font-semibold tracking-tight">
                CodeGuard{" "}
                <span className="text-violet-400">AI</span>
              </div>

              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                AI Code Intelligence
              </div>
            </div>
          </Link>

          {/* Badge */}
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.06] px-3 py-1.5 text-[11px] font-medium text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Start reviewing smarter
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Create your account
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
            Connect your repositories and let AI analyze your code before
            problems reach production.
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">

          {/* GitHub Button */}
          <button
            type="button"
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 text-sm font-medium text-white/85 transition hover:border-white/[0.15] hover:bg-white/[0.06]"
          >
            <FaGithub className="h-5 w-5 text-white/80 transition group-hover:text-white" />

            <span>Continue with GitHub</span>
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/[0.07]" />

            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
              or continue with email
            </span>

            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-xs font-medium text-white/65"
              >
                Full name
              </label>

              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-violet-400/40 focus:bg-white/[0.035] focus:ring-4 focus:ring-violet-500/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-white/65"
              >
                Email address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-violet-400/40 focus:bg-white/[0.035] focus:ring-4 focus:ring-violet-500/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-white/65"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a strong password"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-12 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-violet-400/40 focus:bg-white/[0.035] focus:ring-4 focus:ring-violet-500/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/30 transition hover:text-white/70"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password strength */}
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      password.length === 0
                        ? "w-0"
                        : password.length < 8
                          ? "w-1/3 bg-red-500"
                          : password.length < 12
                            ? "w-2/3 bg-yellow-500"
                            : "w-full bg-emerald-500"
                    }`}
                  />
                </div>

                <span className="text-[10px] text-white/30">
                  {password.length === 0
                    ? "8+ characters"
                    : password.length < 8
                      ? "Too short"
                      : password.length < 12
                        ? "Good"
                        : "Strong"}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-xs font-medium text-white/65"
              >
                Confirm password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Repeat your password"
                  disabled={loading}
                  className={`h-12 w-full rounded-xl border bg-black/20 pl-10 pr-12 text-sm text-white outline-none placeholder:text-white/20 transition focus:bg-white/[0.035] focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-emerald-500/30 focus:border-emerald-400/40 focus:ring-emerald-500/[0.07]"
                        : "border-red-500/30 focus:border-red-400/40 focus:ring-red-500/[0.07]"
                      : "border-white/[0.08] focus:border-violet-400/40 focus:ring-violet-500/[0.07]"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/30 transition hover:text-white/70"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Match status */}
              {confirmPassword.length > 0 && (
                <div
                  className={`mt-2 flex items-center gap-1.5 text-[11px] ${
                    passwordsMatch
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />

                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-sm text-emerald-300">
                {success}
              </div>
            )}

            {/* Terms */}
            <p className="pt-1 text-[11px] leading-5 text-white/30">
              By creating an account, you agree to our{" "}
              <Link
                href="/terms"
                className="text-white/55 transition hover:text-white"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-white/55 transition hover:text-white"
              >
                Privacy Policy
              </Link>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 hover:shadow-violet-900/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-white/[0.08] to-violet-400/0 opacity-0 transition group-hover:opacity-100" />

              {loading ? (
                <>
                  <Loader2 className="relative h-4 w-4 animate-spin" />

                  <span className="relative">
                    Creating account...
                  </span>
                </>
              ) : (
                <>
                  <span className="relative">
                    Create account
                  </span>

                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Login */}
          <div className="mt-6 border-t border-white/[0.06] pt-6 text-center">
            <p className="text-sm text-white/40">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-violet-300 transition hover:text-violet-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Security */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/25">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your code and credentials are protected
        </div>
      </div>
    </main>
  );
}
"use client";

import {
  Activity,
  ArrowUpRight,
  Code2,
  Heart,
  Lock,
  MessageSquare,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#workflow" },
  { label: "Architecture", href: "#architecture" },
  { label: "Pricing", href: "#pricing" },
];

const developerLinks = [
  { label: "Documentation", href: "#docs" },
  { label: "API reference", href: "#api" },
  { label: "GitHub", href: "#github" },
  { label: "Changelog", href: "#changelog" },
];

const companyLinks = [
  { label: "About", href: "#about" },
  { label: "Security", href: "#security" },
  { label: "Contact", href: "#contact" },
  { label: "Status", href: "#status" },
];

const technologies = [
  "Next.js",
  "React",
  "Node.js",
  "Python",
  "FastAPI",
  "PostgreSQL",
  "MongoDB",
  "Docker",
];

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer
      id="footer"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#030304]"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="absolute left-1/2 top-0 h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.04] blur-[140px]" />

        <div className="absolute bottom-0 left-0 h-[250px] w-[350px] rounded-full bg-cyan-500/[0.025] blur-[120px]" />

        <div className="absolute bottom-0 right-0 h-[250px] w-[350px] rounded-full bg-violet-500/[0.025] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* =========================================================
            FOOTER TOP
        ========================================================== */}
        <div className="grid gap-12 py-16 lg:grid-cols-[1.4fr_2fr] lg:py-20">
          {/* Brand */}
          <div className="max-w-md">
            <a
              href="#"
              aria-label="ReviewAI home"
              className="group inline-flex items-center gap-3"
            >
              {/* Logo */}
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/[0.08] transition-all duration-300 group-hover:border-violet-400/40 group-hover:bg-violet-400/[0.12]">
                <Code2 className="h-5 w-5 text-violet-300 transition-transform duration-300 group-hover:scale-110" />

                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              </div>

              {/* Brand name */}
              <div>
                <div className="text-base font-semibold tracking-tight text-white">
                  Review
                  <span className="text-violet-300">AI</span>
                </div>

                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-zinc-700">
                  intelligent code review
                </div>
              </div>
            </a>

            {/* Description */}
            <p className="mt-6 text-sm leading-7 text-zinc-500">
              AI-powered code review that understands your repository, traces
              execution paths, and surfaces the issues that actually matter.
            </p>

            {/* Terminal Status */}
            <div className="mt-7 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-2.5">
                <Terminal className="h-3.5 w-3.5 text-zinc-600" />

                <span className="font-mono text-[9px] text-zinc-600">
                  reviewai status
                </span>

                <div className="ml-auto flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[8px] text-zinc-700">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Status Rows */}
              <div className="space-y-2 px-4 py-3 font-mono text-[9px]">
                <StatusRow
                  label="analysis"
                  status="operational"
                />

                <StatusRow
                  label="github"
                  status="operational"
                />

                <StatusRow
                  label="ai reasoning"
                  status="operational"
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            <FooterColumn
              title="Product"
              links={productLinks}
            />

            <FooterColumn
              title="Developers"
              links={developerLinks}
            />

            <FooterColumn
              title="Company"
              links={companyLinks}
            />
          </div>
        </div>

        {/* =========================================================
            TECHNOLOGY STRIP
        ========================================================== */}
        <div className="border-y border-white/[0.06] py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Technologies */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
                Built for modern codebases
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {technologies.map((technology) => (
                  <span
                    key={technology}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[9px] text-zinc-600 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.035] hover:text-zinc-400"
                  >
                    {technology}
                  </span>
                ))}
              </div>
            </div>

            {/* Engine */}
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-mono text-[9px] text-zinc-700">
                ENGINE
              </span>

              <div className="flex items-center gap-2 rounded-xl border border-violet-400/15 bg-violet-400/[0.04] px-3 py-2">
                <Activity className="h-3.5 w-3.5 text-violet-300" />

                <span className="font-mono text-[9px] text-zinc-400">
                  context → reasoning → review
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            TRUST ROW
        ========================================================== */}
        <div className="grid gap-4 py-8 sm:grid-cols-3">
          <TrustItem
            icon={ShieldCheck}
            title="Security by design"
            description="Permission-scoped repository access"
          />

          <TrustItem
            icon={Lock}
            title="Private by default"
            description="Designed around controlled code exposure"
          />

          <TrustItem
            icon={MessageSquare}
            title="Human in the loop"
            description="AI assists. Engineers decide."
          />
        </div>

        {/* =========================================================
            BOTTOM BAR
        ========================================================== */}
        <div className="flex flex-col gap-6 border-t border-white/[0.06] py-7 sm:flex-row sm:items-center sm:justify-between">
          {/* Copyright */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <p className="text-xs text-zinc-700">
              © 2026 ReviewAI. All rights reserved.
            </p>

            <div className="hidden h-1 w-1 rounded-full bg-zinc-800 sm:block" />

            <p className="flex items-center gap-1.5 text-xs text-zinc-700">
              Built for developers
              <Heart className="h-3 w-3 text-violet-400/70" />
            </p>
          </div>

          {/* Legal + GitHub + Back to Top */}
          <div className="flex flex-wrap items-center gap-5">
            <a
              href="#privacy"
              className="text-xs text-zinc-700 transition-colors hover:text-zinc-400"
            >
              Privacy
            </a>

            <a
              href="#terms"
              className="text-xs text-zinc-700 transition-colors hover:text-zinc-400"
            >
              Terms
            </a>

            <a
              href="#security"
              className="text-xs text-zinc-700 transition-colors hover:text-zinc-400"
            >
              Security
            </a>

            {/* GitHub */}
            <a
              href="#github"
              aria-label="GitHub"
              className="group flex items-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-white"
            >
              <FaGithub className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />

              <span>GitHub</span>

              <ArrowUpRight className="h-3 w-3 -translate-y-0.5 opacity-60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-1 group-hover:opacity-100" />
            </a>

            {/* Back to top */}
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="group flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-zinc-600 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white"
            >
              <span className="text-sm transition-transform duration-200 group-hover:-translate-y-0.5">
                ↑
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ===============================================================
   FOOTER COLUMN
================================================================ */

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
}) {
  return (
    <div>
      <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
        {title}
      </h3>

      <ul className="mt-5 space-y-3.5">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="group inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors duration-200 hover:text-white"
            >
              {link.label}

              <ArrowUpRight className="h-3 w-3 -translate-y-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-60" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===============================================================
   STATUS ROW
================================================================ */

function StatusRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>

      <span className="text-zinc-600">
        {label}
      </span>

      <span className="ml-auto text-emerald-300">
        {status}
      </span>
    </div>
  );
}

/* ===============================================================
   TRUST ITEM
================================================================ */

function TrustItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.015] px-4 py-3.5 transition-all duration-300 hover:border-white/[0.09] hover:bg-white/[0.025]">
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] transition-colors duration-300 group-hover:border-violet-400/15 group-hover:bg-violet-400/[0.05]">
        <Icon className="h-4 w-4 text-zinc-500 transition-colors duration-300 group-hover:text-violet-300" />
      </div>

      {/* Content */}
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-300">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[10px] text-zinc-700">
          {description}
        </p>
      </div>
    </div>
  );
}

export default Footer;
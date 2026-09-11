"use client";

import Link from "next/link";

import {
  Code2,
  GitPullRequest,
  RefreshCw,
} from "lucide-react";

interface DashboardHeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export default function DashboardHeader({
  onRefresh,
  refreshing,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-[#080b10]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
            <Code2
              size={19}
              className="text-blue-400"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              CodeGuard AI
            </p>

            <p className="text-[11px] text-gray-500">
              Developer dashboard
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/repositories"
            className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white sm:flex"
          >
            <GitPullRequest size={16} />
            Repositories
          </Link>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
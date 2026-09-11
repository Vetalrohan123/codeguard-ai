"use client";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "text-blue-400 bg-blue-500/10",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-5 shadow-sm transition hover:border-white/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}
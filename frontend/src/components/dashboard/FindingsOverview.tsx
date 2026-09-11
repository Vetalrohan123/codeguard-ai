"use client";

import {
  AlertTriangle,
  Bug,
  CircleAlert,
  ShieldAlert,
} from "lucide-react";

import type { FindingSeverity } from "@/types/dashboard";

interface FindingsOverviewProps {
  findings: FindingSeverity[];
}

const severityConfig = {
  critical: {
    label: "Critical",
    icon: ShieldAlert,
    bar: "bg-red-500",
    text: "text-red-400",
    background: "bg-red-500/10",
  },

  high: {
    label: "High",
    icon: CircleAlert,
    bar: "bg-orange-500",
    text: "text-orange-400",
    background: "bg-orange-500/10",
  },

  medium: {
    label: "Medium",
    icon: AlertTriangle,
    bar: "bg-amber-500",
    text: "text-amber-400",
    background: "bg-amber-500/10",
  },

  low: {
    label: "Low",
    icon: Bug,
    bar: "bg-blue-500",
    text: "text-blue-400",
    background: "bg-blue-500/10",
  },
} as const;

export default function FindingsOverview({
  findings,
}: FindingsOverviewProps) {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const finding of findings) {
    const severity =
      finding.severity.toLowerCase() as keyof typeof counts;

    if (severity in counts) {
      counts[severity] += finding.count;
    }
  }

  const total = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-6">
      <div>
        <h2 className="text-base font-semibold text-white">
          Findings by Severity
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Issues detected across your reviews
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {(
          Object.keys(severityConfig) as Array<
            keyof typeof severityConfig
          >
        ).map((severity) => {
          const config = severityConfig[severity];
          const Icon = config.icon;
          const count = counts[severity];

          const percentage =
            total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={severity}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.background}`}
                  >
                    <Icon
                      size={16}
                      className={config.text}
                    />
                  </div>

                  <span className="text-sm font-medium text-gray-300">
                    {config.label}
                  </span>
                </div>

                <span className="text-sm font-semibold text-white">
                  {count}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${config.bar} transition-all`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Total findings
          </span>

          <span className="text-lg font-semibold text-white">
            {total}
          </span>
        </div>
      </div>
    </div>
  );
}
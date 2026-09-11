import {
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";

interface ReviewCommentProps {
  title: string;
  description: string;
  suggestion?: string;
  severity?: "high" | "medium" | "low";
}

const severityLabels = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
} as const;

export function ReviewComment({
  title,
  description,
  suggestion,
  severity = "medium",
}: ReviewCommentProps) {
  return (
    <div className="relative border-l border-gold/40 bg-[#171a1d] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">
          <Sparkles className="size-3" />
          AI REVIEW
        </Badge>

        <Badge
          variant={
            severity === "high"
              ? "danger"
              : severity === "low"
                ? "success"
                : "default"
          }
        >
          {severityLabels[severity]}
        </Badge>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-white">
          {title}
        </h4>

        <p className="mt-2 max-w-2xl text-xs leading-6 text-muted">
          {description}
        </p>
      </div>

      {suggestion ? (
        <div className="mt-4 overflow-hidden rounded-md border border-line bg-ink">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="font-mono text-[10px] text-muted">
              SUGGESTED FIX
            </span>

            <CheckCircle2 className="size-3.5 text-gold" />
          </div>

          <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-6 text-code">
            {suggestion}
          </pre>
        </div>
      ) : null}

      <button
        type="button"
        className="mt-4 inline-flex items-center gap-1.5 rounded-sm font-mono text-[10px] text-muted transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold motion-reduce:transition-none"
      >
        Inspect context
        <ArrowUpRight className="size-3" />
      </button>
    </div>
  );
}
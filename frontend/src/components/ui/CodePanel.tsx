import type { ReactNode } from "react";

interface CodePanelProps {
  children: ReactNode;
  fileName?: string;
  branch?: string;
  status?: string;
  className?: string;
}

export function CodePanel({
  children,
  fileName = "auth/session.ts",
  branch = "feat/session-refresh",
  status = "Reviewed",
  className = "",
}: CodePanelProps) {
  return (
    <div
      className={[
        "overflow-hidden",
        "rounded-xl",
        "border",
        "border-line",
        "bg-panel",
        "shadow-panel",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col border-b border-line sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 px-4 py-3">
          <span className="size-2 rounded-full bg-gold" />

          <span className="truncate font-mono text-[11px] text-code">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-4 border-t border-line px-4 py-3 sm:border-t-0">
          <span className="font-mono text-[10px] text-muted">
            {branch}
          </span>

          <span className="font-mono text-[10px] text-[#91d7b4]">
            ● {status}
          </span>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
import type { ReactNode } from "react";

export type DiffLineType =
  | "context"
  | "addition"
  | "deletion";

interface DiffLineProps {
  lineNumber: number;
  type?: DiffLineType;
  children: ReactNode;
  highlighted?: boolean;
}

const lineStyles: Record<DiffLineType, string> = {
  context: "bg-panel",
  addition: "bg-diffAdd",
  deletion: "bg-diffRemove",
};

const prefixStyles: Record<DiffLineType, string> = {
  context: "text-muted",
  addition: "text-[#91d7b4]",
  deletion: "text-[#f0a6ae]",
};

const prefixes: Record<DiffLineType, string> = {
  context: " ",
  addition: "+",
  deletion: "-",
};

export function DiffLine({
  lineNumber,
  type = "context",
  children,
  highlighted = false,
}: DiffLineProps) {
  return (
    <div
      className={[
        "grid",
        "grid-cols-[48px_24px_minmax(0,1fr)]",
        "min-h-7",
        "items-start",
        "font-mono",
        "text-[11px]",
        "leading-7",
        "sm:grid-cols-[56px_24px_minmax(0,1fr)]",
        lineStyles[type],
        highlighted
          ? "relative ring-1 ring-inset ring-gold/50"
          : "",
      ].join(" ")}
    >
      <span className="select-none border-r border-line/70 px-2 text-right text-muted/50">
        {lineNumber}
      </span>

      <span
        className={[
          "select-none",
          "text-center",
          prefixStyles[type],
        ].join(" ")}
      >
        {prefixes[type]}
      </span>

      <code className="min-w-0 overflow-x-auto whitespace-pre px-2 text-code">
        {children}
      </code>
    </div>
  );
}
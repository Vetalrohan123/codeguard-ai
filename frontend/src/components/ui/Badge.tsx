import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "gold"
  | "danger"
  | "success";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default:
    "border-line bg-panel text-muted",

  gold:
    "border-[#6a5523] bg-[#2a2414] text-gold",

  danger:
    "border-[#69323a] bg-diffRemove text-[#f0a6ae]",

  success:
    "border-[#285a45] bg-diffAdd text-[#91d7b4]",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex",
        "items-center",
        "gap-1.5",
        "rounded-full",
        "border",
        "px-2.5",
        "py-1",
        "font-mono",
        "text-[10px]",
        "leading-none",
        variants[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
} 
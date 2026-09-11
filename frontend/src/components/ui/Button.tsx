import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-ink hover:bg-[#f0c968] focus-visible:ring-gold",
  secondary:
    "border border-line bg-panel text-white hover:border-muted hover:bg-[#171c22] focus-visible:ring-gold",
  ghost:
    "text-muted hover:text-white focus-visible:ring-gold",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
}: ButtonProps) {
  const classes = [
    "inline-flex",
    "min-h-11",
    "items-center",
    "justify-center",
    "gap-2",
    "rounded-md",
    "px-5",
    "text-sm",
    "font-medium",
    "transition-colors",
    "duration-200",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-ink",
    "motion-reduce:transition-none",
    variants[variant],
    className,
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  );
}
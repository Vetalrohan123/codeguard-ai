"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";

const navigation = [
  {
    label: "Product",
    href: "#product",
  },
  {
    label: "How it works",
    href: "#how-it-works",
  },
  {
    label: "Security",
    href: "#security",
  },
  {
    label: "Pricing",
    href: "#pricing",
  },
  {
    label: "Docs",
    href: "#docs",
  },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="glass-panel mx-auto max-w-6xl rounded-2xl shadow-2xl shadow-black/20">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            onClick={() => setOpen(false)}
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-white text-black">
              <ShieldCheck className="size-4" />
            </span>

            <span className="text-sm font-semibold tracking-tight text-white">
              CodeGuard AI
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-7 md:flex">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs text-zinc-500 transition-colors hover:text-white motion-reduce:transition-none"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Login */}
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-xs text-zinc-400 transition-colors hover:text-white motion-reduce:transition-none"
            >
              Log in
            </Link>

            {/* Get started */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-200 motion-reduce:transition-none"
            >
              Get started
              <ArrowUpRight className="size-3" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors hover:text-white md:hidden"
          >
            {open ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </button>
        </div>

        {/* Mobile navigation */}
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden md:hidden"
            >
              <div className="border-t border-white/[0.07] px-4 pb-4 pt-3">
                {/* Navigation links */}
                <div className="grid gap-1">
                  {navigation.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-3 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>

                {/* Mobile actions */}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-3">
                  {/* Login */}
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-white/[0.08] px-3 py-2.5 text-center text-xs text-zinc-400 transition-colors hover:border-white/[0.15] hover:bg-white/[0.04] hover:text-white"
                  >
                    Log in
                  </Link>

                  {/* Get started */}
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2.5 text-xs font-medium text-black transition-colors hover:bg-zinc-200"
                  >
                    <FaGithub className="size-3.5" />
                    Get started
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </header>
  );
}
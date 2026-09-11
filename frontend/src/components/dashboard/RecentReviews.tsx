"use client";

import Link from "next/link";

import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  GitPullRequest,
  XCircle,
} from "lucide-react";

import type { RecentReview } from "@/types/dashboard";

interface RecentReviewsProps {
  reviews: RecentReview[];
}

function getScoreColor(score: number | null) {
  if (score === null) {
    return "text-gray-500";
  }

  if (score >= 90) {
    return "text-emerald-400";
  }

  if (score >= 75) {
    return "text-blue-400";
  }

  if (score >= 60) {
    return "text-amber-400";
  }

  return "text-red-400";
}

function getStatusIcon(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "analyzed" ||
    normalized === "success"
  ) {
    return CheckCircle2;
  }

  if (
    normalized === "failed" ||
    normalized === "error"
  ) {
    return XCircle;
  }

  return Clock3;
}

function getStatusColor(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "analyzed" ||
    normalized === "success"
  ) {
    return "text-emerald-400";
  }

  if (
    normalized === "failed" ||
    normalized === "error"
  ) {
    return "text-red-400";
  }

  return "text-amber-400";
}

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export default function RecentReviews({
  reviews,
}: RecentReviewsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 p-6">
        <div>
          <h2 className="text-base font-semibold text-white">
            Recent Reviews
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Your latest code analysis activity
          </p>
        </div>

        <Link
          href="/repositories"
          className="flex items-center gap-1 text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          View repositories
          <ArrowUpRight size={15} />
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
            <GitPullRequest
              size={21}
              className="text-gray-500"
            />
          </div>

          <p className="mt-4 text-sm font-medium text-gray-300">
            No reviews yet
          </p>

          <p className="mt-1 max-w-sm text-xs text-gray-500">
            Run an AI code review on a pull request to see
            your review history here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {reviews.map((review) => {
            const StatusIcon = getStatusIcon(
              review.status
            );

            return (
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="block px-6 py-5 transition hover:bg-white/[0.025]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <GitPullRequest
                        size={16}
                        className="shrink-0 text-purple-400"
                      />

                      <span className="truncate text-sm font-semibold text-white">
                        {review.repository_name}
                      </span>

                      {review.pull_request_number !==
                        null && (
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-400">
                          #{review.pull_request_number}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <StatusIcon
                        size={14}
                        className={getStatusColor(
                          review.status
                        )}
                      />

                      <span className="text-xs capitalize text-gray-500">
                        {review.status}
                      </span>

                      <span className="text-gray-700">
                        •
                      </span>

                      <span className="text-xs text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>

                    {review.summary && (
                      <p className="mt-3 line-clamp-1 text-xs text-gray-500">
                        {review.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`text-xl font-bold ${getScoreColor(
                          review.score
                        )}`}
                      >
                        {review.score !== null
                          ? review.score.toFixed(1)
                          : "—"}
                      </p>

                      <p className="text-[11px] text-gray-600">
                        score
                      </p>
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="text-gray-600"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

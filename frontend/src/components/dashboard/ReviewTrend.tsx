"use client";

import type { ReviewTrend as ReviewTrendPoint } from "@/types/dashboard";

interface ReviewTrendProps {
  data: ReviewTrendPoint[];
}

export default function ReviewTrend({
  data,
}: ReviewTrendProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-6">
        <h2 className="text-base font-semibold text-white">
          Code Quality Trend
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Review scores over time
        </p>

        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-gray-500">
            No review history available yet.
          </p>
        </div>
      </div>
    );
  }

  const width = 800;
  const height = 260;
  const paddingX = 48;
  const paddingY = 30;

  const scores = data.map((item) =>
    Math.max(0, Math.min(100, item.score)),
  );

  const minScore = Math.max(
    0,
    Math.floor(Math.min(...scores) / 10) * 10 - 10,
  );

  const maxScore = Math.min(
    100,
    Math.ceil(Math.max(...scores) / 10) * 10 + 10,
  );

  const range = Math.max(1, maxScore - minScore);

  const points = scores.map((score, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX +
          (index / (data.length - 1)) *
            (width - paddingX * 2);

    const y =
      height -
      paddingY -
      ((score - minScore) / range) *
        (height - paddingY * 2);

    return {
      x,
      y,
      score,
    };
  });

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
    )
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-6">
      <div>
        <h2 className="text-base font-semibold text-white">
          Code Quality Trend
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Review scores over time
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-64 min-w-[650px] w-full"
          preserveAspectRatio="none"
        >
          {[0, 1, 2, 3, 4].map((index) => {
            const y =
              paddingY +
              (index / 4) *
                (height - paddingY * 2);

            const value =
              maxScore -
              (index / 4) * range;

            return (
              <g key={index}>
                <line
                  x1={paddingX}
                  x2={width - paddingX}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-white/5"
                />

                <text
                  x="8"
                  y={y + 4}
                  fontSize="11"
                  fill="currentColor"
                  className="text-gray-600"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500"
          />

          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="currentColor"
                className="text-[#0d1117]"
                stroke="currentColor"
                strokeWidth="3"
              />

              <title>
                {point.score.toFixed(1)}
              </title>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex justify-between px-12 text-[11px] text-gray-600">
        <span>
          {new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
          }).format(new Date(data[0].date))}
        </span>

        <span>
          {new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
          }).format(
            new Date(data[data.length - 1].date),
          )}
        </span>
      </div>
    </div>
  );
}
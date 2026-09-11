"use client";

interface ReviewScoreCardProps {
  score: number;
}

function getScoreColor(score: number) {
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

function getScoreLabel(score: number) {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 75) {
    return "Good";
  }

  if (score >= 60) {
    return "Needs attention";
  }

  return "Critical";
}

export default function ReviewScoreCard({
  score,
}: ReviewScoreCardProps) {
  const safeScore = Math.max(0, Math.min(100, score));

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (safeScore / 100) * circumference;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">
            Overall Code Quality
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Average score across analyzed reviews
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center">
        <div className="relative h-40 w-40">
          <svg
            className="-rotate-90"
            width="160"
            height="160"
            viewBox="0 0 160 160"
          >
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-white/5"
            />

            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={getScoreColor(safeScore)}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-4xl font-bold ${getScoreColor(
                safeScore,
              )}`}
            >
              {safeScore.toFixed(1)}
            </span>

            <span className="mt-1 text-xs text-gray-500">
              / 100
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 text-center">
        <p
          className={`text-sm font-semibold ${getScoreColor(
            safeScore,
          )}`}
        >
          {getScoreLabel(safeScore)}
        </p>
      </div>
    </div>
  );
}
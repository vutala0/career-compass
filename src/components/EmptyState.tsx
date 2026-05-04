"use client";

import Link from "next/link";

interface EmptyStateProps {
  variant: "no-matches" | "error";
  message?: string;
  onRetry?: () => void;
}

export default function EmptyState({ variant, message, onRetry }: EmptyStateProps) {
  if (variant === "no-matches") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <h3 className="text-lg font-semibold text-slate-900">
          We couldn&apos;t find strong matches yet.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Your profile might be too sparse — try adding more skills, or describing
          what you actually do day-to-day. Different profiles produce dramatically
          different recommendations.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            ← Refine your profile
          </Link>
        </div>
      </div>
    );
  }

  // variant === "error"
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8">
      <h3 className="text-lg font-semibold text-red-900">
        Something went wrong.
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-red-800">
        {message ??
          "We couldn't generate your recommendations right now. The AI service may be temporarily unavailable."}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Try again
          </button>
        )}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900"
          prefetch={false}
        >
          Back to start
        </Link>
      </div>
    </div>
  );
}
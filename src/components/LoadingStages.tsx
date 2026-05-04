"use client";

import { useEffect, useState } from "react";
import { getCurrentStage, shouldOfferRetry, LoadingStage } from "@/lib/loading-stages";

interface LoadingStagesProps {
  startTime: number;
  onRetry?: () => void;
}

export default function LoadingStages({ startTime, onRetry }: LoadingStagesProps) {
  const [stage, setStage] = useState<LoadingStage>(getCurrentStage(0));
  const [showRetry, setShowRetry] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      setElapsed(elapsedMs);
      setStage(getCurrentStage(elapsedMs));
      setShowRetry(shouldOfferRetry(elapsedMs));
    }, 250);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <div className="flex items-start gap-4">
        {/* Animated indicator */}
        <div className="mt-1 flex-shrink-0">
          <PulseDot />
        </div>

        {/* Stage messaging */}
        <div className="flex-1">
          <p className="text-base font-medium text-slate-900 transition-opacity duration-300">
            {stage.message}
          </p>
          {stage.subtext && (
            <p className="mt-1 text-sm text-slate-500">{stage.subtext}</p>
          )}

          {/* Progress dots — show how many stages we've passed */}
          <div className="mt-5 flex items-center gap-2">
            {[0, 3000, 7000, 12000, 18000].map((stageStartMs, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  elapsed >= stageStartMs ? "bg-slate-900" : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Elapsed time, soft */}
          <p className="mt-3 text-xs text-slate-400">
            {Math.floor(elapsed / 1000)}s elapsed
          </p>

          {/* Retry button only after 90s (Decision #54) */}
          {showRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PulseDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-400 opacity-50"></span>
      <span className="relative inline-flex h-3 w-3 rounded-full bg-slate-900"></span>
    </span>
  );
}
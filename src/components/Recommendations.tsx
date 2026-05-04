"use client";

import { useEffect, useState, useCallback } from "react";
import { UserProfile } from "@/lib/profile-storage";
import { Agent1Recommendation } from "@/lib/agent-1-prompt";
import {
  saveAgent1Response,
  loadAgent1Response,
} from "@/lib/agent-1-storage";
import LoadingStages from "./LoadingStages";
import RecommendationGroup from "./RecommendationGroup";
import EmptyState from "./EmptyState";

interface RecommendationsProps {
  profile: UserProfile;
}

interface SuccessPayload {
  recommendations: Agent1Recommendation[];
  summary_message: string;
  partial: boolean;
  meta: {
    requested: number;
    returned_by_gemini: number;
    valid_after_filter: number;
    latency_ms: number;
    model: string;
  };
}

type Phase =
  | { kind: "loading"; startTime: number }
  | { kind: "success"; data: SuccessPayload }
  | { kind: "no-matches"; message?: string }
  | { kind: "error"; message: string };

// Tally form ID — replace with yours if you remix
const TALLY_FORM_ID = "pb4R18";

export default function Recommendations({ profile }: RecommendationsProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading", startTime: Date.now() });

  const callAgent1 = useCallback(async (forceFresh: boolean = false) => {
    if (!forceFresh) {
      const cached = loadAgent1Response();
      if (cached) {
        setPhase({
          kind: "success",
          data: {
            recommendations: cached.recommendations,
            summary_message: cached.summary_message,
            partial: cached.partial,
            meta: cached.meta,
          },
        });
        return;
      }
    }

    setPhase({ kind: "loading", startTime: Date.now() });

    try {
      const res = await fetch("/api/agent-1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPhase({
          kind: "error",
          message: data.error ?? "Something went wrong. Please try again.",
        });
        return;
      }

      if (data.error) {
        setPhase({ kind: "no-matches", message: data.error });
        return;
      }

      if (
        !Array.isArray(data.recommendations) ||
        typeof data.summary_message !== "string"
      ) {
        setPhase({
          kind: "error",
          message: "We received an unexpected response. Please try again.",
        });
        return;
      }

      saveAgent1Response({
        recommendations: data.recommendations,
        summary_message: data.summary_message,
        partial: data.partial ?? false,
        meta: data.meta ?? {
          requested: 5,
          returned_by_gemini: data.recommendations.length,
          valid_after_filter: data.recommendations.length,
          latency_ms: 0,
          model: "unknown",
        },
      });

      setPhase({
        kind: "success",
        data: {
          recommendations: data.recommendations,
          summary_message: data.summary_message,
          partial: data.partial ?? false,
          meta: data.meta,
        },
      });
    } catch (err) {
      console.error("Recommendations: fetch failed:", err);
      setPhase({
        kind: "error",
        message:
          err instanceof Error
            ? "Network error. Check your connection and try again."
            : "Something went wrong. Please try again.",
      });
    }
  }, [profile]);

  useEffect(() => {
    callAgent1();
  }, [callAgent1]);

  // Load the Tally script once recommendations are visible
  useEffect(() => {
    if (phase.kind !== "success") return;

    const existing = document.querySelector('script[src="https://tally.so/widgets/embed.js"]');
    if (existing) {
      // Script already loaded; just trigger embed reload
      const tally = (window as unknown as { Tally?: { loadEmbeds: () => void } }).Tally;
      if (tally) tally.loadEmbeds();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, [phase.kind]);

  if (phase.kind === "loading") {
    return (
      <LoadingStages
        startTime={phase.startTime}
        onRetry={() => callAgent1(true)}
      />
    );
  }

  if (phase.kind === "error") {
    return (
      <EmptyState
        variant="error"
        message={phase.message}
        onRetry={() => callAgent1(true)}
      />
    );
  }

  if (phase.kind === "no-matches") {
    return <EmptyState variant="no-matches" message={phase.message} />;
  }

  const { data } = phase;
  const nearFit = data.recommendations.filter((r) => r.fit_level === "near-fit");
  const moderate = data.recommendations.filter((r) => r.fit_level === "moderate-pivot");
  const aspirational = data.recommendations.filter((r) => r.fit_level === "aspirational");

  let runningRank = 1;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Your roles
        </h2>
        <p className="mt-2 text-base leading-relaxed text-slate-600">
          {data.summary_message}
        </p>
      </div>

      {data.partial && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            We surfaced{" "}
            <strong>
              {data.recommendations.length} strong match
              {data.recommendations.length === 1 ? "" : "es"}
            </strong>{" "}
            given what we know about you. Add more skills or describe your day-to-day to unlock more.
          </p>
        </div>
      )}

      {nearFit.length > 0 && (() => {
        const start = runningRank;
        runningRank += nearFit.length;
        return (
          <RecommendationGroup
            level="near-fit"
            recommendations={nearFit}
            startingRank={start}
          />
        );
      })()}

      {moderate.length > 0 && (() => {
        const start = runningRank;
        runningRank += moderate.length;
        return (
          <RecommendationGroup
            level="moderate-pivot"
            recommendations={moderate}
            startingRank={start}
          />
        );
      })()}

      {aspirational.length > 0 && (() => {
        const start = runningRank;
        runningRank += aspirational.length;
        return (
          <RecommendationGroup
            level="aspirational"
            recommendations={aspirational}
            startingRank={start}
          />
        );
      })()}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Coming soon
        </h3>
        <p className="mt-3 text-base text-slate-700">
          For each role you&apos;ve discovered, we&apos;re building:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
          <li>· Skill gap analysis — what you have vs. what you need</li>
          <li>· Step-by-step learning path — courses, books, projects</li>
          <li>· Trust Layer — verifiable evidence behind every recommendation</li>
        </ul>
        <div className="mt-5 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-700">
            Want to be the first to try it?
          </p>
          <div className="mt-3">
            <iframe
              data-tally-src={`https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`}
              loading="lazy"
              width="100%"
              height={150}
              frameBorder={0}
              title="Career Compass — Phase 2 waitlist"
              className="rounded-lg"
            ></iframe>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        {data.recommendations.length} recommendation
        {data.recommendations.length === 1 ? "" : "s"} · {data.meta.model} ·{" "}
        {(data.meta.latency_ms / 1000).toFixed(1)}s
      </p>
    </div>
  );
}
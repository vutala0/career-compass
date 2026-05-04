"use client";

import { useState } from "react";
import { Agent1Recommendation } from "@/lib/agent-1-prompt";
import rolesData from "@/data/roles.json";

type DBRole = (typeof rolesData)[number];

interface RecommendationCardProps {
  rank: number;
  rec: Agent1Recommendation;
}

const ROLE_LOOKUP = new Map<string, DBRole>(
  rolesData.map((r) => [r.id, r])
);

const FIT_LEVEL_STYLES: Record<Agent1Recommendation["fit_level"], { badge: string; accent: string }> = {
  "near-fit": {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    accent: "bg-emerald-500",
  },
  "moderate-pivot": {
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    accent: "bg-blue-500",
  },
  aspirational: {
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
    accent: "bg-purple-500",
  },
};

const FIT_LEVEL_LABELS: Record<Agent1Recommendation["fit_level"], string> = {
  "near-fit": "Near-fit",
  "moderate-pivot": "Moderate pivot",
  aspirational: "Aspirational",
};

export default function RecommendationCard({ rank, rec }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const dbRole = ROLE_LOOKUP.get(rec.role_id);
  const styles = FIT_LEVEL_STYLES[rec.fit_level];

  if (!dbRole) {
    console.warn(`RecommendationCard: unknown role_id "${rec.role_id}"`);
    return null;
  }

  const employerCount = Array.isArray(dbRole.real_employers) ? dbRole.real_employers.length : 0;
  const sampleUrl = dbRole._meta?.sample_url;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left transition"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${styles.accent}`} />

          <div className="flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                {dbRole.title}
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
                {FIT_LEVEL_LABELS[rec.fit_level]}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="capitalize">{dbRole.function}</span>
              <span>·</span>
              <span>{dbRole.seniority_band}</span>
              {employerCount > 0 && (
                <>
                  <span>·</span>
                  <span>
                    Hiring at {employerCount} compan{employerCount === 1 ? "y" : "ies"}
                  </span>
                </>
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {rec.why_this_fits}
            </p>

            <p className="mt-3 text-xs text-slate-400">
              {expanded ? "Tap to collapse ↑" : "Tap to see why →"}
            </p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-stone-50 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                From your profile
              </p>
              <ul className="mt-2 space-y-1">
                {rec.key_profile_signals.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700">
                    · {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                From the role
              </p>
              <ul className="mt-2 space-y-1">
                {rec.key_role_signals.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700">
                    · {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {employerCount > 0 && (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Real employers in our database
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {dbRole.real_employers.slice(0, 8).join(", ")}
                {employerCount > 8 && (
                  <span className="text-slate-500"> +{employerCount - 8} more</span>
                )}
              </p>
            </div>
          )}

          {Array.isArray(dbRole.tags) && dbRole.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {dbRole.tags.slice(0, 6).map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-white px-2.5 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {sampleUrl && (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <a
                href={sampleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                See real job posting →
              </a>
              <p className="mt-2 text-xs text-slate-400">
                Sample posting from one of our verified employers. Opens in new tab.
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-400">
            <span>Recommendation #{rank}</span>
            <span>fit score: {rec.fit_score.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
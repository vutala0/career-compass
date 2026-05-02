"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/profile-storage";
import { Agent1Recommendation } from "@/lib/agent-1-prompt";
import rolesData from "@/data/roles.json";

interface SuccessResponse {
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

interface ErrorResponse {
  error: string;
  debugMessage?: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

// Build a quick lookup table for role details (for displaying alongside recommendations)
const ROLE_LOOKUP = new Map(rolesData.map((r) => [r.id, r]));

// Test fixtures — pre-built profiles for fast iteration
const TEST_PROFILES: { name: string; profile: UserProfile }[] = [
  {
    name: "Priya — Operations Generalist (canonical persona)",
    profile: {
      currentRole: "Operations Generalist",
      yearsOfExperience: 3,
      skills: [
        "stakeholder management",
        "project management",
        "process improvement",
        "cross-functional",
        "data analysis",
        "customer onboarding",
      ],
      dayToDay:
        "I run customer onboarding calls, build dashboards in Excel, coordinate with vendors, and write internal docs. Lots of context-switching.",
      interests: ["Product", "Customer", "Operations"],
      educationLevel: "Bachelor's",
      educationField: "Engineering",
    },
  },
  {
    name: "Sparse profile — minimum required fields only",
    profile: {
      currentRole: "Marketing Coordinator",
      yearsOfExperience: 2,
      skills: ["content writing", "social media"],
    },
  },
  {
    name: "Senior generalist with design interests",
    profile: {
      currentRole: "Project Manager",
      yearsOfExperience: 7,
      skills: [
        "stakeholder management",
        "roadmap",
        "wireframing",
        "go-to-market",
        "experimentation",
        "prototyping",
      ],
      dayToDay:
        "Lead cross-functional teams across product, design, and eng. Frequently in figma reviewing mockups. Run user interviews.",
      interests: ["Product", "Design"],
    },
  },
  {
    name: "Customer success early-career",
    profile: {
      currentRole: "Customer Success Associate",
      yearsOfExperience: 1,
      skills: [
        "customer onboarding",
        "stakeholder management",
        "live chat",
        "communication skills",
      ],
      dayToDay:
        "I respond to customer tickets and run onboarding calls for new accounts. Want to figure out where this could lead.",
      interests: ["Customer", "Operations"],
    },
  },
];

export default function Agent1TestPage() {
  const [selectedProfileIdx, setSelectedProfileIdx] = useState(0);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedProfile = TEST_PROFILES[selectedProfileIdx].profile;

  const handleSubmit = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/agent-1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: selectedProfile }),
      });

      const data: ApiResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        error: "Network error. Check that the dev server is running.",
        debugMessage: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = (r: ApiResponse | null): r is SuccessResponse =>
    r !== null && "recommendations" in r;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 px-6 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Internal · Block J
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Agent 1: Role Discovery — Test
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Picks a profile, calls /api/agent-1, shows recommendations with
            grounding. Remove before shipping to users.
          </p>
        </div>

        {/* Profile selector */}
        <div className="mb-6">
          <label
            htmlFor="profile-select"
            className="block text-sm font-medium text-slate-900"
          >
            Test profile
          </label>
          <select
            id="profile-select"
            value={selectedProfileIdx}
            onChange={(e) => {
              setSelectedProfileIdx(Number(e.target.value));
              setResponse(null);
            }}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-slate-900 focus:outline-none"
            disabled={loading}
          >
            {TEST_PROFILES.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Profile preview */}
        <details className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-900">
            Show profile JSON
          </summary>
          <pre className="mt-3 overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(selectedProfile, null, 2)}
          </pre>
        </details>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Calling Agent 1..." : "Run Agent 1 →"}
        </button>

        {/* Response area */}
        {(response || loading) && (
          <div className="mt-10 border-t border-slate-200 pt-8">
            {loading && (
              <div className="rounded-lg bg-slate-100 p-6 text-sm text-slate-500">
                Waiting for Gemini... typically 4-7 seconds for full pass.
              </div>
            )}

            {response && !isSuccess(response) && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-900">
                  {response.error}
                </p>
                {response.debugMessage && (
                  <p className="mt-2 font-mono text-xs text-red-700">
                    Debug: {response.debugMessage}
                  </p>
                )}
              </div>
            )}

            {response && isSuccess(response) && (
              <>
                {/* Meta info */}
                <div className="mb-6 flex flex-wrap gap-4 rounded-lg bg-slate-100 p-4 text-xs text-slate-600">
                  <span>⏱ {response.meta.latency_ms}ms</span>
                  <span>· {response.meta.model}</span>
                  <span>
                    · Gemini returned {response.meta.returned_by_gemini}
                  </span>
                  <span>
                    · Valid after filter: {response.meta.valid_after_filter}
                  </span>
                  {response.partial && (
                    <span className="font-medium text-amber-700">
                      · partial response
                    </span>
                  )}
                </div>

                {/* Summary */}
                <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Summary
                  </p>
                  <p className="mt-2 text-base text-slate-900">
                    {response.summary_message}
                  </p>
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  {response.recommendations.map((rec, idx) => {
                    const dbRole = ROLE_LOOKUP.get(rec.role_id);
                    return (
                      <RecommendationCard
                        key={idx}
                        rank={idx + 1}
                        rec={rec}
                        dbRole={dbRole}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({
  rank,
  rec,
  dbRole,
}: {
  rank: number;
  rec: Agent1Recommendation;
  dbRole: (typeof rolesData)[number] | undefined;
}) {
  const levelStyles: Record<string, string> = {
    "near-fit": "bg-emerald-100 text-emerald-800",
    "moderate-pivot": "bg-blue-100 text-blue-800",
    aspirational: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">#{rank}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelStyles[rec.fit_level] ?? "bg-slate-100"}`}
            >
              {rec.fit_level}
            </span>
            <span className="text-xs text-slate-500">
              fit: {rec.fit_score.toFixed(2)}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">
            {dbRole?.title ?? `[Unknown role: ${rec.role_id}]`}
          </h3>
          {dbRole && (
            <p className="mt-1 text-xs text-slate-500">
              {dbRole.id} · {dbRole.function} · {dbRole.category} ·{" "}
              {dbRole.seniority_band}
              {Array.isArray(dbRole.real_employers) &&
                ` · ${dbRole.real_employers.length} employers`}
            </p>
          )}
        </div>
      </div>

      {/* Why this fits */}
      <p className="mt-4 text-base text-slate-800">{rec.why_this_fits}</p>

      {/* Signals */}
      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            From your profile
          </p>
          <ul className="mt-1 space-y-0.5">
            {rec.key_profile_signals.map((s, i) => (
              <li key={i} className="text-xs text-slate-600">
                · {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            From the role
          </p>
          <ul className="mt-1 space-y-0.5">
            {rec.key_role_signals.map((s, i) => (
              <li key={i} className="text-xs text-slate-600">
                · {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Real employers (from database) */}
      {dbRole &&
        Array.isArray(dbRole.real_employers) &&
        dbRole.real_employers.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Real employers in our database
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {dbRole.real_employers.slice(0, 8).join(", ")}
              {dbRole.real_employers.length > 8 &&
                ` +${dbRole.real_employers.length - 8} more`}
            </p>
          </div>
        )}
    </div>
  );
}
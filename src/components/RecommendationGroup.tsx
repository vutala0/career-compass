"use client";

import { Agent1Recommendation } from "@/lib/agent-1-prompt";
import RecommendationCard from "./RecommendationCard";

interface RecommendationGroupProps {
  level: Agent1Recommendation["fit_level"];
  recommendations: Agent1Recommendation[];
  startingRank: number;
}

const GROUP_HEADERS: Record<Agent1Recommendation["fit_level"], { label: string; subtitle: string }> = {
  "near-fit": {
    label: "Near-fit",
    subtitle: "Roles you could move into with the skills you have today",
  },
  "moderate-pivot": {
    label: "Moderate pivot",
    subtitle: "Different functions where your skills transfer",
  },
  aspirational: {
    label: "Aspirational",
    subtitle: "Roles worth growing into over the next few years",
  },
};

export default function RecommendationGroup({ level, recommendations, startingRank }: RecommendationGroupProps) {
  if (recommendations.length === 0) return null;

  const header = GROUP_HEADERS[level];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {header.label}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{header.subtitle}</p>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <RecommendationCard
            key={rec.role_id}
            rank={startingRank + idx}
            rec={rec}
          />
        ))}
      </div>
    </section>
  );
}
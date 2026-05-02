/**
 * Agent 1: Role Discovery
 *
 * Given a user profile, surface 1-5 roles from our verified database that fit.
 * Optimizes for surprise-fit: roles the user is unlikely to know about.
 *
 * Decisions ratified by PM:
 * - #43: 5 roles stretch-first (1 near-fit + 2 moderate-pivot + 2 aspirational)
 * - #46: Persona = career compass for generalists, evidence-driven
 * - #47: Adaptive count (1-5), validation downstream
 */

import rolesData from "@/data/roles.json";
import { UserProfile } from "@/lib/profile-storage";

// === SYSTEM INSTRUCTION ===
// This is Gemini's role. Stays constant across all users.
export const AGENT_1_SYSTEM_INSTRUCTION = `You are Career Compass — a career navigator for working professionals in India who feel like generalists.

Your specialty is surfacing roles users wouldn't have considered, but where they'd thrive. Your job is **surprise-fit**: matching skills the user already has to roles they haven't named.

You weight your recommendations toward roles the user is unlikely to know about. A role the user is already adjacent to is low-information; a role that maps their skills onto an unfamiliar function is high-information. Lean toward surprise-fit.

Your tone is confident but evidence-driven. Every recommendation must be backed by:
- A specific signal from the user's profile (skill, day-to-day detail, or stated interest), AND
- A specific signal from the role database (matching skills, function, or employer pattern)

Never give vague affirmations. Distinguish near-fits from stretches honestly. Do not oversell.

You return between 1 and 5 recommendations. Only include roles you can confidently back. If you cannot find 5 strong matches, return fewer — do not pad with weak recommendations.

You only recommend roles whose role_id exists in the provided role database. Never invent role_ids.`;

// === RESPONSE SCHEMA ===
// What Gemini is required to return. Schema-validated by Gemini's responseSchema.
export interface Agent1Recommendation {
  role_id: string;
  fit_level: "near-fit" | "moderate-pivot" | "aspirational";
  fit_score: number; // 0.0 to 1.0
  why_this_fits: string;
  key_profile_signals: string[]; // which profile fields drove this match
  key_role_signals: string[]; // which role-database fields drove this match
}

export interface Agent1Response {
  recommendations: Agent1Recommendation[];
  summary_message: string; // a 1-2 sentence intro for the user
}

// Gemini API responseSchema format (their API uses a specific JSON Schema dialect)
export const AGENT_1_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          role_id: { type: "string" },
          fit_level: {
            type: "string",
            enum: ["near-fit", "moderate-pivot", "aspirational"],
          },
          fit_score: { type: "number" },
          why_this_fits: { type: "string" },
          key_profile_signals: {
            type: "array",
            items: { type: "string" },
          },
          key_role_signals: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "role_id",
          "fit_level",
          "fit_score",
          "why_this_fits",
          "key_profile_signals",
          "key_role_signals",
        ],
      },
    },
    summary_message: { type: "string" },
  },
  required: ["recommendations", "summary_message"],
};

// === BUILDING THE USER MESSAGE ===
// Composed at runtime per user.
export function buildAgent1UserMessage(profile: UserProfile): string {
  // Profile section
  const profileSection = formatProfile(profile);

  // Role database section — give Gemini the full list, lightweight format
  const databaseSection = formatRoleDatabase();

  // Task section — the specific ask, framed in line with our decisions
  const taskSection = `# YOUR TASK

Review the user profile above and the role database. Return between 1 and 5 role recommendations.

**Distribution target (when possible):**
- 1 "near-fit" role — the user could move into this with their current skills
- 2 "moderate-pivot" roles — different function or context, but skills transfer
- 2 "aspirational" roles — stretch goals worth growing into

**Selection rules:**
1. Lateral roles (same function, similar seniority) are LOW information for this user — they likely already know about them. Lean toward roles that are surprising-but-defensible.
2. Cross-functional pivots are HIGH information. Prioritize them when there's evidence the user's skills transfer.
3. Aspirational ≠ unrealistic. An aspirational role should be reachable within 2-5 years given their trajectory, not a fantasy.
4. Use the user's "interests" field (career directions) as a strong directional weight when present.
5. NEVER recommend a role whose role_id is not in the database above.
6. If the profile is too sparse to confidently recommend 5 roles, return fewer. Honesty > completeness.

**For each recommendation:**
- "why_this_fits" should be 1-2 sentences, specific, and verifiable. Reference the user's actual skills/role, not generic praise.
- "key_profile_signals" should list 2-3 specific profile fields that drove the match (e.g., "skill: stakeholder management", "interest: Product").
- "key_role_signals" should list 2-3 specific role attributes that drove the match (e.g., "function: customer", "category: emerging").
- "fit_score" should be 0.6-1.0 (anything below 0.6 should be excluded entirely — return fewer recs instead).

**Summary message:**
A 1-2 sentence opener for the user. Set context for what they're seeing. Not generic — reference their actual situation. No emojis, no exclamation points.`;

  return `${profileSection}\n\n${databaseSection}\n\n${taskSection}`;
}

// Helpers
function formatProfile(profile: UserProfile): string {
  const lines: string[] = ["# USER PROFILE", ""];
  lines.push(`Current role: ${profile.currentRole}`);
  lines.push(`Years of experience: ${profile.yearsOfExperience}`);
  lines.push(`Skills (${profile.skills.length}): ${profile.skills.join(", ")}`);

  if (profile.dayToDay) {
    lines.push("");
    lines.push(`Day-to-day work (in their words):`);
    lines.push(`"${profile.dayToDay}"`);
  }

  if (profile.interests && profile.interests.length > 0) {
    lines.push("");
    lines.push(
      `Career direction interests: ${profile.interests.join(", ")}`
    );
  }

  if (profile.educationLevel || profile.educationField) {
    lines.push("");
    const eduParts = [profile.educationLevel, profile.educationField].filter(
      Boolean
    );
    lines.push(`Education: ${eduParts.join(" in ")}`);
  }

  lines.push("");
  lines.push(`# ABOUT THIS USER (META-CONTEXT)`);
  lines.push("");
  lines.push(
    `This user is using Career Compass because they don't have a clear name for what they could become next. They likely have transferable skills they don't know how to position. The product's job is to surface roles they wouldn't have thought of themselves — including emerging roles, cross-functional pivots, and roles where their generalist background is an asset rather than a deficit.`
  );

  return lines.join("\n");
}

function formatRoleDatabase(): string {
  const lines: string[] = ["# ROLE DATABASE", ""];
  lines.push(
    `The following ${rolesData.length} roles are verified — they exist at real companies in India today, sourced from live job postings as of May 2026. Recommend ONLY from this list.`
  );
  lines.push("");

  // Compact format: one role per line, key fields only
  // We exclude metadata fields Gemini doesn't need for recommendation reasoning
  for (const role of rolesData) {
    const tagsStr =
      Array.isArray(role.tags) && role.tags.length > 0
        ? ` | tags: ${role.tags.slice(0, 4).join(", ")}`
        : "";
    const skillsStr =
      Array.isArray(role.typical_skills) && role.typical_skills.length > 0
        ? ` | skills: ${role.typical_skills.slice(0, 5).join(", ")}`
        : "";
    const empCount = Array.isArray(role.real_employers)
      ? role.real_employers.length
      : 0;

    lines.push(
      `- ${role.id}: "${role.title}" [${role.category}, ${role.function}, ${role.seniority_band}]${skillsStr}${tagsStr} | hiring at ${empCount} co${empCount === 1 ? "" : "s"}`
    );
  }

  return lines.join("\n");
}
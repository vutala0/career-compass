import rolesData from "@/data/roles.json";

interface RoleEntry {
  title?: string;
}

/**
 * Common starting roles that Priya-types might currently hold.
 * These aren't necessarily in our roles.json (which lists roles she could
 * pivot to), but they're titles she's likely to type as her CURRENT role.
 */
const COMMON_STARTING_ROLES = [
  "Customer Success Associate",
  "Customer Support Representative",
  "Operations Generalist",
  "Operations Associate",
  "Business Analyst",
  "Marketing Coordinator",
  "Marketing Associate",
  "Project Coordinator",
  "Project Manager",
  "Account Manager",
  "Account Executive",
  "Sales Development Representative",
  "Product Associate",
  "Implementation Specialist",
  "Onboarding Specialist",
  "Executive Assistant",
  "Chief of Staff",
  "Founder's Office Associate",
  "Strategy Associate",
  "Junior Designer",
  "Content Writer",
  "Research Associate",
  "Data Analyst",
  "Generalist",
  "Operations Manager",
  "Marketing Manager",
];

/**
 * Combines roles from our database with common starting roles,
 * deduplicates, and returns a sorted unique list.
 */
function buildRoleSuggestions(): string[] {
  const fromDatabase = (rolesData as RoleEntry[])
    .map((r) => r.title)
    .filter((t): t is string => typeof t === "string" && t.length > 0);

  const combined = new Set<string>([
    ...COMMON_STARTING_ROLES,
    ...fromDatabase,
  ]);

  return Array.from(combined).sort();
}

export const ROLE_SUGGESTIONS = buildRoleSuggestions();

/**
 * Returns up to maxResults suggestions matching the query.
 * Match logic: case-insensitive substring match, prioritizing prefix matches.
 */
export function suggestRoles(
  query: string,
  maxResults: number = 6
): string[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const matches: { role: string; score: number }[] = [];

  for (const role of ROLE_SUGGESTIONS) {
    const lower = role.toLowerCase();
    if (lower === trimmed) continue; // skip exact match (user already typed it)

    if (lower.startsWith(trimmed)) {
      matches.push({ role, score: 0 }); // best — prefix match
    } else if (lower.includes(trimmed)) {
      matches.push({ role, score: 1 }); // worse — substring match
    }
  }

  matches.sort((a, b) => a.score - b.score || a.role.localeCompare(b.role));
  return matches.slice(0, maxResults).map((m) => m.role);
}
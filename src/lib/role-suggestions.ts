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
  // Customer & Operations
  "Customer Success Associate",
  "Customer Success Manager",
  "Customer Support Representative",
  "Customer Support Associate",
  "Operations Generalist",
  "Operations Associate",
  "Operations Manager",
  "Operations Analyst",

  // Business & Analysis
  "Business Analyst",
  "Business Development Associate",
  "Business Development Manager",
  "Strategy Associate",
  "Strategy Analyst",

  // Marketing
  "Marketing Coordinator",
  "Marketing Associate",
  "Marketing Manager",
  "Content Writer",
  "Content Marketing Manager",
  "Social Media Manager",
  "Brand Manager",
  "SEO Specialist",
  "Performance Marketing Specialist",

  // Sales
  "Sales Development Representative",
  "Sales Associate",
  "Sales Manager",
  "Sales Executive",
  "Account Manager",
  "Account Executive",
  "Inside Sales Representative",

  // Product & Design
  "Product Associate",
  "Product Manager",
  "Associate Product Manager",
  "Junior Designer",
  "UX Designer",
  "Visual Designer",
  "Graphic Designer",

  // Project & Program Management
  "Project Coordinator",
  "Project Manager",
  "Program Manager",
  "Implementation Specialist",
  "Onboarding Specialist",

  // Data & Analytics
  "Data Analyst",
  "Data Associate",
  "Research Associate",
  "Market Research Analyst",

  // HR & People
  "HR Generalist",
  "HR Coordinator",
  "Human Resources Associate",
  "People Operations Specialist",
  "Talent Acquisition Specialist",
  "Recruiter",

  // Finance & Admin
  "Finance Analyst",
  "Accountant",
  "Financial Analyst",
  "Executive Assistant",

  // Strategy & Leadership tracks
  "Chief of Staff",
  "Founder's Office Associate",
  "Founder's Office Analyst",
  "Generalist",
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
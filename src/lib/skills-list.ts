import rolesData from "@/data/roles.json";

interface RoleEntry {
  typical_skills?: string[];
}

/**
 * Extracts a deduplicated, sorted list of all skills from roles.json.
 * Returns the most common skills first (by frequency across all roles).
 */
function extractSkillsFromRoles(): string[] {
  const skillCounts = new Map<string, number>();

  (rolesData as RoleEntry[]).forEach((role) => {
    role.typical_skills?.forEach((skill) => {
      const normalized = skill.trim();
      if (normalized.length > 0) {
        skillCounts.set(
          normalized,
          (skillCounts.get(normalized) ?? 0) + 1
        );
      }
    });
  });

  // Sort by frequency (most common first), then alphabetically as tiebreaker
  return Array.from(skillCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([skill]) => skill);
}

const ALL_SKILLS = extractSkillsFromRoles();

/**
 * The top 30 most common skills across all roles.
 * Shown by default in the SkillsInput component.
 */
export const TOP_SKILLS = ALL_SKILLS.slice(0, 30);

/**
 * The full list of skills (excluding the top 30).
 * Revealed when the user clicks "Show more skills".
 */
export const REMAINING_SKILLS = ALL_SKILLS.slice(30);

/**
 * Total skill count for any UI that wants to display "X skills available".
 */
export const TOTAL_SKILLS_COUNT = ALL_SKILLS.length;
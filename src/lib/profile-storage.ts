/**
 * Type definition for the user's profile.
 * This is the single source of truth for what data we collect.
 */
export interface UserProfile {
  // Required fields (from wizard)
  currentRole: string;
  skills: string[];
  yearsOfExperience: number;

  // Optional fields (from optional section)
  dayToDay?: string;
  interests?: string[];
  educationLevel?: string;
  educationField?: string;

  // Metadata
  completedAt?: string;
}

const STORAGE_KEY = "careerCompassProfile";

/**
 * Saves the profile to localStorage.
 * Returns true on success, false on failure (e.g., storage quota exceeded).
 */
export function saveProfile(profile: UserProfile): boolean {
  if (typeof window === "undefined") return false;
  try {
    const withTimestamp: UserProfile = {
      ...profile,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
    return true;
  } catch (err) {
    console.error("Failed to save profile to localStorage:", err);
    return false;
  }
}

/**
 * Loads the profile from localStorage.
 * Returns null if no profile exists or if parsing fails.
 */
export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (err) {
    console.error("Failed to load profile from localStorage:", err);
    return null;
  }
}

/**
 * Clears the saved profile.
 * Useful for "start over" actions in future blocks.
 */
export function clearProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear profile:", err);
  }
}
import { Agent1Recommendation } from "@/lib/agent-1-prompt";

/**
 * The shape of a cached Agent 1 response on the client side.
 */
export interface CachedAgent1Response {
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
  cachedAt: string; // ISO timestamp
}

const STORAGE_KEY = "careerCompassAgent1Response";

/**
 * Saves Agent 1's response to localStorage.
 * The cache lets us avoid re-firing the agent when the user navigates away
 * and back (e.g., refresh, click "back" from job posting).
 */
export function saveAgent1Response(
  response: Omit<CachedAgent1Response, "cachedAt">
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const withTimestamp: CachedAgent1Response = {
      ...response,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
    return true;
  } catch (err) {
    console.error("Failed to cache Agent 1 response:", err);
    return false;
  }
}

/**
 * Loads cached Agent 1 response.
 * Returns null if no cache exists, parsing fails, or cache is too old.
 */
export function loadAgent1Response(
  maxAgeMinutes: number = 30
): CachedAgent1Response | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedAgent1Response;

    // Check age
    const cachedAt = new Date(cached.cachedAt).getTime();
    const ageMinutes = (Date.now() - cachedAt) / (1000 * 60);
    if (ageMinutes > maxAgeMinutes) {
      console.info(
        `Agent 1 cache is ${ageMinutes.toFixed(1)} min old, treating as stale`
      );
      return null;
    }

    return cached;
  } catch (err) {
    console.error("Failed to load Agent 1 cache:", err);
    return null;
  }
}

/**
 * Clears the Agent 1 cache. Used on "Refine profile" to force a fresh call.
 */
export function clearAgent1Response(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear Agent 1 cache:", err);
  }
}
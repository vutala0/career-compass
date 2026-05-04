/**
 * Progressive loading stages for the Agent 1 call.
 * Decision #51: storied progressive messaging during the 17-25s wait.
 *
 * Each stage tells a small piece of the story while teaching the user
 * what makes Career Compass different from a generic AI chat.
 */

export interface LoadingStage {
  /** When this stage starts (ms after call started) */
  startMs: number;
  /** Primary message shown */
  message: string;
  /** Optional subtext for context */
  subtext?: string;
}

export const LOADING_STAGES: LoadingStage[] = [
  {
    startMs: 0,
    message: "Reading your profile",
    subtext: "Skills, experience, and what you've shared",
  },
  {
    startMs: 3000,
    message: "Searching 106 verified roles",
    subtext: "Real openings at real companies in India",
  },
  {
    startMs: 7000,
    message: "Matching your skills to opportunities",
    subtext: "Looking past obvious matches",
  },
  {
    startMs: 12000,
    message: "Reasoning about which roles surprise-fit",
    subtext: "The roles you might not have considered",
  },
  {
    startMs: 18000,
    message: "Almost there",
    subtext: "Putting together your recommendations",
  },
  {
    startMs: 30000,
    message: "Almost there — Gemini is working through 106 roles",
    subtext: "This is taking a moment",
  },
  {
    startMs: 60000,
    message: "This is taking longer than usual",
    subtext: "Hold on a few more seconds",
  },
];

/**
 * Returns the active loading stage given elapsed time.
 */
export function getCurrentStage(elapsedMs: number): LoadingStage {
  for (let i = LOADING_STAGES.length - 1; i >= 0; i--) {
    if (elapsedMs >= LOADING_STAGES[i].startMs) {
      return LOADING_STAGES[i];
    }
  }
  return LOADING_STAGES[0];
}

/**
 * Whether we should surface a "Try again" button.
 * Per Decision #54: only after 90 seconds.
 */
export function shouldOfferRetry(elapsedMs: number): boolean {
  return elapsedMs >= 90000;
}
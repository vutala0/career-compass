/**
 * Feedback helper — posts events to the Apps Script webhook.
 *
 * Two event types: "thumb" (per-recommendation) and "form" (footer feedback).
 * Both append rows to the configured Google Sheet.
 *
 * Decisions implemented:
 * - #61: Apps Script webhook as feedback storage
 * - #62: Per-card thumbs with append-always row strategy
 * - #63: Locked schema for thumb events
 * - #64: Locked 4-question schema for form events
 */

const WEBHOOK_URL = process.env.NEXT_PUBLIC_FEEDBACK_WEBHOOK_URL ?? "";

const SESSION_KEY = "careerCompassSessionId";

/**
 * Get or create a stable session ID for this user.
 * Persists in localStorage so feedback across the same session correlates.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

/**
 * Build a non-PII summary of the user's profile for context.
 * Just enough to correlate feedback to user types — never raw skills/text.
 */
export interface UserSummary {
  current_role: string;
  years: number;
  skills_count: number;
  has_optional: boolean;
}

export function formatUserSummary(s: UserSummary | null): string {
  if (!s) return "";
  return `${s.current_role}|${s.years}yr|${s.skills_count}skills|optional:${s.has_optional ? "y" : "n"}`;
}

// === THUMB EVENT ===

export interface ThumbEvent {
  role_id: string;
  role_title: string;
  fit_level: string;
  fit_score: number;
  thumb_value: "up" | "down";
  comment?: string;
  user_summary: string;
}

export async function sendThumbEvent(event: ThumbEvent): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.warn("Feedback webhook URL not configured — skipping thumb event");
    return false;
  }

  const payload = {
    type: "thumb",
    ...event,
    comment: event.comment ?? "",
    session_id: getOrCreateSessionId(),
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script doesn't return CORS headers; we accept that we won't read the response
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // With no-cors mode, we can't actually inspect the response.
    // We assume success if no exception was thrown.
    return true;
  } catch (err) {
    console.error("Feedback: thumb event failed:", err);
    return false;
  }
}

// === FORM EVENT ===

export interface FormEvent {
  q1_quality: string;
  q2_open_feedback: string;
  q3_would_use_again: string;
  q4_email: string;
  user_summary: string;
}

export async function sendFormEvent(event: FormEvent): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.warn("Feedback webhook URL not configured — skipping form event");
    return false;
  }

  const payload = {
    type: "form",
    ...event,
    session_id: getOrCreateSessionId(),
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.error("Feedback: form event failed:", err);
    return false;
  }
}
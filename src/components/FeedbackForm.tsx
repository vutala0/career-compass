"use client";

import { useState } from "react";
import { sendFormEvent } from "@/lib/feedback";

interface FeedbackFormProps {
  userSummary: string;
}

const Q1_OPTIONS = [
  { value: "eye-opening", label: "At least one was eye-opening — a role I hadn't considered" },
  { value: "already-considered", label: "Mostly roles I'd already considered" },
  { value: "off-target", label: "Several felt off-target" },
  { value: "didnt-engage", label: "I didn't really engage with them" },
];

const Q3_OPTIONS = [
  { value: "yes", label: "Yes, I'd use it" },
  { value: "maybe", label: "Maybe, depending on the situation" },
  { value: "probably-not", label: "Probably not" },
];

type FormState = "open" | "closed" | "submitting" | "submitted";

export default function FeedbackForm({ userSummary }: FeedbackFormProps) {
  const [state, setState] = useState<FormState>("closed");
  const [q1, setQ1] = useState<string>("");
  const [q2, setQ2] = useState<string>("");
  const [q3, setQ3] = useState<string>("");
  const [q4, setQ4] = useState<string>("");

  const canSubmit = q1.length > 0 && state !== "submitting";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setState("submitting");
    await sendFormEvent({
      q1_quality: q1,
      q2_open_feedback: q2.trim(),
      q3_would_use_again: q3,
      q4_email: q4.trim(),
      user_summary: userSummary,
    });
    setState("submitted");
  };

  if (state === "closed") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Help us improve
        </h3>
        <p className="mt-3 text-base text-slate-700">
          Career Compass is in early testing. A 60-second feedback form goes
          a long way.
        </p>
        <button
          type="button"
          onClick={() => setState("open")}
          className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Share quick feedback →
        </button>
      </div>
    );
  }

  if (state === "submitted") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="text-sm font-semibold text-emerald-900">
          Thanks for the feedback!
        </h3>
        <p className="mt-2 text-sm text-emerald-800">
          This is exactly the kind of input that shapes what gets built next.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Quick feedback
        </h3>
        <button
          type="button"
          onClick={() => setState("closed")}
          className="text-xs text-slate-400 transition hover:text-slate-700"
        >
          Close
        </button>
      </div>

      {/* Q1 — forced choice */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-900">
          Looking back at the recommendations, how would you describe them?
        </p>
        <p className="mt-1 text-xs text-slate-500">Required</p>
        <div className="mt-3 space-y-2">
          {Q1_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                q1 === opt.value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <input
                type="radio"
                name="q1"
                value={opt.value}
                checked={q1 === opt.value}
                onChange={() => setQ1(opt.value)}
                className="mt-0.5 accent-slate-900"
              />
              <span className="text-slate-800">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Q2 — open */}
      <div className="mb-6">
        <label htmlFor="q2" className="text-sm font-medium text-slate-900">
          Anything specific that worked well or didn&apos;t?
        </label>
        <p className="mt-1 text-xs text-slate-500">
          A role that felt wrong, a missing function, copy that landed weird... (optional)
        </p>
        <textarea
          id="q2"
          value={q2}
          onChange={(e) => setQ2(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          placeholder="Anything you noticed, big or small..."
        />
      </div>

      {/* Q3 — intent */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-900">
          Would you check this again if you were genuinely thinking about a career move?
        </p>
        <p className="mt-1 text-xs text-slate-500">Optional</p>
        <div className="mt-3 space-y-2">
          {Q3_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                q3 === opt.value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <input
                type="radio"
                name="q3"
                value={opt.value}
                checked={q3 === opt.value}
                onChange={() => setQ3(opt.value)}
                className="accent-slate-900"
              />
              <span className="text-slate-800">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Q4 — email */}
      <div className="mb-6">
        <label htmlFor="q4" className="text-sm font-medium text-slate-900">
          Open to a 15-min chat about your experience?
        </label>
        <p className="mt-1 text-xs text-slate-500">Drop your email (optional)</p>
        <input
          id="q4"
          type="email"
          value={q4}
          onChange={(e) => setQ4(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
        />
      </div>

      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {state === "submitting" ? "Sending..." : "Send feedback"}
        </button>
        {!q1 && state !== "submitting" && (
          <p className="mt-2 text-xs text-slate-400">
            Pick an option for the first question to enable submit.
          </p>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";

interface ApiResponse {
  text?: string;
  model?: string;
  error?: string;
  debugMessage?: string;
}

export default function GeminiTestPage() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (prompt.trim().length === 0) return;

    setLoading(true);
    setResponse(null);
    setLatencyMs(null);

    const startTime = performance.now();

    try {
      const res = await fetch("/api/gemini-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data: ApiResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        error: "Network error. Check that the dev server is running.",
        debugMessage: err instanceof Error ? err.message : String(err),
      });
    } finally {
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 px-6 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Internal · Block I
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Gemini Connection Test
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Verifies the full round trip: browser → API route → Gemini →
            response. Remove before shipping to users.
          </p>
        </div>

        {/* Prompt input */}
        <div className="mb-6">
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-slate-900"
          >
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Try: "In one sentence, what is a Customer Success Operations Manager?"'
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            disabled={loading}
          />
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || prompt.trim().length === 0}
          className="rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Calling Gemini..." : "Send to Gemini →"}
        </button>

        {/* Response area */}
        {(response || loading) && (
          <div className="mt-10 border-t border-slate-200 pt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Response
              </p>
              {latencyMs !== null && (
                <p className="text-xs text-slate-500">
                  ⏱ {latencyMs}ms
                  {response?.model && <> · {response.model}</>}
                </p>
              )}
            </div>

            {loading && (
              <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-500">
                Waiting for Gemini...
              </div>
            )}

            {response?.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-900">
                  {response.error}
                </p>
                {response.debugMessage && (
                  <p className="mt-2 font-mono text-xs text-red-700">
                    Debug: {response.debugMessage}
                  </p>
                )}
              </div>
            )}

            {response?.text && (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="whitespace-pre-wrap text-sm text-slate-900">
                  {response.text}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick test prompts */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Quick test prompts
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <TestPromptButton
              onClick={(p) => setPrompt(p)}
              prompt="Say hello in 5 words."
            />
            <TestPromptButton
              onClick={(p) => setPrompt(p)}
              prompt="In one sentence, what is a Customer Success Operations Manager?"
            />
            <TestPromptButton
              onClick={(p) => setPrompt(p)}
              prompt="List 3 emerging non-engineering roles in India in 2026."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TestPromptButton({
  onClick,
  prompt,
}: {
  onClick: (prompt: string) => void;
  prompt: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(prompt)}
      className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm text-slate-700 transition hover:border-slate-400"
    >
      {prompt}
    </button>
  );
}
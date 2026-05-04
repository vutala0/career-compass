"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadProfile, clearProfile, UserProfile } from "@/lib/profile-storage";
import { clearAgent1Response } from "@/lib/agent-1-storage";
import Recommendations from "@/components/Recommendations";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setIsLoaded(true);
  }, []);

  // Brief loading flash while we read localStorage
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-slate-400">
        Loading...
      </div>
    );
  }

  // No profile saved — gentle redirect to start
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-slate-900">
        <p className="text-lg text-slate-600">No profile yet.</p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Start the wizard →
        </Link>
      </div>
    );
  }

  const handleStartOver = () => {
    clearProfile();
    clearAgent1Response();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-slate-900">
      {/* Top bar — wordmark + start over */}
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-6">
        <p className="text-sm font-medium tracking-tight text-slate-900">
          Career Compass
        </p>
        <button
          type="button"
          onClick={handleStartOver}
          className="rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
        >
          Start over
        </button>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        {/* Profile summary — small, top of page */}
        <div className="mb-12 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Your profile
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-base font-semibold text-slate-900">
              {profile.currentRole}
            </p>
            <p className="text-sm text-slate-500">
              · {profile.yearsOfExperience} year
              {profile.yearsOfExperience === 1 ? "" : "s"}
            </p>
            <p className="text-sm text-slate-500">
              · {profile.skills.length} skill
              {profile.skills.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/"
            prefetch={false}
            className="mt-3 inline-block text-xs text-slate-500 underline-offset-2 transition hover:text-slate-900 hover:underline"
          >
            Refine profile →
          </Link>
        </div>

        {/* The orchestrator — handles loading, error, success states */}
        <Recommendations profile={profile} />
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 pb-12 pt-8">
        <p className="text-center text-xs text-slate-400">
          v0.3 · Career Compass
        </p>
      </footer>
    </div>
  );
}
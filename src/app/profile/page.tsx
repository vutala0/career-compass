"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadProfile, clearProfile, UserProfile } from "@/lib/profile-storage";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setIsLoaded(true);
  }, []);

  // Loading state — brief flash while we read localStorage
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

  return (
    <div className="flex min-h-screen flex-col items-center bg-stone-50 px-6 py-12 text-slate-900">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your profile
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Here&apos;s what we captured. Coming soon: AI-powered role discovery.
          </p>
        </div>

        {/* Required fields recap */}
        <div className="space-y-8 border-l-2 border-slate-200 pl-6">
          <Section label="Current role">
            <p className="text-lg">{profile.currentRole}</p>
          </Section>

          <Section label="Skills">
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Section>

          <Section label="Years of experience">
            <p className="text-lg">
              {profile.yearsOfExperience === 0
                ? "Less than 1"
                : profile.yearsOfExperience >= 15
                  ? "15+"
                  : profile.yearsOfExperience}{" "}
              year{profile.yearsOfExperience === 1 ? "" : "s"}
            </p>
          </Section>

          {profile.dayToDay && (
            <Section label="Day-to-day">
              <p className="whitespace-pre-wrap text-base text-slate-700">
                {profile.dayToDay}
              </p>
            </Section>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <Section label="Career direction interests">
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {(profile.educationLevel || profile.educationField) && (
            <Section label="Education">
              <p className="text-base text-slate-700">
                {[profile.educationLevel, profile.educationField]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Section>
          )}
        </div>

        {/* Coming soon block */}
        <div className="mt-16 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Coming soon
          </h3>
          <p className="mt-3 text-base text-slate-700">
            Next, we&apos;ll connect 4 AI agents that work together to find roles
            you didn&apos;t know existed and build a personalized roadmap to get
            there.
          </p>
        </div>

        {/* Footer actions */}
        <div className="mt-16 flex items-center justify-between border-t border-slate-200 pt-8 text-sm">
          <button
            type="button"
            onClick={() => {
              clearProfile();
              window.location.href = "/";
            }}
            className="text-slate-500 transition hover:text-slate-900"
          >
            Start over
          </button>
          <p className="text-slate-400">v0.2 · profile saved locally</p>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
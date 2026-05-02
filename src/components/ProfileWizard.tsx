"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WizardStep from "./WizardStep";
import RoleInput from "./RoleInput";
import SkillsInput from "./SkillsInput";
import YearsInput from "./YearsInput";
import OptionalSection from "./OptionalSection";
import { saveProfile, UserProfile } from "@/lib/profile-storage";

type WizardPhase = "intro" | "step1" | "step2" | "step3" | "optional";

export default function ProfileWizard() {
  const router = useRouter();
  const [phase, setPhase] = useState<WizardPhase>("intro");

  // Required field state
  const [currentRole, setCurrentRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState(3);

  // Optional field state (held as one object for cleaner prop passing)
  const [optionalData, setOptionalData] = useState({
    dayToDay: "",
    interests: [] as string[],
    educationLevel: "",
    educationField: "",
  });

  const handleSubmit = () => {
    const profile: UserProfile = {
      currentRole: currentRole.trim(),
      skills,
      yearsOfExperience,
      dayToDay: optionalData.dayToDay.trim() || undefined,
      interests:
        optionalData.interests.length > 0 ? optionalData.interests : undefined,
      educationLevel:
        optionalData.educationLevel && optionalData.educationLevel !== "Skip"
          ? optionalData.educationLevel
          : undefined,
      educationField: optionalData.educationField.trim() || undefined,
    };

    const saved = saveProfile(profile);
    if (saved) {
      router.push("/profile");
    } else {
      alert("Sorry, we couldn't save your profile. Please try again.");
    }
  };

  // === INTRO SCREEN ===
  if (phase === "intro") {
    return (
      <div className="flex min-h-screen flex-col bg-stone-50 px-6 text-slate-900">
        {/* Wordmark — top-left, present on every screen via WizardStep too */}
        <header className="w-full pt-6">
          <p className="text-sm font-medium tracking-tight text-slate-900">
            Career Compass
          </p>
        </header>

        {/* Value prop content */}
        <div className="flex flex-1 flex-col items-center justify-center py-16">
          <div className="flex max-w-2xl flex-col items-center text-center">
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
              Find roles you didn&apos;t know existed.
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              Career Compass uses AI to discover careers that fit your skills —
              including emerging roles most generalists haven&apos;t heard of.
              Tell us about you, and we&apos;ll show you what&apos;s possible.
            </p>

            {/* Mini-trust signal — 3 micro-promises */}
            <div className="mt-10 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:gap-6">
              <span>✓ Real roles, real companies</span>
              <span>✓ Personalized to your skills</span>
              <span>✓ ~90 seconds</span>
            </div>

            <button
              type="button"
              onClick={() => setPhase("step1")}
              className="mt-12 rounded-full bg-slate-900 px-10 py-4 text-base font-medium text-white transition hover:bg-slate-700"
            >
              Get started →
            </button>
          </div>
        </div>

        <footer className="w-full py-6 text-sm text-slate-400">
          v0.2 · Built by Wesly
        </footer>
      </div>
    );
  }

  // === STEP 1: CURRENT ROLE ===
  if (phase === "step1") {
    return (
      <WizardStep
        stepNumber={1}
        totalSteps={3}
        title="What's your current role?"
        subtitle="Whatever's on your business card today."
        onContinue={() => setPhase("step2")}
        canContinue={currentRole.trim().length > 0}
      >
        <RoleInput value={currentRole} onChange={setCurrentRole} />
      </WizardStep>
    );
  }

  // === STEP 2: SKILLS ===
  if (phase === "step2") {
    return (
      <WizardStep
        stepNumber={2}
        totalSteps={3}
        title="What are your skills?"
        subtitle="Pick the ones that describe you. Add more if we missed something."
        onContinue={() => setPhase("step3")}
        onBack={() => setPhase("step1")}
        canContinue={skills.length > 0}
      >
        <SkillsInput value={skills} onChange={setSkills} />
      </WizardStep>
    );
  }

  // === STEP 3: YEARS ===
  if (phase === "step3") {
    return (
      <WizardStep
        stepNumber={3}
        totalSteps={3}
        title="How many years of experience?"
        subtitle="Total, across roles. Approximate is fine."
        onContinue={() => setPhase("optional")}
        onBack={() => setPhase("step2")}
        canContinue={true}
        continueLabel="Continue"
      >
        <YearsInput
          value={yearsOfExperience}
          onChange={setYearsOfExperience}
        />
      </WizardStep>
    );
  }

  // === OPTIONAL SECTION ===
  if (phase === "optional") {
    return (
      <OptionalSection
        data={optionalData}
        onChange={setOptionalData}
        onSubmit={handleSubmit}
        onBack={() => setPhase("step3")}
      />
    );
  }

  return null;
}
"use client";

interface OptionalSectionData {
  dayToDay: string;
  interests: string[];
  educationLevel: string;
  educationField: string;
}

interface OptionalSectionProps {
  data: OptionalSectionData;
  onChange: (data: OptionalSectionData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const INTEREST_OPTIONS = [
  "Product",
  "Design",
  "Marketing",
  "Customer",
  "Sales",
  "Operations",
  "Data Analyst",
];

const EDUCATION_LEVELS = [
  "Bachelor's",
  "Master's",
  "MBA",
  "PhD",
  "Other",
  "Skip",
];

export default function OptionalSection({
  data,
  onChange,
  onSubmit,
  onBack,
}: OptionalSectionProps) {
  const updateField = <K extends keyof OptionalSectionData>(
    field: K,
    value: OptionalSectionData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const toggleInterest = (interest: string) => {
    if (data.interests.includes(interest)) {
      updateField(
        "interests",
        data.interests.filter((i) => i !== interest)
      );
    } else {
      updateField("interests", [...data.interests, interest]);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-slate-900">
      {/* Top bar — wordmark + skip option */}
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 pt-6">
        <p className="text-sm font-medium tracking-tight text-slate-900">
          Career Compass
        </p>
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
        >
          Skip & see roles →
        </button>
      </header>

      {/* Scrolling content area — leaves room for sticky footer */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 pb-32">
        <div className="mb-8 mt-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Optional · skip anytime
          </div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A few more questions?
          </h2>
          <p className="mt-3 text-base text-slate-500">
            Every answer helps us personalize. None are required &mdash; skip
            any or all and we&apos;ll still find roles for you.
          </p>
        </div>

        {/* Day-to-day */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <label
            htmlFor="dayToDay"
            className="block text-sm font-medium text-slate-900"
          >
            What do you actually do day-to-day?
          </label>
          <p className="mt-1 text-xs text-slate-500">
            The unofficial version. Don&apos;t worry about polish.
          </p>
          <textarea
            id="dayToDay"
            value={data.dayToDay}
            onChange={(e) => updateField("dayToDay", e.target.value)}
            placeholder="e.g., I lead customer onboarding calls and build dashboards in Excel..."
            rows={3}
            className="mt-3 w-full rounded-lg border border-slate-200 bg-stone-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Interests */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <label className="block text-sm font-medium text-slate-900">
            What career directions interest you?
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Pick any that resonate. We&apos;ll weight roles in those areas.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = data.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    selected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                  }`}
                >
                  {interest}
                  {selected && " ×"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Education */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <label className="block text-sm font-medium text-slate-900">
            Education
          </label>
          <p className="mt-1 text-xs text-slate-500">Optional, but helpful.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={data.educationLevel}
              onChange={(e) => updateField("educationLevel", e.target.value)}
              className="rounded-lg border border-slate-200 bg-stone-50 p-3 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
            >
              <option value="">Select degree level</option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={data.educationField}
              onChange={(e) => updateField("educationField", e.target.value)}
              placeholder="Field of study (e.g., Engineering)"
              className="rounded-lg border border-slate-200 bg-stone-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sticky footer — always visible */}
      <div className="sticky bottom-0 left-0 right-0 border-t border-slate-200 bg-stone-50/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Discover roles →
          </button>
        </div>
      </div>
    </div>
  );
}
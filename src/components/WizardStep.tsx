"use client";

import { ReactNode } from "react";

interface WizardStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onContinue: () => void;
  onBack?: () => void;
  canContinue: boolean;
  continueLabel?: string;
}

export default function WizardStep({
  stepNumber,
  totalSteps,
  title,
  subtitle,
  children,
  onContinue,
  onBack,
  canContinue,
  continueLabel = "Continue",
}: WizardStepProps) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-slate-900">
      {/* Top bar — wordmark + step indicator */}
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 pt-6">
        <p className="text-sm font-medium tracking-tight text-slate-900">
          Career Compass
        </p>
        <p className="text-sm font-medium text-slate-600">
          Step {stepNumber} of {totalSteps}
        </p>
      </header>

      {/* Scrolling content — leaves room for sticky footer */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-32 pt-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-base text-slate-500">{subtitle}</p>
        )}

        <div className="mt-10">{children}</div>
      </div>

      {/* Sticky footer — always visible */}
      <div className="sticky bottom-0 left-0 right-0 border-t border-slate-200 bg-stone-50/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-slate-500 transition hover:text-slate-900"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {continueLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}
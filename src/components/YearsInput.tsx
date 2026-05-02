"use client";

interface YearsInputProps {
  value: number;
  onChange: (value: number) => void;
}

export default function YearsInput({ value, onChange }: YearsInputProps) {
  const displayValue = value === 0 ? "<1" : value >= 15 ? "15+" : `${value}`;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Big number display */}
      <div className="flex flex-col items-center">
        <span className="text-7xl font-semibold tracking-tight text-slate-900">
          {displayValue}
        </span>
        <span className="mt-2 text-sm text-slate-500">
          year{value === 1 ? "" : "s"} of experience
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={15}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full max-w-md cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
      />

      {/* Min/max labels */}
      <div className="flex w-full max-w-md justify-between text-xs text-slate-400">
        <span>Less than 1</span>
        <span>15+</span>
      </div>
    </div>
  );
}
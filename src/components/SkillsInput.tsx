"use client";

import { useState } from "react";
import { TOP_SKILLS, REMAINING_SKILLS } from "@/lib/skills-list";

interface SkillsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function SkillsInput({ value, onChange }: SkillsInputProps) {
  const [showMore, setShowMore] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const visibleSkills = showMore
    ? [...TOP_SKILLS, ...REMAINING_SKILLS]
    : TOP_SKILLS;

  const toggleSkill = (skill: string) => {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill));
    } else {
      onChange([...value, skill]);
    }
  };

  const addCustomSkill = () => {
    const trimmed = customInput.trim();
    if (trimmed.length === 0) return;
    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustomInput("");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Selected skills count */}
      <p className="text-sm text-slate-500">
        {value.length === 0
          ? "Pick the ones that describe you."
          : `${value.length} selected. Add more, or remove by clicking.`}
      </p>

      {/* Skill chip grid */}
      <div className="flex flex-wrap gap-2">
        {visibleSkills.map((skill) => {
          const selected = value.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
              }`}
            >
              {skill}
              {selected && " ×"}
            </button>
          );
        })}

        {/* Custom-added skills (not in our preset list) appear here too */}
        {value
          .filter(
            (s) => !TOP_SKILLS.includes(s) && !REMAINING_SKILLS.includes(s)
          )
          .map((skill) => (
            <button
              key={`custom-${skill}`}
              type="button"
              onClick={() => toggleSkill(skill)}
              className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white"
            >
              {skill} ×
            </button>
          ))}
      </div>

      {/* Show more toggle */}
      {!showMore && REMAINING_SKILLS.length > 0 && (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="self-start text-sm text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
        >
          Show {REMAINING_SKILLS.length} more skills →
        </button>
      )}

      {/* Custom skill input */}
      <div className="flex items-center gap-2 border-t border-slate-200 pt-6">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomSkill();
            }
          }}
          placeholder="Missing a skill? Add your own..."
          className="flex-1 border-b border-slate-300 bg-transparent py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={addCustomSkill}
          disabled={customInput.trim().length === 0}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
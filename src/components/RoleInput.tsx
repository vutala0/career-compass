"use client";

import { useState, useRef, useEffect } from "react";
import { suggestRoles } from "@/lib/role-suggestions";

interface RoleInputProps {
  value: string;
  onChange: (value: string) => void;
}

const EXAMPLE_ROLES = [
  "Customer Success Associate",
  "Operations Manager",
  "Business Analyst",
  "Marketing Coordinator",
];

export default function RoleInput({ value, onChange }: RoleInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = suggestRoles(value, 6);
  const hasSuggestions = suggestions.length > 0;

  // Hide suggestions when user clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || !hasSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      onChange(suggestions[highlightedIndex]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., Operations Generalist"
        autoFocus
        autoComplete="off"
        className="w-full border-b-2 border-slate-300 bg-transparent py-3 text-2xl text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none"
      />

      {/* Autocomplete suggestion dropdown */}
      {showSuggestions && hasSuggestions && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`block w-full px-4 py-3 text-left text-base transition ${
                index === highlightedIndex
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Helper text — shows examples when empty, hides when typing */}
      {!showSuggestions || !hasSuggestions ? (
        <p className="mt-4 text-sm text-slate-400">
          Examples: {EXAMPLE_ROLES.join(", ")}
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-400">
          Tip: Use ↑↓ to navigate, Enter to select, Esc to close.
        </p>
      )}
    </div>
  );
}
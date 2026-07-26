"use client";

import { useEffect, useState } from "react";

import type { QuestionInputProps } from "./index";

export function RatingInput({
  question,
  value,
  onChange,
  onSubmit,
  live,
}: QuestionInputProps) {
  const max = question.settings?.max ?? 5;
  const selected = value ? parseInt(value, 10) : 0;
  const [hovered, setHovered] = useState(0);

  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      // "0" means 10 on a 10-scale
      let n = parseInt(e.key, 10);
      if (Number.isNaN(n)) return;
      if (n === 0 && max >= 10) n = 10;
      if (n >= 1 && n <= max) {
        e.preventDefault();
        onChange(String(n));
        setTimeout(onSubmit, 300);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, max, onChange, onSubmit]);

  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const active = n <= (hovered || selected);
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => {
              onChange(String(n));
              if (live) setTimeout(onSubmit, 300);
            }}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`text-4xl transition-colors ${
                active ? "text-accent" : "text-accent/25"
              }`}
            >
              ★
            </span>
            <span className="text-xs text-ink-soft">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

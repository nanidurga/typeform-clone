"use client";

import { useEffect } from "react";

import type { QuestionInputProps } from "./index";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface ChoiceListProps extends QuestionInputProps {
  labels: string[];
  /** compact style for dropdown */
  compact?: boolean;
}

export function ChoiceList({
  labels,
  value,
  onChange,
  onSubmit,
  live,
  compact,
}: ChoiceListProps) {
  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      const index = LETTERS.indexOf(e.key.toUpperCase());
      if (index >= 0 && index < labels.length) {
        e.preventDefault();
        onChange(labels[index]);
        setTimeout(onSubmit, 300);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, labels, onChange, onSubmit]);

  return (
    <div
      className={`flex flex-col gap-2 ${compact ? "max-h-72 overflow-y-auto pr-1 slim-scroll" : ""}`}
    >
      {labels.map((label, index) => {
        const selected = value === label;
        return (
          <button
            key={`${label}-${index}`}
            type="button"
            onClick={() => {
              onChange(label);
              if (live) setTimeout(onSubmit, 300);
            }}
            className={`group flex items-center gap-3 rounded border px-3 py-2 text-left transition-all ${
              selected
                ? "border-accent bg-accent-soft shadow-[0_0_0_1px_var(--tf-accent)]"
                : "border-accent/40 bg-accent-soft/40 hover:bg-accent-soft"
            } ${compact ? "max-w-sm" : "max-w-md"}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                selected
                  ? "border-accent bg-accent text-white"
                  : "border-accent/50 bg-white text-accent"
              }`}
            >
              {LETTERS[index]}
            </span>
            <span className="text-lg text-accent">{label}</span>
            {selected && <span className="ml-auto text-accent">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

export function MultipleChoiceInput(props: QuestionInputProps) {
  return (
    <ChoiceList {...props} labels={props.question.options.map((o) => o.label)} />
  );
}

export function DropdownInput(props: QuestionInputProps) {
  return (
    <ChoiceList
      {...props}
      compact
      labels={props.question.options.map((o) => o.label)}
    />
  );
}

export function YesNoInput(props: QuestionInputProps) {
  return <ChoiceList {...props} labels={["Yes", "No"]} />;
}

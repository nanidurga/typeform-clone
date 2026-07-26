"use client";

import type { QuestionInputProps } from "./index";

const BASE =
  "w-full bg-transparent text-2xl md:text-3xl text-accent placeholder:text-accent/30 caret-accent border-b border-accent/30 focus:border-accent outline-none pb-2 transition-colors";

export function ShortTextInput({ value, onChange, onSubmit, live, question }: QuestionInputProps) {
  const type =
    question.type === "email" ? "email" : question.type === "number" ? "text" : "text";
  return (
    <input
      autoFocus={live}
      type={type}
      inputMode={question.type === "number" ? "decimal" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit();
        }
      }}
      placeholder="Type your answer here..."
      className={BASE}
    />
  );
}

export function LongTextInput({ value, onChange, onSubmit, live }: QuestionInputProps) {
  return (
    <div>
      <textarea
        autoFocus={live}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Type your answer here..."
        rows={1}
        className={`${BASE} resize-none min-h-[3rem]`}
      />
      <p className="mt-2 text-xs text-ink-soft">
        <span className="font-semibold">Shift ⇧ + Enter ↵</span> to make a line
        break
      </p>
    </div>
  );
}

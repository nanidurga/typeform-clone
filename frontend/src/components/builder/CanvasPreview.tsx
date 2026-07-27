"use client";

import { useState } from "react";

import { QuestionScreen } from "@/components/questions/QuestionScreen";
import { themeStyle } from "@/lib/themes";
import type { FormTheme, Question } from "@/lib/types";

interface CanvasPreviewProps {
  question: Question | null;
  index: number;
  total: number;
  theme: FormTheme | null;
  onEditTitle: (title: string) => void;
  onEditDescription: (description: string) => void;
}

export function CanvasPreview({
  question,
  index,
  total,
  theme,
  onEditTitle,
  onEditDescription,
}: CanvasPreviewProps) {
  // preview-only answer state so the inputs feel real in the canvas
  const [previewValue, setPreviewValue] = useState("");

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-bg-soft">
      <div className="flex items-center justify-between px-6 pt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Live preview
        </span>
        {question && (
          <span className="text-xs text-ink-soft">
            Question {index + 1} of {total}
          </span>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div
          style={themeStyle(theme)}
          className="relative flex min-h-[420px] w-full max-w-3xl items-center justify-center overflow-hidden rounded-2xl border border-line p-10 shadow-sm"
        >
          {question ? (
            <QuestionScreen
              key={question.id}
              question={question}
              index={index}
              value={previewValue}
              onChange={setPreviewValue}
              onSubmit={() => setPreviewValue("")}
              editable
              onEditTitle={onEditTitle}
              onEditDescription={onEditDescription}
            />
          ) : (
            <p className="text-ink-soft opacity-70">
              Add a question to see the live preview.
            </p>
          )}
          {/* decorative progress bar like the real fill experience */}
          <div className="absolute inset-x-0 top-0 h-1 bg-accent/15">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: total ? `${((index + 1) / total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

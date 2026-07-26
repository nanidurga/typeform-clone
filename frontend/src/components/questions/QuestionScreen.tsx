"use client";

import { Button } from "@/components/ui/Button";

import type { QuestionInputProps } from "./index";
import {
  DropdownInput,
  MultipleChoiceInput,
  YesNoInput,
} from "./ChoiceInputs";
import { RatingInput } from "./RatingInput";
import { LongTextInput, ShortTextInput } from "./TextInputs";
import type { Question } from "@/lib/types";

function InputForType(props: QuestionInputProps) {
  switch (props.question.type) {
    case "long_text":
      return <LongTextInput {...props} />;
    case "multiple_choice":
      return <MultipleChoiceInput {...props} />;
    case "dropdown":
      return <DropdownInput {...props} />;
    case "yes_no":
      return <YesNoInput {...props} />;
    case "rating":
      return <RatingInput {...props} />;
    default:
      return <ShortTextInput {...props} />;
  }
}

/** Question types where clicking an option auto-advances, so no OK button */
const AUTO_ADVANCE = new Set(["multiple_choice", "dropdown", "yes_no", "rating"]);

interface QuestionScreenProps {
  question: Question;
  index: number;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string | null;
  live?: boolean;
  isLast?: boolean;
  /** builder canvas: inline editing of title/description */
  editable?: boolean;
  onEditTitle?: (title: string) => void;
  onEditDescription?: (description: string) => void;
}

export function QuestionScreen({
  question,
  index,
  value,
  onChange,
  onSubmit,
  error,
  live,
  isLast,
  editable,
  onEditTitle,
  onEditDescription,
}: QuestionScreenProps) {
  const showOk = !AUTO_ADVANCE.has(question.type) || !live;

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-baseline gap-3">
        <span className="flex shrink-0 items-center gap-1 text-sm text-accent">
          {index + 1}
          <span aria-hidden>→</span>
        </span>
        <div className="min-w-0 flex-1">
          {editable ? (
            <input
              value={question.title}
              onChange={(e) => onEditTitle?.(e.target.value)}
              placeholder="Your question here..."
              className="w-full bg-transparent text-2xl md:text-3xl text-ink outline-none placeholder:text-neutral-300 border-b border-transparent focus:border-neutral-200"
            />
          ) : (
            <h1 className="text-2xl md:text-3xl text-ink">
              {question.title}
              {question.required && <span className="text-accent"> *</span>}
            </h1>
          )}

          {editable ? (
            <input
              value={question.description ?? ""}
              onChange={(e) => onEditDescription?.(e.target.value)}
              placeholder="Description (optional)"
              className="mt-2 w-full bg-transparent text-lg text-ink-soft outline-none placeholder:text-neutral-300 border-b border-transparent focus:border-neutral-200"
            />
          ) : (
            question.description && (
              <p className="mt-2 text-lg text-ink-soft">{question.description}</p>
            )
          )}

          <div className="mt-8">
            <InputForType
              question={question}
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
              live={live}
            />
          </div>

          {error && (
            <div className="mt-4 inline-flex items-center gap-2 rounded bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
              <span aria-hidden>⚠</span> {error}
            </div>
          )}

          {showOk && (
            <div className="mt-8 flex items-center gap-3">
              <Button variant="accent" size="lg" onClick={onSubmit}>
                {isLast ? "Submit" : "OK"} <span aria-hidden>✓</span>
              </Button>
              {live && (
                <span className="text-xs text-ink-soft">
                  press <span className="font-semibold">Enter ↵</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

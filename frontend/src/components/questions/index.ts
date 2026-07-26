import type { QuestionType } from "@/lib/types";

export interface QuestionTypeMeta {
  label: string;
  icon: string;
  /** tailwind classes for the colored chip in the builder */
  chip: string;
}

export const QUESTION_TYPE_META: Record<QuestionType, QuestionTypeMeta> = {
  short_text: { label: "Short Text", icon: "Aa", chip: "bg-sky-100 text-sky-700" },
  long_text: { label: "Long Text", icon: "¶", chip: "bg-blue-100 text-blue-700" },
  multiple_choice: { label: "Multiple Choice", icon: "☰", chip: "bg-purple-100 text-purple-700" },
  dropdown: { label: "Dropdown", icon: "▾", chip: "bg-pink-100 text-pink-700" },
  email: { label: "Email", icon: "@", chip: "bg-emerald-100 text-emerald-700" },
  number: { label: "Number", icon: "#", chip: "bg-amber-100 text-amber-700" },
  yes_no: { label: "Yes / No", icon: "Y/N", chip: "bg-rose-100 text-rose-700" },
  rating: { label: "Rating", icon: "★", chip: "bg-yellow-100 text-yellow-700" },
};

export const QUESTION_TYPES = Object.keys(QUESTION_TYPE_META) as QuestionType[];

export interface QuestionInputProps {
  question: import("@/lib/types").Question;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** when true the input listens for its keyboard shortcuts (respondent flow) */
  live?: boolean;
}

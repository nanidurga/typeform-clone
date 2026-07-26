import type { Question } from "./types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Mirrors backend validation.py — returns an error message or null. */
export function validateAnswer(question: Question, rawValue: string): string | null {
  const value = rawValue.trim();

  if (value === "") {
    return question.required ? "Please fill this in" : null;
  }

  switch (question.type) {
    case "email":
      if (!EMAIL_RE.test(value)) {
        return "Hmm… that email doesn't look right";
      }
      return null;
    case "number":
      if (Number.isNaN(Number(value))) {
        return "Numbers only, please";
      }
      return null;
    case "rating": {
      const max = question.settings?.max ?? 5;
      const n = parseInt(value, 10);
      if (!/^\d+$/.test(value) || n < 1 || n > max) {
        return `Please pick a rating between 1 and ${max}`;
      }
      return null;
    }
    case "multiple_choice":
    case "dropdown": {
      const labels = question.options.map((o) => o.label);
      if (!labels.includes(value)) {
        return "Please select an option";
      }
      return null;
    }
    case "yes_no":
      if (value !== "Yes" && value !== "No") {
        return "Please answer Yes or No";
      }
      return null;
    default:
      return null;
  }
}

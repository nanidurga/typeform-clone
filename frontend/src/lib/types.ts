export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export type FormStatus = "draft" | "published";

export interface QuestionOption {
  id: number;
  label: string;
  position: number;
}

export interface Question {
  id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  settings: { max?: number } | null;
  options: QuestionOption[];
}

export interface FormDetail {
  id: number;
  title: string;
  status: FormStatus;
  public_id: string;
  thank_you_message: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

export interface FormListItem {
  id: number;
  title: string;
  status: FormStatus;
  public_id: string;
  response_count: number;
  question_count: number;
  updated_at: string;
}

export interface QuestionCreate {
  type: QuestionType;
  title?: string;
  description?: string;
  required?: boolean;
  settings?: { max?: number };
  options?: string[];
}

export interface QuestionPatch {
  title?: string;
  description?: string | null;
  required?: boolean;
  settings?: { max?: number };
  options?: string[];
}

export interface FormPatch {
  title?: string;
  status?: FormStatus;
  thank_you_message?: string | null;
}

export interface AnswerIn {
  question_id: number;
  value: string;
}

export interface SubmissionErrorItem {
  question_id: number;
  message: string;
}

export interface AnswerOut {
  question_id: number;
  value: string;
}

export interface ResponseListItem {
  id: number;
  submitted_at: string;
  answers: AnswerOut[];
}

export interface ResponseList {
  total: number;
  items: ResponseListItem[];
}

export interface AnswerDetail {
  question_id: number;
  question_title: string;
  question_type: QuestionType;
  value: string;
}

export interface ResponseDetail {
  id: number;
  form_id: number;
  submitted_at: string;
  answers: AnswerDetail[];
}

export interface SummaryQuestion {
  question_id: number;
  title: string;
  type: QuestionType;
  answered_count: number;
  stats: {
    counts?: Record<string, number>;
    average?: number | null;
    distribution?: Record<string, number>;
    max?: number;
    latest?: string[];
  };
}

export interface FormSummary {
  response_count: number;
  questions: SummaryQuestion[];
}

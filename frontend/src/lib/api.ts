import type {
  AnswerIn,
  FormDetail,
  FormListItem,
  FormPatch,
  FormSummary,
  Question,
  QuestionCreate,
  QuestionPatch,
  ResponseDetail,
  ResponseList,
  SubmissionErrorItem,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export class SubmissionError extends Error {
  constructor(public errors: SubmissionErrorItem[]) {
    super("Some answers need attention");
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listForms: () => request<FormListItem[]>("/api/forms"),
  createForm: (title: string) =>
    request<FormDetail>("/api/forms", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  getForm: (id: number) => request<FormDetail>(`/api/forms/${id}`),
  updateForm: (id: number, patch: FormPatch) =>
    request<FormDetail>(`/api/forms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteForm: (id: number) =>
    request<void>(`/api/forms/${id}`, { method: "DELETE" }),
  duplicateForm: (id: number) =>
    request<FormDetail>(`/api/forms/${id}/duplicate`, { method: "POST" }),

  addQuestion: (formId: number, payload: QuestionCreate) =>
    request<Question>(`/api/forms/${formId}/questions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateQuestion: (id: number, patch: QuestionPatch) =>
    request<Question>(`/api/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteQuestion: (id: number) =>
    request<void>(`/api/questions/${id}`, { method: "DELETE" }),
  reorderQuestions: (formId: number, questionIds: number[]) =>
    request<{ ok: boolean }>(`/api/forms/${formId}/questions/order`, {
      method: "PUT",
      body: JSON.stringify({ question_ids: questionIds }),
    }),

  getPublicForm: (publicId: string) =>
    request<FormDetail>(`/api/public/forms/${publicId}`),
  submitResponse: async (publicId: string, answers: AnswerIn[]) => {
    const res = await fetch(`${API_URL}/api/public/forms/${publicId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (res.status === 422) {
      const body = await res.json();
      const errors: SubmissionErrorItem[] = body?.detail?.errors ?? [];
      throw new SubmissionError(errors);
    }
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    return res.json() as Promise<{ id: number }>;
  },

  listResponses: (formId: number) =>
    request<ResponseList>(`/api/forms/${formId}/responses`),
  getResponse: (id: number) => request<ResponseDetail>(`/api/responses/${id}`),
  getSummary: (formId: number) =>
    request<FormSummary>(`/api/forms/${formId}/summary`),
};

export function publicFormUrl(publicId: string): string {
  if (typeof window === "undefined") return `/f/${publicId}`;
  return `${window.location.origin}/f/${publicId}`;
}

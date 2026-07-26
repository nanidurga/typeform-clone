"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "./api";
import type { FormPatch, QuestionCreate, QuestionPatch } from "./types";

export function useForms() {
  return useQuery({ queryKey: ["forms"], queryFn: api.listForms });
}

export function useForm(id: number) {
  return useQuery({
    queryKey: ["forms", id],
    queryFn: () => api.getForm(id),
    enabled: Number.isFinite(id),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ["forms"] });
    if (id !== undefined) {
      queryClient.invalidateQueries({ queryKey: ["forms", id] });
    }
  };
}

export function useCreateForm() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (title: string) => api.createForm(title),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Couldn't create the form"),
  });
}

export function useUpdateForm() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: FormPatch }) =>
      api.updateForm(id, patch),
    onSuccess: (_data, { id }) => invalidate(id),
    onError: () => toast.error("Couldn't save your changes"),
  });
}

export function useDeleteForm() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => api.deleteForm(id),
    onSuccess: () => {
      invalidate();
      toast.success("Form deleted");
    },
    onError: () => toast.error("Couldn't delete the form"),
  });
}

export function useDuplicateForm() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => api.duplicateForm(id),
    onSuccess: () => {
      invalidate();
      toast.success("Form duplicated");
    },
    onError: () => toast.error("Couldn't duplicate the form"),
  });
}

export function useAddQuestion(formId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: QuestionCreate) => api.addQuestion(formId, payload),
    onSuccess: () => invalidate(formId),
    onError: () => toast.error("Couldn't add the question"),
  });
}

export function useUpdateQuestion(formId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: QuestionPatch }) =>
      api.updateQuestion(id, patch),
    onSuccess: () => invalidate(formId),
    onError: () => toast.error("Couldn't save the question"),
  });
}

export function useDeleteQuestion(formId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => api.deleteQuestion(id),
    onSuccess: () => invalidate(formId),
    onError: () => toast.error("Couldn't delete the question"),
  });
}

export function useReorderQuestions(formId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (questionIds: number[]) =>
      api.reorderQuestions(formId, questionIds),
    onSuccess: () => invalidate(formId),
    onError: () => {
      invalidate(formId);
      toast.error("Couldn't reorder questions");
    },
  });
}

export function useResponses(formId: number) {
  return useQuery({
    queryKey: ["forms", formId, "responses"],
    queryFn: () => api.listResponses(formId),
    enabled: Number.isFinite(formId),
  });
}

export function useResponseDetail(responseId: number | null) {
  return useQuery({
    queryKey: ["responses", responseId],
    queryFn: () => api.getResponse(responseId as number),
    enabled: responseId !== null,
  });
}

export function useSummary(formId: number) {
  return useQuery({
    queryKey: ["forms", formId, "summary"],
    queryFn: () => api.getSummary(formId),
    enabled: Number.isFinite(formId),
  });
}

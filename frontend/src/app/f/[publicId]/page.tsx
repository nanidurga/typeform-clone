"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { FormFiller } from "@/components/respondent/FormFiller";
import { Spinner } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";

export default function PublicFormPage() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;

  const { data: form, isLoading, error } = useQuery({
    queryKey: ["public", publicId],
    queryFn: () => api.getPublicForm(publicId),
    retry: (failureCount, err) =>
      !(err instanceof ApiError && err.status === 404) && failureCount < 2,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <div className="mb-4 text-4xl" aria-hidden>
            🔍
          </div>
          <h1 className="text-2xl font-semibold text-ink">Form not found</h1>
          <p className="mt-3 text-ink-soft">
            This form doesn&apos;t exist or isn&apos;t published anymore. Check
            the link, or ask the person who sent it to you.
          </p>
        </div>
      </div>
    );
  }

  return <FormFiller form={form} />;
}

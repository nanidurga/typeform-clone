"use client";

import { useParams } from "next/navigation";

import { BuilderShell } from "@/components/builder/BuilderShell";
import { Spinner } from "@/components/ui/Spinner";
import { useForm } from "@/lib/hooks";

export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const { data: form, isLoading, isError } = useForm(formId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft">
        Form not found.
      </div>
    );
  }

  return <BuilderShell key={form.id} initialForm={form} />;
}

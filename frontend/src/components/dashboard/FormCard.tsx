"use client";

import Link from "next/link";

import type { FormListItem } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { FormActionsMenu } from "./FormActionsMenu";

interface FormCardProps {
  form: FormListItem;
  onRename: (form: FormListItem) => void;
  onDelete: (form: FormListItem) => void;
}

export function FormCard({ form, onRename, onDelete }: FormCardProps) {
  return (
    <div className="group flex flex-col overflow-visible rounded-xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/forms/${form.id}/edit`}
        className="flex h-28 items-center justify-center rounded-t-xl bg-accent-soft"
      >
        <span className="text-3xl font-bold text-accent">
          {form.title.charAt(0).toUpperCase()}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        <Link
          href={`/forms/${form.id}/edit`}
          className="truncate text-sm font-medium text-ink hover:underline"
          title={form.title}
        >
          {form.title}
        </Link>
        <div className="mt-1 text-xs text-ink-soft">
          {form.question_count} questions ·{" "}
          <Link
            href={`/forms/${form.id}/results`}
            className="hover:text-ink hover:underline"
          >
            {form.response_count}{" "}
            {form.response_count === 1 ? "response" : "responses"}
          </Link>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <StatusBadge status={form.status} />
          <FormActionsMenu
            form={form}
            onRename={onRename}
            onDelete={onDelete}
            trigger={
              <button
                aria-label="Form actions"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-soft opacity-60 transition-opacity hover:bg-neutral-200 group-hover:opacity-100"
              >
                ⋯
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}

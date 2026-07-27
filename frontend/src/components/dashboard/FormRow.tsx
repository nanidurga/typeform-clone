"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { publicFormUrl } from "@/lib/api";
import {
  useDeleteForm,
  useDuplicateForm,
  useUpdateForm,
} from "@/lib/hooks";
import type { FormListItem } from "@/lib/types";
import { Menu } from "@/components/ui/Menu";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface FormRowProps {
  form: FormListItem;
  onRename: (form: FormListItem) => void;
  onDelete: (form: FormListItem) => void;
}

export function FormRow({ form, onRename, onDelete }: FormRowProps) {
  const router = useRouter();
  const updateForm = useUpdateForm();
  const duplicateForm = useDuplicateForm();

  const copyLink = () => {
    navigator.clipboard.writeText(publicFormUrl(form.public_id));
    toast.success("Link copied to clipboard");
  };

  const togglePublish = () => {
    const publishing = form.status === "draft";
    updateForm.mutate(
      { id: form.id, patch: { status: publishing ? "published" : "draft" } },
      {
        onSuccess: () => {
          if (publishing) {
            toast.success("Your form is live!", {
              action: { label: "Copy link", onClick: copyLink },
            });
          } else {
            toast.success("Form unpublished");
          }
        },
      }
    );
  };

  return (
    <div className="group flex items-center gap-4 border-b border-line px-5 py-4 transition-colors first:rounded-t-xl last:rounded-b-xl last:border-b-0 hover:bg-bg-soft">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent font-semibold">
        {form.title.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/forms/${form.id}/edit`}
          className="block truncate font-medium text-ink hover:underline"
        >
          {form.title}
        </Link>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-soft">
          <span>{form.question_count} questions</span>
          <span>·</span>
          <span>
            Updated{" "}
            {new Date(form.updated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
      <StatusBadge status={form.status} />
      <Link
        href={`/forms/${form.id}/results`}
        className="w-24 text-center text-sm text-ink-soft hover:text-ink hover:underline"
      >
        {form.response_count}{" "}
        {form.response_count === 1 ? "response" : "responses"}
      </Link>
      <Menu
        trigger={
          <button
            aria-label="Form actions"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft opacity-60 transition-opacity hover:bg-neutral-200 group-hover:opacity-100"
          >
            ⋯
          </button>
        }
        items={[
          { label: "Open builder", onClick: () => router.push(`/forms/${form.id}/edit`) },
          { label: "View results", onClick: () => router.push(`/forms/${form.id}/results`) },
          { label: "Rename", onClick: () => onRename(form) },
          { label: "Duplicate", onClick: () => duplicateForm.mutate(form.id) },
          {
            label: form.status === "draft" ? "Publish" : "Unpublish",
            onClick: togglePublish,
          },
          {
            label: "Copy link",
            onClick: copyLink,
            disabled: form.status !== "published",
          },
          { label: "Delete", onClick: () => onDelete(form), danger: true },
        ]}
      />
    </div>
  );
}

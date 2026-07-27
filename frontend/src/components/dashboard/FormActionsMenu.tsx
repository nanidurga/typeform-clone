"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { publicFormUrl } from "@/lib/api";
import { useDuplicateForm, useUpdateForm } from "@/lib/hooks";
import type { FormListItem } from "@/lib/types";
import { Menu } from "@/components/ui/Menu";

interface FormActionsMenuProps {
  form: FormListItem;
  onRename: (form: FormListItem) => void;
  onDelete: (form: FormListItem) => void;
  trigger: React.ReactNode;
}

export function copyFormLink(form: FormListItem) {
  navigator.clipboard.writeText(publicFormUrl(form.public_id));
  toast.success("Link copied to clipboard");
}

export function FormActionsMenu({
  form,
  onRename,
  onDelete,
  trigger,
}: FormActionsMenuProps) {
  const router = useRouter();
  const updateForm = useUpdateForm();
  const duplicateForm = useDuplicateForm();

  const togglePublish = () => {
    const publishing = form.status === "draft";
    updateForm.mutate(
      { id: form.id, patch: { status: publishing ? "published" : "draft" } },
      {
        onSuccess: () => {
          if (publishing) {
            toast.success("Your form is live!", {
              action: { label: "Copy link", onClick: () => copyFormLink(form) },
            });
          } else {
            toast.success("Form unpublished");
          }
        },
      }
    );
  };

  return (
    <Menu
      trigger={trigger}
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
          onClick: () => copyFormLink(form),
          disabled: form.status !== "published",
        },
        { label: "Delete", onClick: () => onDelete(form), danger: true },
      ]}
    />
  );
}

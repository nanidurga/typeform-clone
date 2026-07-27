"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { FormCard } from "@/components/dashboard/FormCard";
import { FormRow } from "@/components/dashboard/FormRow";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import {
  useCreateForm,
  useDeleteForm,
  useForms,
  useUpdateForm,
} from "@/lib/hooks";
import type { FormListItem } from "@/lib/types";

type SortKey = "edited" | "created" | "alpha";
type ViewMode = "list" | "grid";

const SORT_LABELS: Record<SortKey, string> = {
  edited: "Last edited",
  created: "Date created",
  alpha: "Alphabetical",
};

function sortForms(forms: FormListItem[], sort: SortKey): FormListItem[] {
  const sorted = [...forms];
  switch (sort) {
    case "created":
      return sorted.sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
      );
    case "alpha":
      return sorted.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
    default:
      return sorted.sort(
        (a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)
      );
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: forms, isLoading, isError } = useForms();
  const createForm = useCreateForm();
  const updateForm = useUpdateForm();
  const deleteForm = useDeleteForm();

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [renaming, setRenaming] = useState<FormListItem | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleting, setDeleting] = useState<FormListItem | null>(null);

  const [sort, setSort] = useState<SortKey>("edited");
  const [view, setView] = useState<ViewMode>("list");

  // restore preferences after mount (localStorage is client-only)
  useEffect(() => {
    const savedSort = localStorage.getItem("dashboard.sort") as SortKey | null;
    const savedView = localStorage.getItem("dashboard.view") as ViewMode | null;
    if (savedSort && savedSort in SORT_LABELS) setSort(savedSort);
    if (savedView === "grid" || savedView === "list") setView(savedView);
  }, []);

  const changeSort = (next: SortKey) => {
    setSort(next);
    localStorage.setItem("dashboard.sort", next);
  };
  const changeView = (next: ViewMode) => {
    setView(next);
    localStorage.setItem("dashboard.view", next);
  };

  const sortedForms = useMemo(
    () => (forms ? sortForms(forms, sort) : []),
    [forms, sort]
  );

  const submitCreate = () => {
    const title = newTitle.trim() || "My new form";
    createForm.mutate(title, {
      onSuccess: (form) => {
        setCreateOpen(false);
        setNewTitle("");
        toast.success("Form created");
        router.push(`/forms/${form.id}/edit`);
      },
    });
  };

  const submitRename = () => {
    if (!renaming) return;
    const title = renameTitle.trim();
    if (!title) return;
    updateForm.mutate(
      { id: renaming.id, patch: { title } },
      {
        onSuccess: () => {
          setRenaming(null);
          toast.success("Form renamed");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-bg-soft">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-ink">
              Formly
            </span>
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
              Typeform clone
            </span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
            D
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">My workspace</h1>
          <div className="ml-auto flex items-center gap-2">
            <select
              aria-label="Sort forms"
              value={sort}
              onChange={(e) => changeSort(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-line bg-white px-2.5 text-sm text-ink outline-none focus:border-ink"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <div className="flex rounded-lg border border-line bg-white p-0.5">
              <button
                aria-label="List view"
                onClick={() => changeView("list")}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
                  view === "list" ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                ≡
              </button>
              <button
                aria-label="Grid view"
                onClick={() => changeView("grid")}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
                  view === "grid" ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                ⊞
              </button>
            </div>
            <Button onClick={() => setCreateOpen(true)}>+ Create typeform</Button>
          </div>
        </div>

        {isLoading && <Spinner className="py-24" />}
        {isError && (
          <div className="rounded-xl border border-line bg-white p-10 text-center text-ink-soft">
            Couldn&apos;t reach the API. Is the backend running?
          </div>
        )}

        {forms && forms.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-16 text-center">
            <p className="mb-2 text-lg font-medium text-ink">
              Nothing here yet
            </p>
            <p className="mb-6 text-sm text-ink-soft">
              Create your first form and start collecting responses.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              + Create typeform
            </Button>
          </div>
        )}

        {forms && forms.length > 0 && view === "list" && (
          <div className="rounded-xl border border-line bg-white shadow-sm">
            {sortedForms.map((form) => (
              <FormRow
                key={form.id}
                form={form}
                onRename={(f) => {
                  setRenaming(f);
                  setRenameTitle(f.title);
                }}
                onDelete={(f) => setDeleting(f)}
              />
            ))}
          </div>
        )}

        {forms && forms.length > 0 && view === "grid" && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {sortedForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                onRename={(f) => {
                  setRenaming(f);
                  setRenameTitle(f.title);
                }}
                onDelete={(f) => setDeleting(f)}
              />
            ))}
          </div>
        )}
      </main>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a new form"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={createForm.isPending}>
              Create
            </Button>
          </>
        }
      >
        <input
          autoFocus
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitCreate()}
          placeholder="Form name, e.g. Customer Feedback"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </Modal>

      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Rename form"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={submitRename} disabled={updateForm.isPending}>
              Save
            </Button>
          </>
        }
      >
        <input
          autoFocus
          value={renameTitle}
          onChange={(e) => setRenameTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitRename()}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this form?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteForm.isPending}
              onClick={() => {
                if (!deleting) return;
                deleteForm.mutate(deleting.id, {
                  onSuccess: () => setDeleting(null),
                });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          <span className="font-medium text-ink">{deleting?.title}</span> and
          all of its responses will be permanently deleted. This can&apos;t be
          undone.
        </p>
      </Modal>
    </div>
  );
}

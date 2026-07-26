"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { publicFormUrl } from "@/lib/api";
import type { FormStatus } from "@/lib/types";

interface TopBarProps {
  title: string;
  status: FormStatus;
  publicId: string;
  saveState: "saved" | "saving";
  onTitleChange: (title: string) => void;
  onTogglePublish: () => void;
  formId: number;
}

export function TopBar({
  title,
  status,
  publicId,
  saveState,
  onTitleChange,
  onTogglePublish,
  formId,
}: TopBarProps) {
  const copyLink = () => {
    navigator.clipboard.writeText(publicFormUrl(publicId));
    toast.success("Link copied to clipboard");
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-white px-4">
      <Link
        href="/"
        className="rounded-md px-2 py-1 text-sm text-ink-soft hover:bg-bg-soft hover:text-ink"
      >
        ← My workspace
      </Link>
      <div className="h-5 w-px bg-line" />
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="min-w-0 max-w-xs flex-1 rounded-md border border-transparent px-2 py-1 text-sm font-medium text-ink outline-none hover:border-line focus:border-ink"
        aria-label="Form title"
      />
      <StatusBadge status={status} />
      <span className="text-xs text-ink-soft">
        {saveState === "saving" ? "Saving…" : "✓ Saved"}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href={`/forms/${formId}/results`}
          className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-bg-soft hover:text-ink"
        >
          Results
        </Link>
        {status === "published" ? (
          <>
            <Button variant="secondary" size="sm" onClick={copyLink}>
              Copy link
            </Button>
            <a href={`/f/${publicId}`} target="_blank" rel="noreferrer">
              <Button variant="secondary" size="sm">
                View ↗
              </Button>
            </a>
            <Button variant="secondary" size="sm" onClick={onTogglePublish}>
              Unpublish
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={onTogglePublish}>
            Publish
          </Button>
        )}
      </div>
    </header>
  );
}

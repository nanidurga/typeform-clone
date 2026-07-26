"use client";

import { useEffect, useRef, useState } from "react";

import { QUESTION_TYPE_META, QUESTION_TYPES } from "@/components/questions";
import { Button } from "@/components/ui/Button";
import type { QuestionType } from "@/lib/types";

interface AddQuestionMenuProps {
  onAdd: (type: QuestionType) => void;
}

export function AddQuestionMenu({ onAdd }: AddQuestionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button size="sm" className="w-full" onClick={() => setOpen((v) => !v)}>
        + Add question
      </Button>
      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 rounded-lg border border-line bg-white p-2 shadow-xl">
          <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Question types
          </p>
          <div className="grid grid-cols-1 gap-1">
            {QUESTION_TYPES.map((type) => {
              const meta = QUESTION_TYPE_META[type];
              return (
                <button
                  key={type}
                  onClick={() => {
                    setOpen(false);
                    onAdd(type);
                  }}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-ink hover:bg-bg-soft"
                >
                  <span
                    className={`flex h-6 w-8 items-center justify-center rounded text-[11px] font-bold ${meta.chip}`}
                  >
                    {meta.icon}
                  </span>
                  {meta.label}
                </button>
              );
            })}
          </div>
          <div className="mt-1 border-t border-line pt-1">
            <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-neutral-400">
              <span className="flex h-6 w-8 items-center justify-center rounded bg-neutral-100 text-[11px] font-bold">
                📎
              </span>
              File upload
              <span className="ml-auto rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

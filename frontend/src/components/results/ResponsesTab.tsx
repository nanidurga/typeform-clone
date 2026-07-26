"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useResponseDetail } from "@/lib/hooks";
import type { FormDetail, ResponseList } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ResponsesTabProps {
  form: FormDetail;
  responses: ResponseList;
}

export function ResponsesTab({ form, responses }: ResponsesTabProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const detail = useResponseDetail(openId);

  const columns = form.questions.slice(0, 3);

  if (responses.items.length === 0) {
    return (
      <p className="py-16 text-center text-ink-soft">
        No responses yet. Share your form to start collecting!
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg-soft text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3 font-semibold">Submitted</th>
              {columns.map((q) => (
                <th key={q.id} className="max-w-48 truncate px-4 py-3 font-semibold">
                  {q.title}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {responses.items.map((item) => {
              const byQuestion = new Map(
                item.answers.map((a) => [a.question_id, a.value])
              );
              return (
                <tr
                  key={item.id}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-bg-soft"
                  onClick={() => setOpenId(item.id)}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {formatDate(item.submitted_at)}
                  </td>
                  {columns.map((q) => (
                    <td key={q.id} className="max-w-48 truncate px-4 py-3 text-ink">
                      {byQuestion.get(q.id) ?? (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <span className="text-accent hover:underline">View</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={openId !== null}
        onClose={() => setOpenId(null)}
        title={`Response #${openId ?? ""}`}
      >
        {detail.isLoading && <Spinner className="py-8" />}
        {detail.data && (
          <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
            <p className="text-xs text-ink-soft">
              Submitted {formatDate(detail.data.submitted_at)}
            </p>
            {detail.data.answers.map((answer) => (
              <div key={answer.question_id}>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                  {answer.question_title}
                </p>
                <p className="mt-1 rounded-md bg-bg-soft px-3 py-2 text-sm text-ink">
                  {answer.value}
                </p>
              </div>
            ))}
            {detail.data.answers.length === 0 && (
              <p className="text-sm text-ink-soft">
                This response has no answers.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

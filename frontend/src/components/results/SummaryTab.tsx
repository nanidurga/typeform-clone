"use client";

import { QUESTION_TYPE_META } from "@/components/questions";
import type { FormSummary } from "@/lib/types";

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-sm text-ink">{label}</span>
      <div className="h-6 flex-1 overflow-hidden rounded bg-neutral-100">
        {count > 0 && (
          <div
            className="flex h-full items-center rounded bg-accent/80 px-2 text-xs font-medium text-white transition-all"
            style={{ width: `${Math.max(pct, 8)}%` }}
          >
            {pct >= 8 ? `${pct}%` : ""}
          </div>
        )}
      </div>
      <span className="w-16 shrink-0 text-right text-sm text-ink-soft">
        {count} {count === 1 ? "resp." : "resp."}
      </span>
    </div>
  );
}

export function SummaryTab({ summary }: { summary: FormSummary }) {
  if (summary.questions.length === 0) {
    return (
      <p className="py-16 text-center text-ink-soft">
        This form has no questions yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {summary.questions.map((question, index) => {
        const meta = QUESTION_TYPE_META[question.type];
        return (
          <div
            key={question.question_id}
            className="rounded-xl border border-line bg-white p-5"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span
                className={`flex h-6 w-9 items-center justify-center rounded text-[11px] font-bold ${meta.chip}`}
              >
                {meta.icon}
                <span className="ml-0.5">{index + 1}</span>
              </span>
              <h3 className="font-medium text-ink">{question.title}</h3>
              <span className="ml-auto shrink-0 text-xs text-ink-soft">
                {question.answered_count} answered
              </span>
            </div>

            {question.stats.counts && (
              <div className="space-y-2">
                {Object.entries(question.stats.counts).map(([label, count]) => (
                  <Bar
                    key={label}
                    label={label}
                    count={count}
                    total={question.answered_count}
                  />
                ))}
              </div>
            )}

            {question.type === "rating" && question.stats.distribution && (
              <div className="flex items-end gap-6">
                <div>
                  <div className="text-4xl font-bold text-ink">
                    {question.stats.average ?? "—"}
                  </div>
                  <div className="text-xs text-ink-soft">
                    average of {question.stats.max}
                  </div>
                </div>
                <div className="flex flex-1 items-end gap-1.5">
                  {Object.entries(question.stats.distribution).map(([value, count]) => {
                    const maxCount = Math.max(
                      1,
                      ...Object.values(question.stats.distribution ?? {})
                    );
                    return (
                      <div key={value} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-xs text-ink-soft">{count}</span>
                        <div
                          className="w-full rounded-t bg-accent/70"
                          style={{ height: `${(count / maxCount) * 64 + 4}px` }}
                        />
                        <span className="text-xs text-ink-soft">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {question.type === "number" && !question.stats.counts && (
              <div>
                <div className="text-4xl font-bold text-ink">
                  {question.stats.average ?? "—"}
                </div>
                <div className="text-xs text-ink-soft">average value</div>
              </div>
            )}

            {question.stats.latest && (
              <ul className="space-y-1.5">
                {question.stats.latest.length === 0 && (
                  <li className="text-sm text-ink-soft">No answers yet.</li>
                )}
                {question.stats.latest.map((value, i) => (
                  <li
                    key={i}
                    className="rounded-md bg-bg-soft px-3 py-1.5 text-sm text-ink"
                  >
                    {value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ResponsesTab } from "@/components/results/ResponsesTab";
import { SummaryTab } from "@/components/results/SummaryTab";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { responsesCsvUrl } from "@/lib/api";
import { useForm, useResponses, useSummary } from "@/lib/hooks";

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const { data: form } = useForm(formId);
  const { data: responses } = useResponses(formId);
  const { data: summary } = useSummary(formId);
  const [tab, setTab] = useState<"summary" | "responses">("summary");

  if (!form || !responses || !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-soft">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-6">
          <Link
            href="/"
            className="rounded-md px-2 py-1 text-sm text-ink-soft hover:bg-bg-soft hover:text-ink"
          >
            ← My workspace
          </Link>
          <div className="h-5 w-px bg-line" />
          <span className="truncate font-medium text-ink">{form.title}</span>
          <StatusBadge status={form.status} />
          <Link
            href={`/forms/${formId}/edit`}
            className="ml-auto rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-bg-soft hover:text-ink"
          >
            Edit form
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">
            {responses.total} {responses.total === 1 ? "response" : "responses"}
          </h1>
          <div className="flex items-center gap-2">
            <a
              href={responsesCsvUrl(formId)}
              download
              className={responses.total === 0 ? "pointer-events-none" : ""}
            >
              <Button variant="secondary" disabled={responses.total === 0}>
                ↓ Export CSV
              </Button>
            </a>
            <div className="flex rounded-lg border border-line bg-white p-0.5">
              {(["summary", "responses"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                    tab === t ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tab === "summary" ? (
          <SummaryTab summary={summary} />
        ) : (
          <ResponsesTab form={form} responses={responses} />
        )}
      </main>
    </div>
  );
}

"use client";

import type { Question } from "@/lib/types";

interface SettingsPanelProps {
  question: Question | null;
  onPatchQuestion: (patch: {
    required?: boolean;
    description?: string | null;
    settings?: { max?: number };
    options?: string[];
  }) => void;
  thankYouMessage: string;
  onThankYouChange: (message: string) => void;
  welcome: { enabled: boolean; title: string; message: string };
  onWelcomeChange: (patch: {
    welcome_enabled?: boolean;
    welcome_title?: string | null;
    welcome_message?: string | null;
  }) => void;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <span className="text-sm text-ink">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-ink" : "bg-neutral-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <input
            value={option}
            onChange={(e) => {
              const next = [...options];
              next[index] = e.target.value;
              onChange(next);
            }}
            className="w-full rounded-md border border-line px-2 py-1 text-sm outline-none focus:border-ink"
          />
          <button
            aria-label="Remove option"
            onClick={() => onChange(options.filter((_, i) => i !== index))}
            disabled={options.length <= 1}
            className="px-1 text-neutral-400 hover:text-red-500 disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...options, `Option ${options.length + 1}`])}
        className="text-sm font-medium text-accent hover:underline"
      >
        + Add option
      </button>
    </div>
  );
}

export function SettingsPanel({
  question,
  onPatchQuestion,
  thankYouMessage,
  onThankYouChange,
  welcome,
  onWelcomeChange,
}: SettingsPanelProps) {
  return (
    <aside className="slim-scroll w-64 shrink-0 overflow-y-auto border-l border-line bg-white xl:w-80">
      {question ? (
        <div className="border-b border-line p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Question settings
          </h3>
          <Toggle
            label="Required"
            checked={question.required}
            onChange={(v) => onPatchQuestion({ required: v })}
          />
          <div className="mt-3">
            <label className="mb-1 block text-sm text-ink">Description</label>
            <textarea
              value={question.description ?? ""}
              onChange={(e) =>
                onPatchQuestion({ description: e.target.value || null })
              }
              placeholder="Add a help text shown under the question"
              rows={2}
              className="w-full resize-none rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-ink"
            />
          </div>

          {(question.type === "multiple_choice" ||
            question.type === "dropdown") && (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm text-ink">Choices</label>
              <OptionsEditor
                options={question.options.map((o) => o.label)}
                onChange={(options) => onPatchQuestion({ options })}
              />
            </div>
          )}

          {question.type === "rating" && (
            <div className="mt-4">
              <label className="mb-1 block text-sm text-ink">Scale</label>
              <div className="flex gap-2">
                {[5, 10].map((max) => (
                  <button
                    key={max}
                    onClick={() => onPatchQuestion({ settings: { max } })}
                    className={`rounded-md border px-3 py-1 text-sm ${
                      (question.settings?.max ?? 5) === max
                        ? "border-ink bg-ink text-white"
                        : "border-line text-ink hover:bg-bg-soft"
                    }`}
                  >
                    1 to {max}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-b border-line p-4 text-sm text-ink-soft">
          Select a question to edit its settings.
        </div>
      )}

      <div className="p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Form settings
        </h3>

        <Toggle
          label="Welcome screen"
          checked={welcome.enabled}
          onChange={(v) => onWelcomeChange({ welcome_enabled: v })}
        />
        {welcome.enabled && (
          <div className="mb-4 mt-2 space-y-2 rounded-md border border-line bg-bg-soft p-2.5">
            <input
              value={welcome.title}
              onChange={(e) =>
                onWelcomeChange({ welcome_title: e.target.value || null })
              }
              placeholder="Welcome title (defaults to form name)"
              className="w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-ink"
            />
            <textarea
              value={welcome.message}
              onChange={(e) =>
                onWelcomeChange({ welcome_message: e.target.value || null })
              }
              placeholder="Short intro message (optional)"
              rows={2}
              className="w-full resize-none rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-ink"
            />
          </div>
        )}

        <label className="mb-1 mt-3 block text-sm text-ink">Thank you message</label>
        <textarea
          value={thankYouMessage}
          onChange={(e) => onThankYouChange(e.target.value)}
          placeholder="Thanks for completing this form!"
          rows={2}
          className="w-full resize-none rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-ink"
        />

        <div className="mt-4 space-y-2">
          {["Theme", "Integrations", "Collaboration"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-md border border-dashed border-neutral-200 px-3 py-2 text-sm text-neutral-400"
            >
              {label}
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

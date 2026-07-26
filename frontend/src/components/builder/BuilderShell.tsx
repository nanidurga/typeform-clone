"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api, publicFormUrl } from "@/lib/api";
import type {
  FormDetail,
  Question,
  QuestionPatch,
  QuestionType,
} from "@/lib/types";
import { useDebounced } from "@/lib/useAutosave";

import { CanvasPreview } from "./CanvasPreview";
import { QuestionListPanel } from "./QuestionListPanel";
import { SettingsPanel } from "./SettingsPanel";
import { TopBar } from "./TopBar";

const NEW_QUESTION_DEFAULTS: Partial<
  Record<QuestionType, { options?: string[]; settings?: { max: number } }>
> = {
  multiple_choice: { options: ["Option 1", "Option 2"] },
  dropdown: { options: ["Option 1", "Option 2"] },
  rating: { settings: { max: 5 } },
};

interface BuilderShellProps {
  initialForm: FormDetail;
}

export function BuilderShell({ initialForm }: BuilderShellProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormDetail>(initialForm);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialForm.questions[0]?.id ?? null
  );
  const [pendingSaves, setPendingSaves] = useState(0);

  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    return () => {
      // dashboard/results should refetch after builder edits
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    };
  }, [queryClient]);

  const track = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
    setPendingSaves((n) => n + 1);
    try {
      return await promise;
    } finally {
      setPendingSaves((n) => n - 1);
    }
  }, []);

  const selected =
    form.questions.find((q) => q.id === selectedId) ?? null;
  const selectedIndex = selected
    ? form.questions.findIndex((q) => q.id === selected.id)
    : 0;

  /* ---------- question editing ---------- */

  const buildServerPatch = (question: Question): QuestionPatch => {
    const patch: QuestionPatch = {
      title: question.title,
      description: question.description,
      required: question.required,
    };
    if (question.settings) patch.settings = question.settings;
    if (question.type === "multiple_choice" || question.type === "dropdown") {
      patch.options = question.options.map((o) => o.label);
    }
    return patch;
  };

  const saveQuestionNow = useCallback(
    (questionId: number) => {
      const question = formRef.current.questions.find(
        (q) => q.id === questionId
      );
      if (!question) return;
      void track(api.updateQuestion(questionId, buildServerPatch(question))).catch(
        () => toast.error("Couldn't save the question")
      );
    },
    [track]
  );

  const saveQuestionDebounced = useDebounced(saveQuestionNow, 500);

  const patchQuestionLocal = (
    questionId: number,
    patch: Partial<Question> & { optionLabels?: string[] }
  ) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== questionId) return q;
        const next: Question = { ...q, ...patch };
        if (patch.optionLabels) {
          next.options = patch.optionLabels.map((label, i) => ({
            id: q.options[i]?.id ?? -(i + 1),
            label,
            position: i,
          }));
        }
        return next;
      }),
    }));
    saveQuestionDebounced(questionId);
  };

  /* ---------- question list operations ---------- */

  const addQuestion = (type: QuestionType) => {
    const defaults = NEW_QUESTION_DEFAULTS[type] ?? {};
    void track(api.addQuestion(form.id, { type, ...defaults }))
      .then((question) => {
        setForm((prev) => ({
          ...prev,
          questions: [...prev.questions, question],
        }));
        setSelectedId(question.id);
      })
      .catch(() => toast.error("Couldn't add the question"));
  };

  const duplicateQuestion = (question: Question) => {
    void track(
      api.addQuestion(form.id, {
        type: question.type,
        title: question.title,
        description: question.description ?? undefined,
        required: question.required,
        settings: question.settings ?? undefined,
        options:
          question.type === "multiple_choice" || question.type === "dropdown"
            ? question.options.map((o) => o.label)
            : undefined,
      })
    )
      .then(async (copy) => {
        const ids = formRef.current.questions.map((q) => q.id);
        const at = ids.indexOf(question.id);
        const order = [...ids.slice(0, at + 1), copy.id, ...ids.slice(at + 1)];
        await api.reorderQuestions(form.id, order);
        setForm((prev) => {
          const byId = new Map(prev.questions.map((q) => [q.id, q]));
          byId.set(copy.id, copy);
          return {
            ...prev,
            questions: order
              .map((id) => byId.get(id))
              .filter((q): q is Question => q !== undefined)
              .map((q, i) => ({ ...q, position: i })),
          };
        });
        setSelectedId(copy.id);
      })
      .catch(() => toast.error("Couldn't duplicate the question"));
  };

  const deleteQuestion = (questionId: number) => {
    void track(api.deleteQuestion(questionId))
      .then(() => {
        setForm((prev) => {
          const remaining = prev.questions
            .filter((q) => q.id !== questionId)
            .map((q, i) => ({ ...q, position: i }));
          if (selectedId === questionId) {
            setSelectedId(remaining[0]?.id ?? null);
          }
          return { ...prev, questions: remaining };
        });
      })
      .catch(() => toast.error("Couldn't delete the question"));
  };

  const reorderQuestions = (ids: number[]) => {
    setForm((prev) => {
      const byId = new Map(prev.questions.map((q) => [q.id, q]));
      return {
        ...prev,
        questions: ids
          .map((id) => byId.get(id))
          .filter((q): q is Question => q !== undefined)
          .map((q, i) => ({ ...q, position: i })),
      };
    });
    void track(api.reorderQuestions(form.id, ids)).catch(() =>
      toast.error("Couldn't reorder questions")
    );
  };

  /* ---------- form-level operations ---------- */

  const saveFormNow = useCallback(() => {
    const { title, thank_you_message } = formRef.current;
    void track(
      api.updateForm(formRef.current.id, {
        title,
        thank_you_message,
      })
    ).catch(() => toast.error("Couldn't save your changes"));
  }, [track]);

  const saveFormDebounced = useDebounced(saveFormNow, 500);

  const setTitle = (title: string) => {
    setForm((prev) => ({ ...prev, title }));
    saveFormDebounced();
  };

  const setThankYou = (thank_you_message: string) => {
    setForm((prev) => ({ ...prev, thank_you_message }));
    saveFormDebounced();
  };

  const togglePublish = () => {
    const publishing = form.status === "draft";
    void track(
      api.updateForm(form.id, {
        status: publishing ? "published" : "draft",
      })
    )
      .then((updated) => {
        setForm((prev) => ({ ...prev, status: updated.status }));
        if (publishing) {
          toast.success("Your form is live!", {
            action: {
              label: "Copy link",
              onClick: () => {
                navigator.clipboard.writeText(publicFormUrl(form.public_id));
                toast.success("Link copied to clipboard");
              },
            },
          });
        } else {
          toast.success("Form unpublished");
        }
      })
      .catch(() => toast.error("Couldn't update publish status"));
  };

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        title={form.title}
        status={form.status}
        publicId={form.public_id}
        saveState={pendingSaves > 0 ? "saving" : "saved"}
        onTitleChange={setTitle}
        onTogglePublish={togglePublish}
        formId={form.id}
      />
      <div className="flex min-h-0 flex-1">
        <QuestionListPanel
          questions={form.questions}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={addQuestion}
          onDuplicate={duplicateQuestion}
          onDelete={deleteQuestion}
          onReorder={reorderQuestions}
        />
        <CanvasPreview
          question={selected}
          index={selectedIndex}
          total={form.questions.length}
          onEditTitle={(title) =>
            selected && patchQuestionLocal(selected.id, { title })
          }
          onEditDescription={(description) =>
            selected &&
            patchQuestionLocal(selected.id, { description: description || null })
          }
        />
        <SettingsPanel
          question={selected}
          onPatchQuestion={(patch) => {
            if (!selected) return;
            const { options, ...rest } = patch;
            patchQuestionLocal(selected.id, {
              ...rest,
              optionLabels: options,
            });
          }}
          thankYouMessage={form.thank_you_message ?? ""}
          onThankYouChange={setThankYou}
        />
      </div>
    </div>
  );
}

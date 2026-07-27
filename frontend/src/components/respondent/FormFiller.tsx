"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { QuestionScreen } from "@/components/questions/QuestionScreen";
import { api, SubmissionError } from "@/lib/api";
import { keyOf } from "@/lib/keys";
import { validateAnswer } from "@/lib/respondentValidation";
import type { FormDetail } from "@/lib/types";

import { ProgressBar } from "./ProgressBar";
import { ThankYouScreen } from "./ThankYouScreen";
import { WelcomeScreen } from "./WelcomeScreen";

interface FormFillerProps {
  form: FormDetail;
}

export function FormFiller({ form }: FormFillerProps) {
  const questions = form.questions;
  const [started, setStarted] = useState(!form.welcome_enabled);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  // option clicks advance on a timeout, so validation must read the freshest
  // answers via a ref rather than the closure captured when the timer was set
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const question = questions[current];
  const value = question ? (answers[question.id] ?? "") : "";
  const error = question ? (errors[question.id] ?? null) : null;

  const answeredCount = useMemo(
    () =>
      questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length,
    [questions, answers]
  );
  const percent = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  const setValue = useCallback(
    (v: string) => {
      if (!question) return;
      setAnswers((prev) => ({ ...prev, [question.id]: v }));
      setErrors((prev) => {
        if (!(question.id in prev)) return prev;
        const next = { ...prev };
        delete next[question.id];
        return next;
      });
    },
    [question]
  );

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const goBack = useCallback(() => {
    if (current > 0) goTo(current - 1);
  }, [current, goTo]);

  const submitAll = useCallback(async () => {
    setSubmitting(true);
    try {
      const payload = questions
        .map((q) => ({
          question_id: q.id,
          value: (answersRef.current[q.id] ?? "").trim(),
        }))
        .filter((a) => a.value !== "");
      await api.submitResponse(form.public_id, payload);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof SubmissionError && err.errors.length > 0) {
        const map: Record<number, string> = {};
        for (const e of err.errors) map[e.question_id] = e.message;
        setErrors(map);
        const firstIndex = questions.findIndex((q) => q.id in map);
        if (firstIndex >= 0) goTo(firstIndex);
      } else {
        setErrors((prev) =>
          question ? { ...prev, [question.id]: "Something went wrong — try again" } : prev
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [form.public_id, goTo, question, questions]);

  const advance = useCallback(() => {
    if (!question || submitting) return;
    const message = validateAnswer(question, answersRef.current[question.id] ?? "");
    if (message) {
      setErrors((prev) => ({ ...prev, [question.id]: message }));
      return;
    }
    if (current < questions.length - 1) {
      goTo(current + 1);
    } else {
      void submitAll();
    }
  }, [current, goTo, question, questions.length, submitAll, submitting]);

  useEffect(() => {
    if (submitted) return;
    const onKey = (e: KeyboardEvent) => {
      const key = keyOf(e);
      if (!started) {
        if (key === "Enter" || key === "ArrowDown") {
          e.preventDefault();
          setStarted(true);
        }
        return;
      }
      if (key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        // text inputs submit via their own Enter handler
        if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        e.preventDefault();
        advance();
      } else if (key === "ArrowDown") {
        e.preventDefault();
        advance();
      } else if (key === "ArrowUp") {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, goBack, started, submitted]);

  if (submitted) {
    return <ThankYouScreen message={form.thank_you_message} />;
  }

  if (!started) {
    return (
      <WelcomeScreen
        title={form.welcome_title?.trim() || form.title}
        message={form.welcome_message}
        onStart={() => setStarted(true)}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-soft">
        This form has no questions yet.
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      <ProgressBar percent={percent} />

      <div className="flex flex-1 items-center justify-center px-6 py-20 md:px-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={question.id}
            custom={direction}
            initial={{ opacity: 0, y: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction > 0 ? -60 : 60 }}
            transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
            className="flex w-full justify-center"
          >
            <QuestionScreen
              question={question}
              index={current}
              value={value}
              onChange={setValue}
              onSubmit={advance}
              error={error}
              live
              isLast={current === questions.length - 1}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* bottom bar: progress + nav arrows, Typeform style */}
      <div className="fixed bottom-5 right-5 z-30 flex items-center gap-3">
        <span className="text-xs text-ink-soft">
          {answeredCount} of {questions.length} answered
        </span>
        <div className="flex overflow-hidden rounded-md shadow-md">
          <button
            aria-label="Previous question"
            onClick={goBack}
            disabled={current === 0}
            className="flex h-9 w-9 items-center justify-center bg-accent text-white transition hover:brightness-110 disabled:opacity-40"
          >
            ▲
          </button>
          <button
            aria-label="Next question"
            onClick={advance}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center border-l border-white/20 bg-accent text-white transition hover:brightness-110 disabled:opacity-40"
          >
            ▼
          </button>
        </div>
      </div>

      <div className="fixed bottom-5 left-5 z-30 text-xs text-neutral-400">
        Powered by <span className="font-semibold text-ink-soft">Formly</span>
      </div>
    </div>
  );
}

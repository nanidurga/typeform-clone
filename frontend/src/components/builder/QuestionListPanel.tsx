"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { QUESTION_TYPE_META } from "@/components/questions";
import { Menu } from "@/components/ui/Menu";
import type { Question, QuestionType } from "@/lib/types";

import { AddQuestionMenu } from "./AddQuestionMenu";

interface RowProps {
  question: Question;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function QuestionRow({
  question,
  index,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });
  const meta = QUESTION_TYPE_META[question.type];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-2 rounded-lg border px-2 py-2 ${
        isDragging ? "z-10 shadow-lg" : ""
      } ${
        selected
          ? "border-ink/20 bg-white shadow-sm"
          : "border-transparent hover:bg-white/70"
      }`}
    >
      <button
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        className="cursor-grab px-0.5 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        ⠿
      </button>
      <button
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={`flex h-6 w-9 shrink-0 items-center justify-center rounded text-[11px] font-bold ${meta.chip}`}
        >
          {meta.icon}
          <span className="ml-0.5">{index + 1}</span>
        </span>
        <span
          className={`truncate text-sm ${
            question.title ? "text-ink" : "italic text-neutral-400"
          }`}
        >
          {question.title || "Untitled question"}
        </span>
      </button>
      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <Menu
          trigger={
            <button
              aria-label="Question actions"
              className="flex h-6 w-6 items-center justify-center rounded text-ink-soft hover:bg-neutral-200"
            >
              ⋯
            </button>
          }
          items={[
            { label: "Duplicate", onClick: onDuplicate },
            { label: "Delete", onClick: onDelete, danger: true },
          ]}
        />
      </div>
    </div>
  );
}

interface QuestionListPanelProps {
  questions: Question[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd: (type: QuestionType) => void;
  onDuplicate: (question: Question) => void;
  onDelete: (id: number) => void;
  onReorder: (ids: number[]) => void;
}

export function QuestionListPanel({
  questions,
  selectedId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onReorder,
}: QuestionListPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(questions, oldIndex, newIndex).map((q) => q.id));
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-bg-soft xl:w-72">
      <div className="border-b border-line p-3">
        <AddQuestionMenu onAdd={onAdd} />
      </div>
      <div className="slim-scroll flex-1 space-y-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((question, index) => (
              <QuestionRow
                key={question.id}
                question={question}
                index={index}
                selected={question.id === selectedId}
                onSelect={() => onSelect(question.id)}
                onDuplicate={() => onDuplicate(question)}
                onDelete={() => onDelete(question.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {questions.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-ink-soft">
            No questions yet. Add your first one!
          </p>
        )}
      </div>
      <div className="border-t border-line p-3 text-xs text-neutral-400">
        <p className="mb-1 font-semibold uppercase tracking-wide">Logic</p>
        <p>Branching &amp; logic jumps — Coming soon</p>
      </div>
    </aside>
  );
}

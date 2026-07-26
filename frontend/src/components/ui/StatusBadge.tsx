import type { FormStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: FormStatus }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
      Draft
    </span>
  );
}

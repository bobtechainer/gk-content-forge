import type { ContentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAP: Record<ContentStatus, { label: string; cls: string }> = {
  draft: { label: "Nháp", cls: "bg-muted text-muted-foreground" },
  published: { label: "Đã xuất bản", cls: "bg-success-100 text-success-700" },
  pending: { label: "Chờ duyệt", cls: "bg-warning-100 text-warning-700" },
  rejected: { label: "Bị từ chối", cls: "bg-error-100 text-error-700" },
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const m = MAP[status];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", m.cls)}
    >
      {m.label}
    </span>
  );
}

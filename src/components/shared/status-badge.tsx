import type { ContentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAP: Record<ContentStatus, { label: string; cls: string }> = {
  draft: { label: "Nháp", cls: "bg-muted text-muted-foreground" },
  published: { label: "Đã xuất bản", cls: "bg-[#D1FAE5] text-[#065F46]" },
  pending: { label: "Chờ duyệt", cls: "bg-[#FEF3C7] text-[#92400E]" },
  rejected: { label: "Bị từ chối", cls: "bg-[#FEE2E2] text-[#991B1B]" },
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

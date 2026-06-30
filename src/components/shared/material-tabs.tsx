import { MATERIAL_TYPE_LABELS } from "@/lib/taxonomy";
import type { ContentStatus, MaterialType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface LibraryTab {
  id: string;
  label: string;
  /** Primary filter: items whose resolved MaterialType is in this list belong to this tab. */
  types: MaterialType[];
  /** Whether to show subtype filter chips within this tab. */
  hasSubtypeFilter: boolean;
  /** Tab này là một MODULE riêng (Storyboard / UI System) — render kho riêng, không lọc ContentItem. */
  module?: "storyboard" | "ui_system";
}

export const LIBRARY_TABS: LibraryTab[] = [
  { id: "book", label: "Bộ sách", types: ["book"], hasSubtypeFilter: false },
  { id: "course", label: "Khóa học", types: ["course"], hasSubtypeFilter: false },
  {
    id: "interactive",
    label: "Học liệu tương tác",
    types: ["quiz", "lesson", "advanced", "scorm"],
    hasSubtypeFilter: true,
  },
  {
    id: "attachment",
    label: "Tệp đính kèm",
    types: ["document", "video", "image", "audio", "3d_vr"],
    hasSubtypeFilter: true,
  },
  { id: "storyboard", label: "Storyboard", types: [], hasSubtypeFilter: false, module: "storyboard" },
  { id: "ui_system", label: "Giao diện", types: [], hasSubtypeFilter: false, module: "ui_system" },
];

/** Kept for backward-compat with old imports. */
export const LIBRARY_ZONES = LIBRARY_TABS;

export function MaterialTabs({
  tabIndex,
  onTabChange,
  subtype,
  onSubtypeChange,
}: {
  tabIndex: number;
  onTabChange: (index: number) => void;
  subtype: MaterialType | null;
  onSubtypeChange: (type: MaterialType | null) => void;
}) {
  const tab = LIBRARY_TABS[tabIndex];

  return (
    <div className="space-y-3">
      {/* Horizontal tab bar — YouTube Studio style */}
      <div className="flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LIBRARY_TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              onTabChange(i);
              onSubtypeChange(null);
            }}
            className={cn(
              "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition",
              i === tabIndex
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {i === tabIndex && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Subtype filter chips — only when the tab has subtypes */}
      {tab.hasSubtypeFilter && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <SubtypeChip
              label="Tất cả"
              active={subtype === null}
              onClick={() => onSubtypeChange(null)}
            />
            {tab.types.map((type) => (
              <SubtypeChip
                key={type}
                label={MATERIAL_TYPE_LABELS[type]}
                active={subtype === type}
                onClick={() => onSubtypeChange(type)}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent md:hidden" />
        </div>
      )}
    </div>
  );
}

function SubtypeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40",
      )}
    >
      {label}
    </button>
  );
}

const STATUS_CHIPS: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Nháp" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "published", label: "Đã xuất bản" },
  { value: "rejected", label: "Bị từ chối" },
];

export function StatusFilterChips({
  value,
  onChange,
}: {
  value: ContentStatus | null;
  onChange: (status: ContentStatus | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_CHIPS.map((chip) => {
        const active = value === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : chip.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              active
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

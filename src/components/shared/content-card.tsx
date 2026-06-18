import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Copy, Eye, Heart, MoreVertical, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { builderRoutePattern } from "@/lib/builder-url";
import { MATERIAL_TYPE_LABELS } from "@/lib/taxonomy";
import type { ContentItem, MaterialType } from "@/lib/types";
import { useContent } from "@/stores/content";
import { FileIcon } from "./file-icon";
import { MaterialTypeIcon } from "./material-type-icon";
import { StatusBadge } from "./status-badge";

type Scope = "creator" | "org" | "admin";

function resolveType(item: ContentItem): MaterialType {
  if (item.category === "book") return "book";
  if (item.category === "course") return "course";
  return item.materialSubtype ?? "document";
}

const builderTo = builderRoutePattern;

export function ContentCard({ item, scope }: { item: ContentItem; scope: Scope }) {
  const del = useContent((s) => s.deleteItem);
  const duplicate = useContent((s) => s.duplicateItem);
  const base = scope === "org" ? "/org" : "/creator";
  const type = resolveType(item);
  const canEdit = scope !== "admin";

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        {item.fileName ? (
          <FileIcon name={item.fileName} className="h-10 w-10" />
        ) : (
          <MaterialTypeIcon type={type} size={40} />
        )}
        <div className="min-w-0 flex-1">
          {canEdit ? (
            <Link
              to={builderTo(base, item)}
              params={{ id: item.id }}
              target="_blank"
              rel="noopener"
              className="line-clamp-2 text-sm font-semibold text-foreground hover:text-[#2563EB]"
            >
              {item.title}
            </Link>
          ) : (
            <span className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</span>
          )}
          <div className="mt-0.5 text-xs text-muted-foreground">
            {MATERIAL_TYPE_LABELS[type]} • {item.subject} • {item.grade}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label={`Tùy chọn cho ${item.title}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem asChild>
                <Link to={builderTo(base, item)} params={{ id: item.id }} target="_blank" rel="noopener" className="gap-2">
                  <Pencil className="h-4 w-4" /> Sửa
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="gap-2"
              onClick={() => toast.info("Mở trang xem trước trong tab mới (demo)")}
            >
              <Eye className="h-4 w-4" /> Xem trước
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  duplicate(item.id);
                  toast.success("Đã nhân bản thành bản nháp mới");
                }}
              >
                <Copy className="h-4 w-4" /> Nhân bản
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => {
                del(item.id);
                toast.success("Đã xóa nội dung");
              }}
            >
              <Trash2 className="h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={item.status} />
        <span className="text-xs text-muted-foreground">
          {format(new Date(item.createdAt), "dd/MM/yyyy")}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-4 border-t border-border pt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {item.views.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" /> {item.likes.toLocaleString()}
        </span>
        {scope === "org" && item.ownerName && (
          <span className="ml-auto flex items-center gap-1 truncate">
            <User className="h-3.5 w-3.5" /> {item.ownerName}
          </span>
        )}
      </div>
    </div>
  );
}

export function ContentGrid({ items, scope }: { items: ContentItem[]; scope: Scope }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        Chưa có nội dung phù hợp bộ lọc hiện tại.
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} scope={scope} />
      ))}
    </div>
  );
}

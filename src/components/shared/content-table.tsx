import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Eye, FileText, GraduationCap, Library, Pencil, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MATERIAL_TYPE_LABELS } from "@/lib/taxonomy";
import type { ContentItem, MaterialType } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useContent } from "@/stores/content";

type Scope = "creator" | "org" | "admin";

function resolveType(item: ContentItem): MaterialType {
  if (item.category === "book") return "book";
  if (item.category === "course") return "course";
  return item.materialSubtype ?? "document";
}

const getContentIcon = (item: ContentItem) => {
  if (item.category === "book") return BookOpen;
  if (item.category === "course") return GraduationCap;
  if (item.materialSubtype === "quiz") return FileText;
  return Library;
};

function builderTo(base: string, item: ContentItem) {
  if (item.category === "book") return `${base}/builder/book/$id`;
  if (item.category === "course") return `${base}/builder/course/$id`;
  if (item.materialSubtype === "quiz") return `${base}/builder/quiz/$id`;
  return `${base}/builder/material/$id`;
}

export function ContentTable({ items, scope = "creator" }: { items: ContentItem[]; scope?: Scope }) {
  const del = useContent((s) => s.deleteItem);
  const base = scope === "org" ? "/org" : "/creator";
  const canEdit = scope !== "admin";
  const [preview, setPreview] = useState<ContentItem | null>(null);

  if (items.length === 0)
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Chưa có nội dung phù hợp.
      </div>
    );
  return (
    <>
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Tiêu đề</th>
              <th className="px-4 py-3 font-medium">Loại</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium">Lượt xem</th>
              {scope === "org" && <th className="px-4 py-3 font-medium">Tác giả</th>}
              <th className="px-4 py-3 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const Icon = getContentIcon(item);
              const type = resolveType(item);
              return (
                <tr key={item.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setPreview(item)}
                      className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                    >
                      <div
                        className="flex h-9 w-12 shrink-0 items-center justify-center rounded text-white"
                        style={{ backgroundColor: item.thumbnailColor }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.subject} • {item.grade}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{MATERIAL_TYPE_LABELS[type]}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(item.createdAt), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 text-foreground">{item.views.toLocaleString()}</td>
                  {scope === "org" && (
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">
                      {item.ownerName ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-10 min-w-10"
                        aria-label={`Xem trước ${item.title}`}
                        onClick={() => setPreview(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button asChild variant="ghost" size="icon" className="min-h-10 min-w-10">
                          <Link
                            aria-label={`Sửa ${item.title}`}
                            to={builderTo(base, item)}
                            params={{ id: item.id }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-10 min-w-10 text-destructive hover:text-destructive"
                        aria-label={`Xóa ${item.title}`}
                        onClick={() => {
                          del(item.id);
                          toast.success(`Đã xóa "${item.title}"`);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Preview Dialog */}
      <ContentPreviewDialog item={preview} onClose={() => setPreview(null)} scope={scope} />
    </>
  );
}

function ContentPreviewDialog({
  item,
  onClose,
  scope,
}: {
  item: ContentItem | null;
  onClose: () => void;
  scope: Scope;
}) {
  if (!item) return null;
  const Icon = getContentIcon(item);
  const type = resolveType(item);
  const base = scope === "org" ? "/org" : "/creator";
  const canEdit = scope !== "admin";

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-white"
              style={{ backgroundColor: item.thumbnailColor }}
            >
              <Icon className="h-4 w-4" />
            </div>
            {item.title}
          </DialogTitle>
          <DialogDescription>
            {MATERIAL_TYPE_LABELS[type]} • {item.subject} • {item.grade}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <PreviewStat label="Trạng thái" value={item.status === "published" ? "Đã xuất bản" : item.status === "draft" ? "Nháp" : item.status === "pending" ? "Chờ duyệt" : "Bị từ chối"} />
            <PreviewStat label="Lượt xem" value={item.views.toLocaleString()} />
            <PreviewStat label="Lượt thích" value={item.likes.toLocaleString()} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PreviewStat label="Ngày tạo" value={format(new Date(item.createdAt), "dd/MM/yyyy")} />
            <PreviewStat label="Lượt chia sẻ" value={item.shares.toLocaleString()} />
          </div>

          {item.description && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Mô tả</div>
              <p className="mt-1 text-sm text-foreground">{item.description}</p>
            </div>
          )}

          {item.tags.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Tags</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.platforms.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Nền tảng</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {item.platforms.map((p) => (
                  <span key={p} className="rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-xs font-medium text-[#2563EB]">
                    {p === "national" ? "Trường học số" : "GK Ebooks"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.fileName && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Tệp tin</div>
              <p className="mt-1 text-sm text-foreground">{item.fileName}</p>
            </div>
          )}

          {canEdit && (
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
              <Button asChild size="sm" className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
                <Link to={builderTo(base, item)} params={{ id: item.id }}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Chỉnh sửa
                </Link>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

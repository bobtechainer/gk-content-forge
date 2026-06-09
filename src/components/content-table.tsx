import { Link } from "@tanstack/react-router";
import { Eye, Pencil, Trash2, FileText, ListChecks } from "lucide-react";
import { format } from "date-fns";
import type { ContentItem } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { useContent } from "@/stores/content";

export function ContentTable({ items }: { items: ContentItem[] }) {
  const del = useContent((s) => s.deleteItem);
  if (items.length === 0)
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Chưa có nội dung phù hợp.
      </div>
    );
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Tiêu đề</th>
            <th className="px-4 py-3 font-medium">Loại</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
            <th className="px-4 py-3 font-medium">Ngày tạo</th>
            <th className="px-4 py-3 font-medium">Lượt xem</th>
            <th className="px-4 py-3 font-medium text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-border hover:bg-muted/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-12 shrink-0 items-center justify-center rounded text-white"
                    style={{ backgroundColor: item.thumbnailColor }}
                  >
                    {item.type === "quiz" ? (
                      <ListChecks className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.subject} • {item.grade}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.type === "quiz" ? "Bộ đề" : "Học liệu"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {format(new Date(item.createdAt), "dd/MM/yyyy")}
              </td>
              <td className="px-4 py-3 text-foreground">{item.views.toLocaleString()}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link
                      to={item.type === "quiz" ? "/builder/quiz/$id" : "/builder/material/$id"}
                      params={{ id: item.id }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => del(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
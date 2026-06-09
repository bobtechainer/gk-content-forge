import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, Image as ImageIcon, Video, Music, FileCode, ListChecks, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PublishSheet } from "@/components/publish-sheet";
import { useContent } from "@/stores/content";

export const Route = createFileRoute("/_app/builder/material/$id")({
  head: () => ({ meta: [{ title: "Soạn học liệu — GK Studio" }] }),
  component: MaterialBuilder,
});

const BLOCKS = [
  { type: "text", label: "Văn bản", icon: FileText },
  { type: "image", label: "Hình ảnh", icon: ImageIcon },
  { type: "video", label: "Video", icon: Video },
  { type: "audio", label: "Âm thanh", icon: Music },
  { type: "pdf", label: "PDF", icon: FileText },
  { type: "embed", label: "Embed", icon: FileCode },
  { type: "quiz", label: "Quiz block", icon: ListChecks },
];

function MaterialBuilder() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const item = useContent((s) => s.items.find((x) => x.id === id));
  const updateItem = useContent((s) => s.updateItem);
  const [title, setTitle] = useState(item?.title ?? "Học liệu chưa đặt tên");
  const [blocks, setBlocks] = useState<{ id: string; type: string; content: string }[]>([
    { id: "b1", type: "text", content: "Nhập nội dung bài học của bạn tại đây…" },
  ]);
  const [open, setOpen] = useState(false);

  const add = (type: string) =>
    setBlocks((b) => [...b, { id: `b_${Date.now()}`, type, content: "" }]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => item && updateItem(id, { title })}
          className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-base font-semibold text-foreground outline-none hover:bg-muted/50 focus:bg-muted/50"
        />
        <Button size="sm" className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]" onClick={() => setOpen(true)}>
          Xuất bản
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[220px] shrink-0 space-y-2 overflow-y-auto border-r border-border bg-sidebar p-4">
          <h3 className="text-sm font-semibold text-foreground">Các khối nội dung</h3>
          <p className="text-xs text-muted-foreground">Bấm để thêm vào canvas</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {BLOCKS.map((b) => {
              const Icon = b.icon;
              return (
                <button
                  key={b.type}
                  onClick={() => add(b.type)}
                  className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-card p-3 text-xs font-medium hover:border-[#2563EB] hover:bg-[#EFF6FF]"
                >
                  <Icon className="h-5 w-5 text-[#2563EB]" />
                  {b.label}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mx-auto max-w-3xl space-y-3">
            {blocks.map((b) => (
              <div key={b.id} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-xs font-medium text-[#2563EB]">
                    {b.type}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => setBlocks(blocks.filter((x) => x.id !== b.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {b.type === "text" ? (
                  <Textarea
                    rows={5}
                    value={b.content}
                    onChange={(e) =>
                      setBlocks(blocks.map((x) => (x.id === b.id ? { ...x, content: e.target.value } : x)))
                    }
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                    Khu vực tải lên {b.type}
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-center">
              <Button variant="outline" className="border-dashed" onClick={() => add("text")}>
                <Plus className="mr-1.5 h-4 w-4" /> Thêm khối
              </Button>
            </div>
          </div>
        </div>
      </div>
      <PublishSheet open={open} onOpenChange={setOpen} contentId={id} title={title}
        onPublished={() => navigate({ to: "/dashboard" })} />
    </div>
  );
}
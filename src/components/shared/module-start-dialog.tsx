import { useNavigate } from "@tanstack/react-router";
import { FilePlus2, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModuleStart } from "@/stores/module-start";
import { newModuleDraftId, newSeededModuleId } from "@/lib/builder-url";

function CardButton({
  icon: Icon, title, description, onClick,
}: {
  icon: typeof PenLine;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

/** Dialog "Tạo module" — tái dùng kiểu CourseStartDialog. Mount 1 lần (content-studio-shell). */
export function ModuleStartDialog() {
  const navigate = useNavigate();
  const open = useModuleStart((s) => s.open);
  const module = useModuleStart((s) => s.module);
  const scope = useModuleStart((s) => s.scope);
  const newTab = useModuleStart((s) => s.newTab);
  const close = useModuleStart((s) => s.close);

  const isSb = module === "storyboard";
  const label = isSb ? "Storyboard" : "Giao diện (UI System)";
  const base = scope === "org" ? "/org" : "/creator";

  const go = (id: string) => {
    const segment = isSb ? "storyboard" : "ui-system";
    if (newTab) window.open(`${base}/builder/${segment}/${id}`, "_blank", "noopener");
    else navigate({ to: `${base}/builder/${segment}/$id`, params: { id } });
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>Tạo {label}</DialogTitle>
          <DialogDescription>Chọn cách bắt đầu</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 p-5">
          <CardButton
            icon={PenLine}
            title="Tiếp tục bản nháp mẫu"
            description={isSb ? "Mở một storyboard có sẵn vài khung cảnh mẫu" : "Mở một giao diện đã dựng sẵn để tinh chỉnh"}
            onClick={() => go(newSeededModuleId())}
          />
          <CardButton
            icon={FilePlus2}
            title="Tạo mới hoàn toàn"
            description="Bắt đầu với trang trắng"
            onClick={() => go(newModuleDraftId())}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

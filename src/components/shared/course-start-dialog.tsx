import { FilePlus2, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CourseStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onNewBlank: () => void;
}

interface CardButtonProps {
  icon: typeof PenLine;
  title: string;
  description: string;
  onClick: () => void;
  ariaLabel: string;
}

function CardButton({ icon: Icon, title, description, onClick, ariaLabel }: CardButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
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

export function CourseStartDialog({
  open,
  onOpenChange,
  onContinue,
  onNewBlank,
}: CourseStartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>Tạo khóa học</DialogTitle>
          <DialogDescription>Chọn cách bắt đầu</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 p-5">
          <CardButton
            icon={PenLine}
            title="Tiếp tục bài giảng đang dở"
            description="Mở bài đang soạn dở (nội dung mẫu)"
            ariaLabel="Tiếp tục bài giảng đang dở"
            onClick={() => {
              onContinue();
              onOpenChange(false);
            }}
          />
          <CardButton
            icon={FilePlus2}
            title="Tạo bài giảng mới hoàn toàn"
            description="Bắt đầu với trang trắng"
            ariaLabel="Tạo bài giảng mới hoàn toàn"
            onClick={() => {
              onNewBlank();
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

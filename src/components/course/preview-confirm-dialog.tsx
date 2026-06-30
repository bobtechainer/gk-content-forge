import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Popup xem trước + xác nhận dùng chung: hiện output (children) rồi mới áp dụng.
 * Dùng cho: đưa nội dung AI vào bài, đổi giao diện khoá học…
 */
export function PreviewConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "Xác nhận", onConfirm, children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[58vh] overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
          {children}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => { onConfirm(); onOpenChange(false); }}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { FilePlus2, FileText } from "lucide-react";

/**
 * Màn hỏi cách bắt đầu khi tạo module mới: tiếp tục từ một bản nháp mẫu (đã có sẵn
 * nội dung) hoặc tạo mới hoàn toàn (trang trắng). Dùng cho cả Storyboard & UI System.
 */
export function ModuleStartChoice({
  kind, onContinueDraft, onBlank,
}: {
  kind: "storyboard" | "ui";
  onContinueDraft: () => void;
  onBlank: () => void;
}) {
  const isSb = kind === "storyboard";
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <div className="w-full max-w-xl text-center">
        <h2 className="text-lg font-semibold text-foreground">Bạn muốn bắt đầu thế nào?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tiếp tục từ một bản nháp mẫu đã có sẵn nội dung, hoặc tạo mới hoàn toàn từ trang trắng.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={onContinueDraft} className="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-primary"><FileText className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-semibold text-foreground">Tiếp tục bản nháp mẫu</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{isSb ? "Mở một storyboard đã có sẵn vài khung cảnh để chỉnh tiếp." : "Mở một giao diện đã dựng sẵn để tinh chỉnh."}</p>
          </button>
          <button type="button" onClick={onBlank} className="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-primary"><FilePlus2 className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-semibold text-foreground">Tạo mới hoàn toàn</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{isSb ? "Bắt đầu từ trang trắng và tự dựng từng khung cảnh." : "Khai báo phong cách từ đầu rồi để AI dựng."}</p>
          </button>
        </div>
      </div>
    </div>
  );
}

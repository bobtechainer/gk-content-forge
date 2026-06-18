import { useRef, useState } from "react";
import { UploadCloud, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Media helpers ────────────────────────────────────────────────
 * The Course Builder persists state to localStorage (zustand persist),
 * so uploaded files are stored as base64 data URLs. We cap the size to
 * keep the persisted payload within the browser storage quota; for
 * larger media the user should paste a link instead.
 * ────────────────────────────────────────────────────────────────── */

const MAX_BYTES: Record<MediaKind, number> = {
  image: 2 * 1024 * 1024, // 2 MB
  video: 6 * 1024 * 1024, // 6 MB
};

export type MediaKind = "image" | "video";

export function isUploadedSrc(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("blob:");
}

/** Extract a YouTube video id from common URL shapes, else null. */
export function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/* ─── Video embed (shared by editor preview + read-only preview) ──── */

export function VideoEmbed({ src, className }: { src: string; className?: string }) {
  const base = cn("aspect-video w-full overflow-hidden rounded-lg", className);

  if (!src) {
    return (
      <div className={cn(base, "flex items-center justify-center bg-muted/30 text-sm text-muted-foreground")}>
        🎬 Video chưa có
      </div>
    );
  }

  const ytId = getYouTubeId(src);
  if (ytId) {
    return (
      <iframe
        title="YouTube video"
        src={`https://www.youtube.com/embed/${ytId}`}
        className={cn(base, "border-0")}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Uploaded file (data/blob URL) or a direct video URL (mp4, etc.)
  return <video src={src} controls className={cn(base, "bg-black")} />;
}

/* ─── Upload + link field (editor only) ───────────────────────────── */

interface MediaUploadFieldProps {
  kind: MediaKind;
  value: string;
  onChange: (value: string) => void;
  accent: string;
}

export function MediaUploadField({ kind, value, onChange, accent }: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const accept = kind === "image" ? "image/*" : "video/*";
  const uploaded = isUploadedSrc(value);

  const readFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith(`${kind}/`)) {
      toast.error(kind === "image" ? "Vui lòng chọn tệp hình ảnh" : "Vui lòng chọn tệp video");
      return;
    }
    if (file.size > MAX_BYTES[kind]) {
      const mb = Math.round(MAX_BYTES[kind] / (1024 * 1024));
      toast.error(`Tệp quá lớn (tối đa ${mb}MB). Với tệp lớn hơn hãy dán link.`);
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result ?? ""));
      setBusy(false);
      toast.success(`Đã tải lên: ${file.name}`);
    };
    reader.onerror = () => {
      setBusy(false);
      toast.error("Không đọc được tệp");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      {/* Drag & drop + click to choose file */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          readFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 text-center transition",
          dragOver ? "bg-muted/50" : "bg-muted/20 hover:bg-muted/40",
        )}
        style={{ borderColor: dragOver ? accent : undefined }}
      >
        <UploadCloud className="h-5 w-5" style={{ color: accent }} />
        <div className="text-[11px] font-medium text-foreground">
          {busy ? (
            "Đang tải…"
          ) : (
            <>
              Kéo &amp; thả {kind === "image" ? "ảnh" : "video"} hoặc{" "}
              <span style={{ color: accent }}>chọn tệp</span>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => readFile(e.target.files?.[0] ?? undefined)}
        />
      </div>

      {/* Or paste a link */}
      <div className="flex items-center gap-1.5">
        <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={uploaded ? "" : value}
          placeholder={
            kind === "image" ? "hoặc dán URL hình ảnh…" : "hoặc dán link YouTube / URL video…"
          }
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded-lg border bg-muted/30 px-2.5 py-1.5 text-xs outline-none focus:border-current"
          style={{ caretColor: accent }}
        />
        {value && (
          <button
            type="button"
            aria-label="Xóa media"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="shrink-0 rounded p-1 text-muted-foreground transition hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {uploaded && (
        <p className="text-[10px] text-muted-foreground">✓ Tệp đã tải lên (lưu trong trình duyệt)</p>
      )}
    </div>
  );
}

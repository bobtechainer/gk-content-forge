import type { CourseBlock } from "@/stores/course";
import type { PublishAnalysis } from "@/lib/ai/types";

/** Strip HTML tags and return plain text. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Flatten column children so nested blocks are counted too. */
function flattenBlocks(blocks: CourseBlock[]): CourseBlock[] {
  const result: CourseBlock[] = [];
  for (const b of blocks) {
    result.push(b);
    if (b.columnChildren) {
      for (const col of b.columnChildren) {
        result.push(...flattenBlocks(col));
      }
    }
  }
  return result;
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  text: "Văn bản",
  image: "Hình ảnh",
  video: "Video",
  callout: "Chú ý",
  divider: "Phân cách",
  embed: "Nhúng",
  code: "Mã nguồn",
  math: "Toán học",
  columns: "Cột đa dạng",
  quiz: "Câu hỏi",
  html: "HTML",
  section: "Phần học",
  accordion: "Thu gọn",
  process: "Quy trình",
  flashcards: "Thẻ ghi nhớ",
};

/**
 * Compute a deterministic quality rubric for a set of course blocks.
 *
 * Scoring breakdown (max 100):
 *  10 — has any content blocks at all
 *  15 — total plain-text length ≥ 200 chars
 *  10 — total plain-text length ≥ 600 chars
 *  10 — has ≥ 1 quiz or interactive block (quiz/flashcards/process/accordion)
 *  10 — has ≥ 2 quiz/interactive blocks
 *  10 — has a callout/tip block
 *  10 — has a section block (structural gating)
 *  10 — has a media block (image/video/embed)
 *  10 — has ≥ 5 distinct blocks
 *   5 — uses ≥ 3 different block types
 */
export function analyzeContent(
  blocks: CourseBlock[],
  meta?: { subject?: string; grade?: string },
): PublishAnalysis {
  const flat = flattenBlocks(blocks);

  // ── Signals ──────────────────────────────────────────────────
  const hasAnyBlocks = flat.length > 0;

  const totalText = flat
    .map((b) => stripHtml(b.content ?? ""))
    .join(" ")
    .trim();
  const textLen = totalText.length;

  const interactiveTypes = new Set(["quiz", "flashcards", "process", "accordion"]);
  const interactiveBlocks = flat.filter((b) => interactiveTypes.has(b.type));
  const hasQuiz = interactiveBlocks.length >= 1;
  const hasTwoQuiz = interactiveBlocks.length >= 2;

  const calloutTypes = new Set(["callout"]);
  const hasCallout = flat.some((b) => calloutTypes.has(b.type));

  const hasSection = flat.some((b) => b.type === "section");

  const mediaTypes = new Set(["image", "video", "embed"]);
  const hasMedia = flat.some((b) => mediaTypes.has(b.type));

  const hasFiveBlocks = flat.length >= 5;

  const distinctTypes = new Set(flat.map((b) => b.type));
  const hasThreeTypes = distinctTypes.size >= 3;

  // ── Score computation (deterministic) ────────────────────────
  let score = 0;
  if (hasAnyBlocks) score += 10;
  if (textLen >= 200) score += 15;
  if (textLen >= 600) score += 10;
  if (hasQuiz) score += 10;
  if (hasTwoQuiz) score += 10;
  if (hasCallout) score += 10;
  if (hasSection) score += 10;
  if (hasMedia) score += 10;
  if (hasFiveBlocks) score += 10;
  if (hasThreeTypes) score += 5;

  score = Math.min(100, Math.max(0, score));

  // ── Tags ─────────────────────────────────────────────────────
  const tags: string[] = [];
  if (meta?.subject) tags.push(meta.subject);
  if (meta?.grade) tags.push(meta.grade);
  for (const type of distinctTypes) {
    const label = BLOCK_TYPE_LABELS[type];
    if (label) tags.push(label);
  }

  // ── Description ──────────────────────────────────────────────
  const blockCountDesc = flat.length === 1 ? "1 khối" : `${flat.length} khối`;
  const typeList = [...distinctTypes]
    .map((t) => BLOCK_TYPE_LABELS[t] ?? t)
    .slice(0, 4)
    .join(", ");
  const description =
    flat.length === 0
      ? "Bài học chưa có nội dung."
      : `Bài học gồm ${blockCountDesc}: ${typeList}${distinctTypes.size > 4 ? " và hơn thế nữa" : ""}.`;

  // ── Notes (improvement hints) ────────────────────────────────
  const notes: string[] = [];
  if (!hasAnyBlocks) notes.push("Chưa có nội dung — hãy thêm khối đầu tiên.");
  if (textLen < 200) notes.push("Nội dung còn ngắn — hãy bổ sung thêm văn bản mô tả.");
  if (!hasQuiz) notes.push("Chưa có câu hỏi kiểm tra — hãy thêm khối câu hỏi hoặc thẻ ghi nhớ.");
  if (!hasCallout) notes.push("Chưa có chú ý/mẹo — hãy thêm khối callout để nhấn mạnh điểm quan trọng.");
  if (!hasSection) notes.push("Chưa có cấu trúc phần — hãy thêm khối phần học để chia nội dung.");
  if (!hasMedia) notes.push("Chưa có hình ảnh hay video — hãy thêm media để sinh động hơn.");

  return { score, tags, description, notes };
}

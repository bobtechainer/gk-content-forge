import type { CourseBlock, CourseBlockType } from "@/stores/course";
import type { LearningMaterialSubtype } from "@/lib/types";
import type { CourseTheme } from "@/lib/theme/resolve";

export interface StoryboardItem {
  id: string;
  blockType: CourseBlockType;
  intent: string;
  learningGoal: string;
  /** Tiêu đề cảnh hiển thị trên khung (storyboard dạng lưới khung cảnh). */
  title?: string;
  /** Khoá ảnh minh hoạ cảnh (xem scene-art.ts). Tự gán khi tạo. */
  image?: string;
}

export interface StoryboardSection {
  id: string;
  title: string;
  items: StoryboardItem[];
}

export interface Storyboard {
  sections: StoryboardSection[];
}

export interface StoryboardRequest {
  subject: string;
  grade: string;
  topic: string;
  objectives?: string;
  durationMin?: number;
  sourceText?: string;
}

export interface FillRequest {
  item: StoryboardItem;
  subject: string;
  grade: string;
  topic: string;
}

export interface CompanionRequest {
  text: string;
  action: "shorten" | "lengthen" | "tone-friendly" | "tone-formal" | "fix";
}

export interface QuizFromContentRequest {
  sourceText: string;
  count: number;
}

export interface PublishAnalysis {
  score: number;
  tags: string[];
  description: string;
  notes: string[];
}

/* ─── Chế độ chat của AI trợ lý trong lesson builder ───────────────── */

export type AiChatMode =
  | "content"
  | "course"
  | "full-lesson"
  | "quiz"
  | "material"
  | "rewrite";

/* ─── Tạo cả khoá học (đổ vào cây nội dung) ────────────────────────── */

export interface CourseGenRequest {
  prompt: string;
  subject?: string;
  grade?: string;
  /** Storyboard tham chiếu (tối đa 1) để bám cấu trúc khung cảnh. */
  storyboard?: Storyboard;
}

export interface OutlineLesson { title: string }
export interface OutlineChapter { title: string; lessons: OutlineLesson[] }
export interface OutlinePart { title: string; chapters: OutlineChapter[] }
export interface CourseOutline {
  title: string;
  parts: OutlinePart[];
}

/* ─── Tạo học liệu (9 loại trong kho) ──────────────────────────────── */

export interface GenerateMaterialRequest {
  kind: LearningMaterialSubtype;
  topic: string;
  subject?: string;
  grade?: string;
}

export interface GeneratedMaterial {
  kind: LearningMaterialSubtype;
  title: string;
  description: string;
  tags: string[];
  /** Vài dòng tóm tắt "đã tạo gì" để hiển thị như kết quả thật. */
  highlights: string[];
}

/* ─── Tạo UI System (giao diện khoá học) ───────────────────────────── */

export interface UiSystemRequest {
  description: string;
  subject?: string;
  grade?: string;
  /** Phong cách chọn nhanh: tươi sáng / trang trọng / tối giản / vui nhộn… */
  vibe?: string;
}

export interface UiSystemResult {
  name: string;
  theme: CourseTheme;
  rationale: string;
  /** Swatch hex để hiển thị (dữ liệu màu động, không phải class UI). */
  palette: string[];
}

/* ─── Câu trả lời hội thoại ngắn ───────────────────────────────────── */

export interface ChatReplyRequest {
  prompt: string;
  mode: AiChatMode;
  topic?: string;
}

export interface AiClient {
  generateStoryboard(req: StoryboardRequest): Promise<Storyboard>;
  fillBlock(req: FillRequest): Promise<Partial<CourseBlock>>;
  companionEdit(req: CompanionRequest): Promise<{ text: string }>;
  quizFromContent(
    req: QuizFromContentRequest,
  ): Promise<
    { content: string; quizOptions: string[]; quizCorrect: number; quizExplanation: string }[]
  >;
  generateMaterial(req: GenerateMaterialRequest): Promise<GeneratedMaterial>;
  generateUiSystem(req: UiSystemRequest): Promise<UiSystemResult>;
  generateCourseOutline(req: CourseGenRequest): Promise<CourseOutline>;
  chatReply(req: ChatReplyRequest): Promise<{ text: string }>;
}

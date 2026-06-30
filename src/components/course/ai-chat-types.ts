import type { AiChatMode, GeneratedMaterial, CourseOutline, Storyboard } from "@/lib/ai/types";
import type { StepStatus } from "@/lib/ai/stream";

export type Followup = { mode: AiChatMode; text: string };

/** Một tin nhắn trong cuộc trò chuyện với trợ lý AI (serializable để lưu lịch sử). */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  steps?: { label: string; status: StepStatus }[];
  insertContent?: string;
  inserted?: boolean;
  material?: GeneratedMaterial;
  materialSaved?: boolean;
  materialInserted?: boolean;
  /** Câu hỏi đã soạn — xem trước, chưa chèn. */
  quizItems?: { content: string; quizOptions: string[]; quizCorrect: number; quizExplanation: string }[];
  /** Dàn ý khoá học đã phác — xem trước, chưa dựng vào cây nội dung. */
  courseOutline?: CourseOutline;
  courseBuilt?: boolean;
  /** Nội dung bài đã phác (storyboard) — xem trước, chưa đưa vào bài. */
  lessonPlan?: { storyboard: Storyboard; topic: string };
  lessonFilled?: boolean;
  followups?: Followup[];
}

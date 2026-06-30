import type { AiChatMode, GeneratedMaterial } from "@/lib/ai/types";
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
  followups?: Followup[];
}

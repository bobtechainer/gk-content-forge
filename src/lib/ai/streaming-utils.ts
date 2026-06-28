/**
 * AI Streaming Simulation Utilities
 * Provides typewriter, thinking, and stagger effects for mock AI interactions.
 */

/** Sleep for a given duration (ms). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simulate AI "thinking" delay (1–2s random). */
export async function thinkingDelay(): Promise<void> {
  await sleep(1000 + Math.random() * 1000);
}

/** Short generation delay between blocks (300–800ms). */
export async function blockDelay(): Promise<void> {
  await sleep(300 + Math.random() * 500);
}

/**
 * Typewriter effect: stream text character by character.
 * @param text - Full text to stream
 * @param onChunk - Callback receiving accumulated text so far
 * @param charDelay - Base delay per character (ms), default 25
 * @param signal - Optional AbortSignal to cancel
 */
export async function streamText(
  text: string,
  onChunk: (accumulated: string) => void,
  charDelay = 25,
  signal?: AbortSignal,
): Promise<void> {
  let accumulated = "";
  for (const char of text) {
    if (signal?.aborted) return;
    accumulated += char;
    onChunk(accumulated);
    // Natural variance: 20-40ms per char
    await sleep(charDelay + Math.random() * 15);
  }
}

/**
 * Stream blocks one at a time with stagger animation.
 * @param items - Array of items to stagger
 * @param onItem - Callback per item
 * @param onProgress - Progress callback (done, total)
 * @param signal - Optional AbortSignal
 */
export async function staggerBlocks<T>(
  items: T[],
  onItem: (item: T, index: number) => Promise<void> | void,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    if (signal?.aborted) return;
    await thinkingDelay();
    await onItem(items[i], i);
    onProgress?.(i + 1, items.length);
    await blockDelay();
  }
}

/** AI actions available in the command bar. */
export interface AiAction {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const AI_ACTIONS: AiAction[] = [
  { id: "page", label: "Tạo trang về...", icon: "🌐", description: "Tạo full page nhiều blocks" },
  { id: "text", label: "Viết nội dung về...", icon: "✏️", description: "Tạo text block chi tiết" },
  { id: "image", label: "Tạo hình ảnh về...", icon: "🖼️", description: "Generate image" },
  { id: "video", label: "Tạo video về...", icon: "🎬", description: "Generate video" },
  { id: "audio", label: "Tạo audio về...", icon: "🎧", description: "Generate audio/podcast" },
  { id: "3d", label: "Tạo mô hình 3D về...", icon: "🧪", description: "Generate 3D/VR" },
  { id: "flashcards", label: "Tạo thẻ nhớ về...", icon: "🃏", description: "Flashcards block" },
  { id: "quiz", label: "Tạo câu hỏi về...", icon: "❓", description: "Quiz block" },
  { id: "outline", label: "Tạo dàn ý về...", icon: "📋", description: "Storyboard/outline" },
  { id: "process", label: "Tạo quy trình về...", icon: "🔄", description: "Process/steps block" },
  { id: "accordion", label: "Tạo accordion về...", icon: "📦", description: "Collapsible sections" },
  { id: "callout", label: "Tạo callout về...", icon: "💡", description: "Tips/highlights" },
  { id: "columns", label: "Tạo bố cục về...", icon: "📐", description: "Multi-column layout" },
  { id: "code", label: "Tạo code về...", icon: "💻", description: "Code snippet" },
  { id: "scorm", label: "Tạo SCORM về...", icon: "📊", description: "Interactive package" },
];

/** Chat message types for the AI chat panel. */
export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  /** Whether the message is still being streamed. */
  streaming?: boolean;
  /** Timestamp */
  timestamp: number;
  /** Attachments (file names, textbook refs, etc.) */
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  type: "file" | "text" | "textbook" | "url";
  label: string;
  /** For display icon */
  icon: string;
}

/** Generate a unique ID for messages. */
export function makeMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

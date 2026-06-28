/**
 * Mô phỏng "AI đang chạy" cho cảm giác hệ thống thật — KHÔNG gọi backend.
 * Dùng cho typewriter trong chat (việc nhỏ) và nhật ký bước (việc lớn, agentic).
 */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface StreamOptions {
  /** Số "từ" lộ ra mỗi nhịp. */
  wordsPerTick?: number;
  /** Độ trễ mỗi nhịp (ms). */
  delayMs?: number;
  signal?: AbortSignal;
}

/**
 * Lộ dần `full` theo từng cụm từ, gọi `onChunk` với phần đã lộ (luỹ kế).
 * Nếu người dùng tắt chuyển động thì trả nguyên văn ngay lập tức.
 */
export async function streamText(
  full: string,
  onChunk: (partial: string) => void,
  opts: StreamOptions = {},
): Promise<void> {
  if (prefersReducedMotion()) {
    onChunk(full);
    return;
  }
  const tokens = full.split(/(\s+)/); // giữ khoảng trắng để ghép lại đúng
  const step = Math.max(1, opts.wordsPerTick ?? 2);
  const delay = opts.delayMs ?? 26;
  let acc = "";
  for (let i = 0; i < tokens.length; i += step) {
    if (opts.signal?.aborted) {
      onChunk(full);
      return;
    }
    acc += tokens.slice(i, i + step).join("");
    onChunk(acc);
    await sleep(delay);
  }
  onChunk(full);
}

/* ─── Nhật ký bước (agentic) ─────────────────────────────────────── */

export type StepStatus = "pending" | "running" | "done";

export interface AgentStep {
  id: string;
  label: string;
}

export interface RunStepsOptions {
  /** Thời gian "nghĩ" mỗi bước (ms). */
  perStepMs?: number;
  /** Việc thật cần làm cho bước i (vd: đổ block). Chạy khi bước đang "running". */
  onWork?: (index: number) => Promise<void> | void;
  signal?: AbortSignal;
}

/**
 * Chạy lần lượt các bước, báo trạng thái qua `onUpdate`. Bọc việc thật trong
 * `onWork` để giao diện thấy block hiện dần đúng nhịp.
 */
export async function runSteps(
  steps: AgentStep[],
  onUpdate: (index: number, status: StepStatus) => void,
  opts: RunStepsOptions = {},
): Promise<void> {
  const reduced = prefersReducedMotion();
  const perStep = reduced ? 0 : opts.perStepMs ?? 380;
  for (let i = 0; i < steps.length; i++) {
    if (opts.signal?.aborted) return;
    onUpdate(i, "running");
    await opts.onWork?.(i);
    if (perStep > 0) await sleep(perStep);
    onUpdate(i, "done");
  }
}

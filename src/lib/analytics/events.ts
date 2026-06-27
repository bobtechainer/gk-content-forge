/** Kiểu sự kiện học tập được thu thập cục bộ */
export type LearnEventType = "lesson_open" | "quiz_answer" | "lesson_complete";

export interface LearnEvent {
  type: LearnEventType;
  courseId: string;
  at: number;
  correct?: boolean;
}

/**
 * Tính số lượt mở bài học (lesson_open) theo từng ngày trong N ngày gần nhất.
 *
 * @param events - Danh sách sự kiện học tập
 * @param now    - Mốc thời gian hiện tại (ms). Truyền vào để hàm thuần (deterministic trong test).
 * @param days   - Số ngày cần tổng hợp (tính ngược từ `now`)
 * @returns Mảng `{ date: "YYYY-MM-DD", opens: number }` sắp xếp từ cũ đến mới
 */
export function opensPerDay(
  events: LearnEvent[],
  now: number,
  days: number,
): { date: string; opens: number }[] {
  // Tạo map ngày -> số lượt mở, khởi tạo tất cả ngày về 0
  const buckets = new Map<string, number>();

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  // Ngày "hôm nay" tính theo UTC để nhất quán
  const todayStart = now - (now % MS_PER_DAY);

  for (let i = days - 1; i >= 0; i--) {
    const dayMs = todayStart - i * MS_PER_DAY;
    const dateStr = new Date(dayMs).toISOString().slice(0, 10);
    buckets.set(dateStr, 0);
  }

  // Đếm lesson_open rơi vào từng ngày
  const windowStart = todayStart - (days - 1) * MS_PER_DAY;
  for (const ev of events) {
    if (ev.type !== "lesson_open") continue;
    if (ev.at < windowStart || ev.at > now) continue;
    const dayMs = ev.at - (ev.at % MS_PER_DAY);
    const dateStr = new Date(dayMs).toISOString().slice(0, 10);
    if (buckets.has(dateStr)) {
      buckets.set(dateStr, (buckets.get(dateStr) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, opens]) => ({ date, opens }));
}

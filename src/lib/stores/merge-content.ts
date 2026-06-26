import type { ContentItem } from "@/lib/types";

/**
 * Gộp content khi nạp lại / bump version:
 * - Giữ mọi item người dùng (id KHÔNG nằm trong seed) theo đúng thứ tự đã lưu.
 * - Thay thế các item seed bằng phiên bản seed MỚI (chống stale-seed dev≠build).
 * Không bao giờ làm mất nội dung người dùng.
 */
export function mergeContentItems(
  persisted: ContentItem[],
  seed: ContentItem[],
): ContentItem[] {
  const seedIds = new Set(seed.map((i) => i.id));
  const userItems = persisted.filter((i) => !seedIds.has(i.id));
  return [...userItems, ...seed];
}

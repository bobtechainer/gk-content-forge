// src/lib/quality-label.ts
import type { QualityLabel } from "./types";

export type QualityTone = "neutral" | "info" | "warning" | "success" | "brand" | "destructive";

interface QualityMeta {
  label: string;
  description: string;
  tone: QualityTone;
}

export const QUALITY_LABELS: Record<QualityLabel, QualityMeta> = {
  submitted: { label: "Mới nộp", description: "Vừa gửi, chờ kiểm tra hồ sơ.", tone: "neutral" },
  documented: { label: "Đủ hồ sơ", description: "Hồ sơ hợp lệ, vào hàng đợi thẩm định.", tone: "info" },
  reviewed: { label: "Đã thẩm định", description: "Hội đồng đã thẩm định đạt.", tone: "success" },
  ministry_standard: { label: "Chuẩn Bộ", description: "Đạt chuẩn Bộ GD&ĐT.", tone: "brand" },
  needs_revision: { label: "Cần chỉnh sửa", description: "Hội đồng yêu cầu chỉnh sửa.", tone: "warning" },
  rejected: { label: "Từ chối", description: "Không đạt yêu cầu thẩm định.", tone: "destructive" },
  trusted_partner: { label: "Đối tác tin cậy", description: "Học liệu đối tác đã ký số.", tone: "brand" },
};

export const QUALITY_PROGRESSION: QualityLabel[] = [
  "submitted",
  "documented",
  "reviewed",
  "ministry_standard",
];

export const nextQualityLabel = (current: QualityLabel): QualityLabel | null => {
  const i = QUALITY_PROGRESSION.indexOf(current);
  if (i === -1 || i === QUALITY_PROGRESSION.length - 1) return null;
  return QUALITY_PROGRESSION[i + 1];
};

// src/lib/quality-label.test.ts
import { describe, expect, test } from "vitest";
import {
  QUALITY_LABELS,
  QUALITY_PROGRESSION,
  nextQualityLabel,
} from "./quality-label";

describe("quality-label", () => {
  test("đủ 7 nhãn với nhãn tiếng Việt", () => {
    expect(QUALITY_LABELS.submitted.label).toBe("Mới nộp");
    expect(QUALITY_LABELS.ministry_standard.label).toBe("Chuẩn Bộ");
    expect(QUALITY_LABELS.trusted_partner.label).toBe("Đối tác tin cậy");
    expect(Object.keys(QUALITY_LABELS)).toHaveLength(7);
  });

  test("luồng tiến 4 mức theo đúng thứ tự", () => {
    expect(QUALITY_PROGRESSION).toEqual([
      "submitted",
      "documented",
      "reviewed",
      "ministry_standard",
    ]);
  });

  test("nextQualityLabel trả nhãn kế tiếp, null ở cuối", () => {
    expect(nextQualityLabel("submitted")).toBe("documented");
    expect(nextQualityLabel("reviewed")).toBe("ministry_standard");
    expect(nextQualityLabel("ministry_standard")).toBeNull();
    // nhãn ngoài luồng tiến không có "kế tiếp"
    expect(nextQualityLabel("rejected")).toBeNull();
  });
});

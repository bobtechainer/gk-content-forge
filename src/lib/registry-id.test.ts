// src/lib/registry-id.test.ts
import { describe, expect, test } from "vitest";
import {
  TIER_CODE,
  subjectCode,
  generateRegistryId,
  parseRegistryId,
} from "./registry-id";

describe("registry-id", () => {
  test("mã tầng theo đúng quy ước GOC/DT/CD", () => {
    expect(TIER_CODE.root).toBe("GOC");
    expect(TIER_CODE.partner).toBe("DT");
    expect(TIER_CODE.community).toBe("CD");
  });

  test("subjectCode ánh xạ môn tiếng Việt sang mã, fallback an toàn", () => {
    expect(subjectCode("Toán")).toBe("TOAN");
    expect(subjectCode("Ngữ văn")).toBe("VAN");
    expect(subjectCode("Tiếng Anh")).toBe("ANH");
    expect(subjectCode("Môn lạ")).toBe("KHAC");
  });

  test("generateRegistryId tạo mã đúng định dạng có mã tầng", () => {
    expect(generateRegistryId("partner", "Toán", 123, 2026)).toBe(
      "THS-DT-2026-TOAN-000123",
    );
    expect(generateRegistryId("root", "Ngữ văn", 7, 2025)).toBe(
      "THS-GOC-2025-VAN-000007",
    );
  });

  test("parseRegistryId tách lại các thành phần", () => {
    expect(parseRegistryId("THS-DT-2026-TOAN-000123")).toEqual({
      tier: "partner",
      year: 2026,
      subjectCode: "TOAN",
      seq: 123,
    });
    expect(parseRegistryId("không-hợp-lệ")).toBeNull();
  });
});

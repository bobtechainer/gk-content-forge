import { describe, expect, test } from "vitest";
import { ROLE_CAPABILITIES, ORG_ROLE_LABELS, ALL_CAPABILITIES } from "./capabilities";

describe("org capabilities", () => {
  test("owner có toàn bộ năng lực", () => {
    expect([...ROLE_CAPABILITIES.owner].sort()).toEqual([...ALL_CAPABILITIES].sort());
  });
  test("viewer chỉ xem", () => {
    expect(ROLE_CAPABILITIES.viewer).toEqual(["content.view"]);
  });
  test("publisher (phát hành/ký số) hẹp: xem + gửi duyệt + ký số", () => {
    expect([...ROLE_CAPABILITIES.publisher].sort()).toEqual(
      ["content.publish_sign", "content.submit", "content.view"].sort(),
    );
  });
  test("chỉ owner có org.transfer", () => {
    const withTransfer = Object.entries(ROLE_CAPABILITIES)
      .filter(([, caps]) => caps.includes("org.transfer")).map(([r]) => r);
    expect(withTransfer).toEqual(["owner"]);
  });
  test("manager quản nội dung nhưng không quản thành viên", () => {
    expect(ROLE_CAPABILITIES.manager).toContain("content.edit_any");
    expect(ROLE_CAPABILITIES.manager).not.toContain("members.manage");
  });
  test("đủ 6 vai trò có nhãn tiếng Việt", () => {
    expect(Object.keys(ORG_ROLE_LABELS)).toHaveLength(6);
    expect(ORG_ROLE_LABELS.editor).toBe("Biên tập/CTV");
  });
});

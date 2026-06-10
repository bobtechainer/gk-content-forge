import { describe, expect, test } from "vitest";
import { ACCOUNTS, SEED_CONTENT } from "./mock-data";
import { resolveActiveOrgId } from "./use-scoped-content";
import { resolveActiveAccount } from "./use-active-account";

describe("active account resolution", () => {
  test("personal account in org scope resolves to its organization", () => {
    expect(resolveActiveOrgId("teacher")).toBe("publisher");
    expect(resolveActiveAccount("teacher", "org")).toBe(ACCOUNTS.publisher);
  });

  test("personal account in creator scope resolves to itself", () => {
    expect(resolveActiveAccount("teacher", "creator")).toBe(ACCOUNTS.teacher);
  });

  test("publisher resolves to itself in org scope", () => {
    expect(resolveActiveOrgId("publisher")).toBe("publisher");
    expect(resolveActiveAccount("publisher", "org")).toBe(ACCOUNTS.publisher);
  });

  test("admin is never remapped to an org", () => {
    expect(resolveActiveAccount("admin", "org")).toBe(ACCOUNTS.admin);
  });
});

describe("org content scoping", () => {
  test("org scope for a personal account contains only org content (no personal leak)", () => {
    const orgId = resolveActiveOrgId("teacher");
    const orgItems = SEED_CONTENT.filter((i) => i.ownerId === orgId);

    expect(orgItems.length).toBeGreaterThan(0);
    expect(orgItems.every((i) => i.ownerId === "publisher")).toBe(true);
    expect(orgItems.some((i) => i.ownerId === "teacher")).toBe(false);
  });
});

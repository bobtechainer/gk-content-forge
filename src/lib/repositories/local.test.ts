// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { localContentRepository } from "./local";
import { useContent } from "@/stores/content";

describe("localContentRepository", () => {
  beforeEach(() => localStorage.clear());

  it("findAll() returns the store's items", () => {
    const items = localContentRepository.findAll();
    expect(Array.isArray(items)).toBe(true);
    expect(items).toBe(useContent.getState().items);
  });
});

import { describe, expect, it } from "vitest";
import { viewportMaxWidth } from "./viewport";

describe("viewportMaxWidth", () => {
  it("maps each viewport to a max-width class", () => {
    expect(viewportMaxWidth("desktop")).toBe("max-w-none");
    expect(viewportMaxWidth("tablet")).toBe("max-w-[768px]");
    expect(viewportMaxWidth("mobile")).toBe("max-w-[390px]");
  });
});

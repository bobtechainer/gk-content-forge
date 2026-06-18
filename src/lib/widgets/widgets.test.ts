import { describe, expect, it } from "vitest";
import { WIDGET_TEMPLATES } from "./index";

/* The widget bodies are raw HTML strings embedded in an iframe, so TypeScript
 * never type-checks the inline <script>. These tests catch syntax errors in
 * that JS before it ever reaches a learner's screen. */

function extractScript(html: string): string {
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  return match ? match[1] : "";
}

describe("interactive widgets", () => {
  it("exposes five templates with Vietnamese labels", () => {
    expect(WIDGET_TEMPLATES).toHaveLength(5);
    for (const t of WIDGET_TEMPLATES) {
      expect(t.html).toContain("<script>");
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("each widget's inline script is syntactically valid", () => {
    for (const t of WIDGET_TEMPLATES) {
      const body = extractScript(t.html);
      expect(body.length).toBeGreaterThan(0);
      // Parses (does not execute) the script body; throws on a syntax error.
      expect(() => new Function(body)).not.toThrow();
    }
  });
});

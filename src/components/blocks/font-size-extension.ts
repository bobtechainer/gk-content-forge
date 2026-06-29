import { Mark, mergeAttributes } from "@tiptap/core";

/**
 * Mark cỡ chữ tối giản — bọc đoạn bôi đen trong <span style="font-size:…">.
 * Dùng cho AI inline (BubbleToolbar). Không cần TextStyle.
 *
 * Áp: editor.chain().focus().setMark("fontSize", { size: "20px" }).run()
 * Gỡ: editor.chain().focus().unsetMark("fontSize").run()
 */
export const FontSize = Mark.create({
  name: "fontSize",

  addOptions() {
    return { HTMLAttributes: {} as Record<string, unknown> };
  },

  addAttributes() {
    return {
      size: {
        default: null as string | null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: { size?: string | null }) =>
          attrs.size ? { style: `font-size:${attrs.size}` } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span", getAttrs: (el) => ((el as HTMLElement).style.fontSize ? {} : false) }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});

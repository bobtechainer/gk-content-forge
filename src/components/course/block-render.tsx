import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

/* ─── Math (KaTeX) ─────────────────────────────────────────────────
 * Renders LaTeX with KaTeX in display mode. Invalid input is shown as a
 * friendly error instead of throwing (throwOnError: false).
 * ────────────────────────────────────────────────────────────────── */

export function MathPreview({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => {
    if (!content.trim()) return "";
    try {
      return katex.renderToString(content, { throwOnError: false, displayMode: true });
    } catch {
      return "";
    }
  }, [content]);

  if (!content.trim()) {
    return (
      <div className={cn("rounded-lg border bg-white p-3 text-center text-sm text-muted-foreground", className)}>
        Chưa có công thức
      </div>
    );
  }

  return (
    <div
      className={cn("overflow-x-auto rounded-lg border bg-white p-3 text-center text-[#0891B2]", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ─── Code syntax highlighting (dependency-free) ───────────────────
 * A small generic tokenizer covering comments, strings, numbers, keywords
 * and booleans across the supported languages (js/ts/python/html/css/json).
 * Good enough for lesson code snippets without pulling in a heavy lib.
 * ────────────────────────────────────────────────────────────────── */

const TOKEN_COLORS = {
  comment: "#6b7280",
  string: "#7ee787",
  number: "#f0883e",
  keyword: "#79c0ff",
  boolean: "#d2a8ff",
};

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "elif", "for", "while", "do",
  "switch", "case", "break", "continue", "class", "new", "import", "export", "from", "default",
  "async", "await", "try", "catch", "finally", "throw", "typeof", "instanceof", "of", "in", "is",
  "def", "lambda", "with", "as", "pass", "yield", "interface", "type", "enum", "implements",
  "extends", "public", "private", "protected", "readonly", "static", "and", "or", "not", "self",
  "this", "super", "void", "print",
]);

const BOOLEANS = new Set(["true", "false", "null", "undefined", "None", "True", "False", "NaN"]);

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const TOKEN_RE =
  /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

function highlightCode(code: string): string {
  let out = "";
  let last = 0;
  for (const match of code.matchAll(TOKEN_RE)) {
    const m = match[0];
    const offset = match.index ?? 0;
    out += escapeHtml(code.slice(last, offset));
    last = offset + m.length;
    const [, comment, str, num, ident] = match;
    if (comment) out += `<span style="color:${TOKEN_COLORS.comment};font-style:italic">${escapeHtml(m)}</span>`;
    else if (str) out += `<span style="color:${TOKEN_COLORS.string}">${escapeHtml(m)}</span>`;
    else if (num) out += `<span style="color:${TOKEN_COLORS.number}">${escapeHtml(m)}</span>`;
    else if (ident && BOOLEANS.has(ident)) out += `<span style="color:${TOKEN_COLORS.boolean}">${escapeHtml(m)}</span>`;
    else if (ident && KEYWORDS.has(ident)) out += `<span style="color:${TOKEN_COLORS.keyword}">${escapeHtml(m)}</span>`;
    else out += escapeHtml(m);
  }
  out += escapeHtml(code.slice(last));
  return out;
}

export function CodeHighlight({ code, language, className }: { code: string; language?: string; className?: string }) {
  const html = useMemo(() => highlightCode(code || ""), [code]);
  return (
    <div className={cn("overflow-hidden rounded-lg bg-[#1e1e2e]", className)}>
      {language && (
        <div className="border-b border-white/5 px-3 py-1 text-[9px] uppercase tracking-wide text-white/30">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-[#e6edf3]">
        <code dangerouslySetInnerHTML={{ __html: html || '<span style="color:#6b7280">// ...</span>' }} />
      </pre>
    </div>
  );
}

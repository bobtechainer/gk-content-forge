import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ─── Sandboxed, auto-height HTML embed ─────────────────────────────
 * Renders arbitrary teacher-authored HTML inside an isolated iframe
 * (sandbox="allow-scripts" → null origin, no access to the host page). The
 * injected reporter posts the content height up so the iframe grows to fit
 * its content instead of showing inner scrollbars.
 * ────────────────────────────────────────────────────────────────── */

const HEIGHT_MESSAGE = "gk-embed-height";

const RESET_AND_REPORTER = `
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:transparent}
</style>
<script>
  (function(){
    function report(){
      var h = Math.ceil(Math.max(
        document.body ? document.body.scrollHeight : 0,
        document.documentElement ? document.documentElement.scrollHeight : 0
      ));
      parent.postMessage({ type: "${HEIGHT_MESSAGE}", height: h }, "*");
    }
    if (typeof ResizeObserver !== "undefined" && document.body) {
      new ResizeObserver(report).observe(document.body);
    }
    window.addEventListener("load", report);
    window.addEventListener("resize", report);
    setTimeout(report, 60);
    setTimeout(report, 400);
  })();
</script>`;

function buildSrcDoc(html: string): string {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${RESET_AND_REPORTER}</head><body>${html}</body></html>`;
}

interface HtmlEmbedProps {
  html: string;
  className?: string;
  /** Height (px) used before the first height report arrives. */
  minHeight?: number;
}

export function HtmlEmbed({ html, className, minHeight = 320 }: HtmlEmbedProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!ref.current || e.source !== ref.current.contentWindow) return;
      const data = e.data as { type?: string; height?: number } | null;
      if (data && data.type === HEIGHT_MESSAGE && typeof data.height === "number") {
        setHeight(Math.max(minHeight, data.height));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [minHeight]);

  const srcDoc = useMemo(() => buildSrcDoc(html), [html]);

  return (
    <iframe
      ref={ref}
      title="Khối tương tác"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      scrolling="no"
      className={cn("w-full overflow-hidden rounded-2xl border border-border bg-white", className)}
      style={{ height }}
    />
  );
}

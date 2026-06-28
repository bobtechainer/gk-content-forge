import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles, Send, ChevronDown, Wand2, PenLine, ListChecks, Layers, Boxes,
  Check, Loader2, ArrowUpRight, LayoutList, Palette, Library, CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiClient } from "@/lib/ai";
import { streamText, runSteps, sleep, type StepStatus } from "@/lib/ai/stream";
import type { AiChatMode, GeneratedMaterial } from "@/lib/ai/types";
import { useCourse, type CourseBlock, type CourseBlockType } from "@/stores/course";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";
import { useStoryboard } from "@/stores/storyboard";
import type { LearningMaterialSubtype } from "@/lib/types";
import {
  LEARNING_MATERIAL_TYPES, MATERIAL_TYPE_LABELS, MATERIAL_TYPE_ICONS,
} from "@/lib/taxonomy";
import {
  storyboardRoutePattern, uiSystemRoutePattern, type BuilderScope,
} from "@/lib/builder-url";
import { cn } from "@/lib/utils";

/* ─── Modes ─────────────────────────────────────────────────────── */

interface ModeDef {
  id: AiChatMode;
  label: string;
  icon: typeof PenLine;
  /** Việc lớn = agentic đổ thẳng lên canvas; việc nhỏ = trả lời rồi chèn. */
  agentic: boolean;
  placeholder: string;
}

const MODES: ModeDef[] = [
  { id: "content", label: "Tạo nội dung", icon: PenLine, agentic: false, placeholder: "…đoạn mở đầu về chủ đề này" },
  { id: "full-lesson", label: "Tạo cả bài", icon: Wand2, agentic: true, placeholder: "…chủ đề cho cả bài học" },
  { id: "quiz", label: "Tạo câu hỏi", icon: ListChecks, agentic: true, placeholder: "…chủ đề câu hỏi ôn tập" },
  { id: "flashcards", label: "Tạo thẻ ghi nhớ", icon: Layers, agentic: false, placeholder: "…thuật ngữ cần ôn tập" },
  { id: "material", label: "Tạo học liệu", icon: Boxes, agentic: false, placeholder: "…chủ đề học liệu" },
  { id: "rewrite", label: "Soạn lại", icon: Sparkles, agentic: false, placeholder: "…dán đoạn cần soạn lại" },
];

const BLOCK_LABELS: Partial<Record<CourseBlockType, string>> = {
  text: "Văn bản", image: "Hình ảnh", video: "Video", callout: "Callout", quiz: "Câu hỏi",
  section: "Phần", flashcards: "Thẻ ghi nhớ", accordion: "Accordion", process: "Quy trình",
  code: "Code", math: "Công thức", columns: "Cột", embed: "Học liệu", html: "Tương tác", divider: "Phân cách",
};

/* ─── Message model ─────────────────────────────────────────────── */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  steps?: { label: string; status: StepStatus }[];
  insertContent?: string;
  inserted?: boolean;
  material?: GeneratedMaterial;
  materialSaved?: boolean;
}

let msgSeq = 0;
const newId = () => `m_${Date.now()}_${msgSeq++}`;

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/* ─── Props ─────────────────────────────────────────────────────── */

interface AiAssistantPanelProps {
  courseId: string;
  lessonId?: string;
  scope: BuilderScope;
}

/* ─── Component ─────────────────────────────────────────────────── */

export function AiAssistantPanel({ courseId, lessonId, scope }: AiAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AiChatMode>("content");
  const [busy, setBusy] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const contentItem = useContent((s) => s.items.find((x) => x.id === courseId));
  const roleId = useSession((s) => s.roleId);
  const subject = contentItem?.subject ?? "";
  const grade = contentItem?.grade ?? "";

  const modeDef = MODES.find((m) => m.id === mode)!;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((cur) => cur.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const patchStep = useCallback((id: string, index: number, status: StepStatus) => {
    setMessages((cur) =>
      cur.map((m) =>
        m.id === id && m.steps
          ? { ...m, steps: m.steps.map((s, i) => (i === index ? { ...s, status } : s)) }
          : m,
      ),
    );
  }, []);

  /* ─── Block helpers (đổ thẳng lên canvas) ─────────────────────── */

  const insertBlock = useCallback(
    (type: CourseBlockType, patch: Partial<CourseBlock>) => {
      if (!lessonId) return;
      const bid = useCourse.getState().addBlock(courseId, lessonId, type);
      if (bid) useCourse.getState().updateBlock(courseId, lessonId, bid, { ...patch, aiGenerated: true });
    },
    [courseId, lessonId],
  );

  const lessonSourceText = useCallback(() => {
    const data = useCourse.getState().courseData[courseId];
    const lesson = data?.lessons.find((l) => l.id === lessonId);
    const text = (lesson?.blocks ?? [])
      .map((b) => stripHtml(b.content ?? ""))
      .filter(Boolean)
      .join(" ");
    return text;
  }, [courseId, lessonId]);

  /* ─── Run a mode ──────────────────────────────────────────────── */

  const runMode = useCallback(
    async (activeMode: AiChatMode, rawPrompt: string, materialKind?: LearningMaterialSubtype) => {
      if (busy) return;
      const topic = rawPrompt.trim() || contentItem?.subject || "chủ đề bài học";
      setBusy(true);

      // 1. user bubble
      const userText =
        activeMode === "material" && materialKind
          ? `Tạo ${MATERIAL_TYPE_LABELS[materialKind].toLowerCase()}: ${topic}`
          : rawPrompt.trim() || MODES.find((m) => m.id === activeMode)!.label;
      setMessages((cur) => [...cur, { id: newId(), role: "user", text: userText }]);

      // 2. assistant bubble
      const aid = newId();
      setMessages((cur) => [...cur, { id: aid, role: "assistant", text: "", streaming: true }]);

      try {
        const reply = await aiClient.chatReply({ prompt: topic, mode: activeMode, topic });
        await streamText(reply.text, (partial) => patchMessage(aid, { text: partial }));
        patchMessage(aid, { streaming: false });

        if (!lessonId && activeMode !== "material") {
          patchMessage(aid, { text: `${reply.text}\n\nHãy chọn một bài học bên trái để mình soạn vào đó nhé.` });
          return;
        }

        switch (activeMode) {
          case "content": {
            const patch = await aiClient.fillBlock({
              item: { id: aid, blockType: "text", intent: topic, learningGoal: topic },
              subject, grade, topic,
            });
            const html = (patch.content as string) ?? "";
            patchMessage(aid, { insertContent: html });
            break;
          }

          case "rewrite": {
            const res = await aiClient.companionEdit({ text: rawPrompt.trim() || topic, action: "fix" });
            patchMessage(aid, { insertContent: `<p>${res.text}</p>` });
            break;
          }

          case "flashcards": {
            const patch = await aiClient.fillBlock({
              item: { id: aid, blockType: "flashcards", intent: topic, learningGoal: topic },
              subject, grade, topic,
            });
            insertBlock("flashcards", patch);
            patchMessage(aid, { text: `${reply.text} Đã thêm bộ thẻ vào bài. Bạn xem trên canvas nhé.` });
            break;
          }

          case "quiz": {
            const source = lessonSourceText() || topic;
            const items = await aiClient.quizFromContent({ sourceText: source, count: 3 });
            const steps = items.map((_, i) => ({ label: `Câu hỏi ${i + 1}`, status: "pending" as StepStatus }));
            patchMessage(aid, { steps });
            await runSteps(
              steps.map((_, i) => ({ id: String(i), label: steps[i].label })),
              (i, st) => patchStep(aid, i, st),
              {
                perStepMs: 280,
                onWork: (i) => {
                  const it = items[i];
                  insertBlock("quiz", {
                    content: it.content,
                    quizOptions: it.quizOptions,
                    quizCorrect: it.quizCorrect,
                    quizExplanation: it.quizExplanation,
                  });
                },
              },
            );
            patchMessage(aid, { text: `${reply.text} Đã thêm ${items.length} câu hỏi vào bài.` });
            break;
          }

          case "full-lesson": {
            let sb = useStoryboard.getState().byLesson[lessonId!];
            if (!sb) {
              sb = await aiClient.generateStoryboard({ subject, grade, topic });
              useStoryboard.getState().setStoryboard(lessonId!, sb);
            }
            const items = sb.sections.flatMap((s) => s.items);
            const steps = items.map((it) => ({
              label: BLOCK_LABELS[it.blockType] ?? it.blockType,
              status: "pending" as StepStatus,
            }));
            patchMessage(aid, { steps });
            await runSteps(
              steps.map((_, i) => ({ id: String(i), label: steps[i].label })),
              (i, st) => patchStep(aid, i, st),
              {
                perStepMs: 320,
                onWork: async (i) => {
                  const it = items[i];
                  const patch = await aiClient.fillBlock({ item: it, subject, grade, topic });
                  insertBlock(it.blockType, patch);
                },
              },
            );
            patchMessage(aid, { text: `${reply.text.split(":")[0]}. Đã dựng xong ${items.length} khối cho bài học.` });
            break;
          }

          case "material": {
            const kind = materialKind ?? "lesson";
            await sleep(280);
            const mat = await aiClient.generateMaterial({ kind, topic, subject, grade });
            patchMessage(aid, { material: mat, text: `Mình đã tạo ${MATERIAL_TYPE_LABELS[kind].toLowerCase()} "${mat.title}". Bạn lưu vào kho để dùng lại nhé.` });
            break;
          }
        }
      } catch {
        patchMessage(aid, { streaming: false, text: "Có lỗi nhỏ khi xử lý. Bạn thử lại giúp mình nhé." });
      } finally {
        setBusy(false);
      }
    },
    [busy, contentItem, lessonId, subject, grade, patchMessage, patchStep, insertBlock, lessonSourceText],
  );

  /* ─── Insert streamed content as a text block ─────────────────── */

  const handleInsert = useCallback(
    (id: string, html: string) => {
      insertBlock("text", { content: html });
      patchMessage(id, { inserted: true });
    },
    [insertBlock, patchMessage],
  );

  /* ─── Save generated material into the kho ────────────────────── */

  const handleSaveMaterial = useCallback(
    (id: string, mat: GeneratedMaterial) => {
      if (!roleId) return;
      const draftId = useContent.getState().createDraft("learning_material", roleId, {
        category: "learning_material",
        materialSubtype: mat.kind,
      });
      useContent.getState().updateItem(draftId, {
        title: mat.title,
        subject: subject || "Chung",
        grade: grade || "",
        tags: mat.tags,
        description: mat.description,
      });
      patchMessage(id, { materialSaved: true });
    },
    [roleId, subject, grade, patchMessage],
  );

  /* ─── Send ────────────────────────────────────────────────────── */

  const handleSend = () => {
    if (busy) return;
    if (mode === "material") {
      // material cần chọn loại — không gửi trực tiếp, người dùng bấm chip loại.
      return;
    }
    if (!input.trim() && mode !== "full-lesson") return;
    const prompt = input;
    setInput("");
    void runMode(mode, prompt);
  };

  const suggestions = [
    { mode: "full-lesson" as AiChatMode, text: `Dựng cả bài về ${subject || "chủ đề này"}` },
    { mode: "content" as AiChatMode, text: "Viết đoạn mở đầu cuốn hút" },
    { mode: "quiz" as AiChatMode, text: "Tạo 3 câu hỏi ôn tập" },
    { mode: "flashcards" as AiChatMode, text: "Tạo bộ thẻ ghi nhớ thuật ngữ" },
  ];

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Trợ lý AI soạn bài</p>
          <p className="truncate text-[11px] text-muted-foreground">Hỏi bất kỳ điều gì, mình soạn thẳng vào bài</p>
        </div>
      </div>

      {/* Page links */}
      <div className="grid grid-cols-2 gap-2 border-b border-border p-2.5">
        <Button asChild variant="outline" size="sm" className="h-auto justify-start gap-2 px-2.5 py-2 text-xs">
          <Link to={storyboardRoutePattern(scope)} params={{ id: courseId }}>
            <LayoutList className="h-4 w-4 text-primary" />
            <span className="flex-1 text-left leading-tight">Dàn ý<br /><span className="text-[10px] text-muted-foreground">Storyboard</span></span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-auto justify-start gap-2 px-2.5 py-2 text-xs">
          <Link to={uiSystemRoutePattern(scope)} params={{ id: courseId }}>
            <Palette className="h-4 w-4 text-primary" />
            <span className="flex-1 text-left leading-tight">Giao diện<br /><span className="text-[10px] text-muted-foreground">UI System</span></span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </Button>
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center px-2 py-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">Bắt đầu với một gợi ý</p>
            <p className="mt-1 text-xs text-muted-foreground">Chọn chế độ ở dưới hoặc thử nhanh:</p>
            <div className="mt-3 w-full space-y-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  disabled={busy}
                  onClick={() => { setMode(s.mode); void runMode(s.mode, s.text); }}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-foreground transition hover:border-primary hover:bg-accent disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} onInsert={handleInsert} onSaveMaterial={handleSaveMaterial} scope={scope} />)
        )}
      </div>

      {/* Material kind chooser (only in material mode) */}
      {mode === "material" && (
        <div className="border-t border-border px-2.5 pt-2.5">
          <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Chọn loại học liệu để tạo</p>
          <div className="flex flex-wrap gap-1.5 pb-1">
            {LEARNING_MATERIAL_TYPES.map((kind) => {
              const Icon = MATERIAL_TYPE_ICONS[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  disabled={busy}
                  onClick={() => void runMode("material", input, kind)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-primary hover:bg-accent disabled:opacity-50"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {MATERIAL_TYPE_LABELS[kind]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Command bar */}
      <div className="border-t border-border p-2.5">
        <div className="flex items-end gap-1.5 rounded-xl border border-border bg-background p-1.5 focus-within:border-primary">
          {/* Mode dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setModeOpen((v) => !v)}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-2 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-accent"
            >
              <modeDef.icon className="h-3.5 w-3.5" />
              <span className="max-w-[88px] truncate">{modeDef.label}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {modeOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setModeOpen(false)} />
                <div className="absolute bottom-full left-0 z-50 mb-1.5 w-[210px] rounded-xl border border-border bg-card p-1.5 shadow-xl">
                  {MODES.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setMode(m.id); setModeOpen(false); }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition",
                          mode === m.id ? "bg-accent text-primary" : "text-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 font-medium">{m.label}</span>
                        {mode === m.id && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            rows={1}
            placeholder={mode === "material" ? "Nhập chủ đề rồi chọn loại học liệu…" : modeDef.placeholder}
            className="max-h-24 min-h-[28px] flex-1 resize-none bg-transparent px-1 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />

          {mode !== "material" && (
            <Button
              size="icon"
              className="h-7 w-7 shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={busy || (!input.trim() && mode !== "full-lesson")}
              onClick={handleSend}
              aria-label="Gửi"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
        <p className="mt-1 px-1 text-[10px] text-muted-foreground">
          Nội dung do AI tạo — bạn nên đọc lại trước khi xuất bản.
        </p>
      </div>
    </div>
  );
}

/* ─── Message bubble ────────────────────────────────────────────── */

function MessageBubble({
  message, onInsert, onSaveMaterial, scope,
}: {
  message: ChatMessage;
  onInsert: (id: string, html: string) => void;
  onSaveMaterial: (id: string, mat: GeneratedMaterial) => void;
  scope: BuilderScope;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className={cn(
          "rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-foreground",
          message.streaming && "gk-ai-thinking",
        )}>
          {message.text}
          {message.streaming && <span className="ml-0.5 inline-block h-3 w-1 -translate-y-px animate-pulse bg-primary align-middle" />}
        </div>

        {/* Agentic step log */}
        {message.steps && (
          <div className="gk-pop space-y-1 rounded-xl border border-border bg-card p-2.5">
            {message.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                {s.status === "done" ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : s.status === "running" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <CircleDot className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
                <span className={cn(s.status === "done" ? "text-muted-foreground" : "text-foreground", s.status === "running" && "font-medium")}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Insert action */}
        {message.insertContent && !message.streaming && (
          message.inserted ? (
            <p className="flex items-center gap-1 text-[11px] font-medium text-success">
              <Check className="h-3.5 w-3.5" /> Đã chèn vào bài
            </p>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={() => onInsert(message.id, message.insertContent!)}
            >
              <PenLine className="h-3.5 w-3.5" /> Chèn vào bài
            </Button>
          )
        )}

        {/* Material result card */}
        {message.material && (
          <div className="gk-pop rounded-xl border border-border bg-card p-3">
            <p className="text-xs font-semibold text-foreground">{message.material.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{message.material.description}</p>
            <ul className="mt-2 space-y-1">
              {message.material.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /> {h}
                </li>
              ))}
            </ul>
            <div className="mt-2.5 flex items-center gap-2">
              {message.materialSaved ? (
                <>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-success">
                    <Check className="h-3.5 w-3.5" /> Đã lưu vào kho
                  </span>
                  <Button asChild size="sm" variant="ghost" className="h-7 gap-1.5 text-xs">
                    <Link to={scope === "org" ? "/org/library" : "/creator/library"}>
                      <Library className="h-3.5 w-3.5" /> Mở kho
                    </Link>
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className="h-7 gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary-hover"
                  onClick={() => onSaveMaterial(message.id, message.material!)}
                >
                  <Library className="h-3.5 w-3.5" /> Lưu vào kho
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

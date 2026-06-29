import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles, Send, ChevronDown, Wand2, PenLine, ListChecks, Layers, Boxes,
  Check, Loader2, ArrowUpRight, LayoutList, Palette, Library, CircleDot,
  Plus, Maximize2, Minimize2, X, FileUp, Paperclip, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiClient } from "@/lib/ai";
import { streamText, runSteps, sleep, type StepStatus } from "@/lib/ai/stream";
import type { AiChatMode, GeneratedMaterial, Storyboard } from "@/lib/ai/types";
import { useCourse, type CourseBlock, type CourseBlockType } from "@/stores/course";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";
import { useStoryboard } from "@/stores/storyboard";
import { useCourseTheme } from "@/stores/course-theme";
import { useStoryboardLibrary, allStoryboardItems } from "@/stores/storyboard-library";
import { useUiSystemLibrary, allUiSystemItems } from "@/stores/ui-system-library";
import type { ContentItem, LearningMaterialSubtype } from "@/lib/types";
import type { CourseTheme } from "@/lib/theme/resolve";
import { LEARNING_MATERIAL_TYPES, MATERIAL_TYPE_LABELS, MATERIAL_TYPE_ICONS } from "@/lib/taxonomy";
import { storyboardRoutePattern, uiSystemRoutePattern, type BuilderScope } from "@/lib/builder-url";
import { cn } from "@/lib/utils";

/* ─── Modes ─────────────────────────────────────────────────────── */

interface ModeDef { id: AiChatMode; label: string; icon: typeof PenLine; placeholder: string; }

const MODES: ModeDef[] = [
  { id: "content", label: "Tạo nội dung", icon: PenLine, placeholder: "Yêu cầu AI viết nội dung… (vd: đoạn mở đầu về tốc độ phản ứng)" },
  { id: "full-lesson", label: "Tạo cả bài", icon: Wand2, placeholder: "Nhập chủ đề để AI dựng cả bài học…" },
  { id: "quiz", label: "Tạo câu hỏi", icon: ListChecks, placeholder: "Chủ đề câu hỏi ôn tập…" },
  { id: "flashcards", label: "Tạo thẻ ghi nhớ", icon: Layers, placeholder: "Thuật ngữ / chủ đề cần ôn tập…" },
  { id: "material", label: "Tạo học liệu", icon: Boxes, placeholder: "Nhập chủ đề rồi chọn loại học liệu bên dưới…" },
  { id: "rewrite", label: "Soạn lại", icon: Sparkles, placeholder: "Dán đoạn cần soạn lại cho rõ hơn…" },
];

const BLOCK_LABELS: Partial<Record<CourseBlockType, string>> = {
  text: "Văn bản", image: "Hình ảnh", video: "Video", callout: "Callout", quiz: "Câu hỏi",
  section: "Phần", flashcards: "Thẻ ghi nhớ", accordion: "Accordion", process: "Quy trình",
  code: "Code", math: "Công thức", columns: "Cột", embed: "Học liệu", html: "Tương tác", divider: "Phân cách",
};

type Followup = { mode: AiChatMode; text: string };

function followupsFor(mode: AiChatMode): Followup[] {
  switch (mode) {
    case "content": return [
      { mode: "content", text: "Thêm một ví dụ thực tế minh hoạ" },
      { mode: "quiz", text: "Tạo 3 câu hỏi từ đoạn vừa viết" },
      { mode: "rewrite", text: "Rút gọn cho dễ đọc hơn" },
    ];
    case "full-lesson": return [
      { mode: "quiz", text: "Thêm câu hỏi củng cố cuối bài" },
      { mode: "flashcards", text: "Tạo bộ thẻ ghi nhớ cho bài" },
      { mode: "content", text: "Viết phần tổng kết" },
    ];
    case "quiz": return [
      { mode: "quiz", text: "Tạo thêm 3 câu khó hơn" },
      { mode: "flashcards", text: "Chuyển các ý này thành thẻ ghi nhớ" },
      { mode: "content", text: "Giải thích kỹ hơn đáp án" },
    ];
    case "flashcards": return [
      { mode: "quiz", text: "Tạo câu hỏi từ bộ thẻ này" },
      { mode: "flashcards", text: "Thêm 5 thẻ nữa" },
    ];
    case "material": return [
      { mode: "material", text: "Tạo thêm một học liệu loại khác" },
      { mode: "quiz", text: "Tạo bộ đề cho chủ đề này" },
    ];
    case "rewrite": return [
      { mode: "rewrite", text: "Đổi sang giọng thân thiện hơn" },
      { mode: "content", text: "Mở rộng thêm ý cho đoạn này" },
    ];
  }
}

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
  followups?: Followup[];
}

type Attachment =
  | { kind: "storyboard"; label: string; storyboard: Storyboard }
  | { kind: "ui"; label: string; theme: CourseTheme }
  | { kind: "material"; label: string; material: ContentItem }
  | { kind: "file"; label: string };
type PickerKind = "storyboard" | "ui" | "material" | null;

let msgSeq = 0;
const newId = () => `m_${Date.now()}_${msgSeq++}`;
const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

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
  const [plusOpen, setPlusOpen] = useState(false);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const contentItem = useContent((s) => s.items.find((x) => x.id === courseId));
  const roleId = useSession((s) => s.roleId);
  const subject = contentItem?.subject ?? "";
  const grade = contentItem?.grade ?? "";

  const storyboardLib = useStoryboardLibrary((s) => s.items);
  const uiSystemLib = useUiSystemLibrary((s) => s.items);
  const materials = useContent((s) => s.items);

  const modeDef = MODES.find((m) => m.id === mode)!;
  const ModeIcon = modeDef.icon;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Ô nhập tự giãn theo nội dung
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, expanded ? 220 : 150) + "px";
  }, [input, expanded, mode]);

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((cur) => cur.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);
  const patchStep = useCallback((id: string, index: number, status: StepStatus) => {
    setMessages((cur) => cur.map((m) => (m.id === id && m.steps ? { ...m, steps: m.steps.map((s, i) => (i === index ? { ...s, status } : s)) } : m)));
  }, []);
  const pushAssistant = (text: string): string => {
    const id = newId();
    setMessages((c) => [...c, { id, role: "assistant", text }]);
    return id;
  };

  const insertBlock = useCallback((type: CourseBlockType, patch: Partial<CourseBlock>) => {
    if (!lessonId) return;
    const bid = useCourse.getState().addBlock(courseId, lessonId, type);
    if (bid) useCourse.getState().updateBlock(courseId, lessonId, bid, { ...patch, aiGenerated: true });
  }, [courseId, lessonId]);

  const lessonSourceText = useCallback(() => {
    const data = useCourse.getState().courseData[courseId];
    const lesson = data?.lessons.find((l) => l.id === lessonId);
    return (lesson?.blocks ?? []).map((b) => stripHtml(b.content ?? "")).filter(Boolean).join(" ");
  }, [courseId, lessonId]);

  /* ─── Đổ block theo dàn ý (agentic) ───────────────────────────── */
  const runFill = useCallback(async (aid: string, storyboard: Storyboard, topic: string) => {
    const items = storyboard.sections.flatMap((s) => s.items);
    const steps = items.map((it) => ({ label: BLOCK_LABELS[it.blockType] ?? it.blockType, status: "pending" as StepStatus }));
    patchMessage(aid, { steps });
    await runSteps(
      steps.map((_, i) => ({ id: String(i), label: steps[i].label })),
      (i, st) => patchStep(aid, i, st),
      { perStepMs: 300, onWork: async (i) => { const it = items[i]; const patch = await aiClient.fillBlock({ item: it, subject, grade, topic }); insertBlock(it.blockType, patch); } },
    );
  }, [patchMessage, patchStep, insertBlock, subject, grade]);

  /* ─── Chạy một chế độ (không quản busy; pushUser=false khi gọi từ Gửi gộp) ─ */
  const _run = useCallback(async (activeMode: AiChatMode, rawPrompt: string, materialKind?: LearningMaterialSubtype, pushUser = true) => {
    const topic = rawPrompt.trim() || contentItem?.subject || "chủ đề bài học";
    if (pushUser) {
      const userText = activeMode === "material" && materialKind
        ? `Tạo ${MATERIAL_TYPE_LABELS[materialKind].toLowerCase()}: ${topic}`
        : rawPrompt.trim() || MODES.find((m) => m.id === activeMode)!.label;
      setMessages((cur) => [...cur, { id: newId(), role: "user", text: userText }]);
    }
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
          const patch = await aiClient.fillBlock({ item: { id: aid, blockType: "text", intent: topic, learningGoal: topic }, subject, grade, topic });
          patchMessage(aid, { insertContent: (patch.content as string) ?? "" });
          break;
        }
        case "rewrite": {
          const res = await aiClient.companionEdit({ text: rawPrompt.trim() || topic, action: "fix" });
          patchMessage(aid, { insertContent: `<p>${res.text}</p>` });
          break;
        }
        case "flashcards": {
          const patch = await aiClient.fillBlock({ item: { id: aid, blockType: "flashcards", intent: topic, learningGoal: topic }, subject, grade, topic });
          insertBlock("flashcards", patch);
          patchMessage(aid, { text: `${reply.text} Đã thêm bộ thẻ vào bài.` });
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
            { perStepMs: 260, onWork: (i) => { const it = items[i]; insertBlock("quiz", { content: it.content, quizOptions: it.quizOptions, quizCorrect: it.quizCorrect, quizExplanation: it.quizExplanation }); } },
          );
          patchMessage(aid, { text: `${reply.text} Đã thêm ${items.length} câu hỏi vào bài.` });
          break;
        }
        case "full-lesson": {
          let sbd = useStoryboard.getState().byLesson[lessonId!];
          if (!sbd) { sbd = await aiClient.generateStoryboard({ subject, grade, topic }); useStoryboard.getState().setStoryboard(lessonId!, sbd); }
          await runFill(aid, sbd, topic);
          patchMessage(aid, { text: `${reply.text.split(":")[0]}. Đã dựng xong ${sbd.sections.flatMap((s) => s.items).length} khối cho bài học.` });
          break;
        }
        case "material": {
          const kind = materialKind ?? "lesson";
          await sleep(260);
          const mat = await aiClient.generateMaterial({ kind, topic, subject, grade });
          patchMessage(aid, { material: mat, text: `Mình đã tạo ${MATERIAL_TYPE_LABELS[kind].toLowerCase()} "${mat.title}". Bạn lưu vào kho để dùng lại nhé.` });
          break;
        }
      }
      patchMessage(aid, { followups: followupsFor(activeMode) });
    } catch {
      patchMessage(aid, { streaming: false, text: "Có lỗi nhỏ khi xử lý. Bạn thử lại giúp mình nhé." });
    }
  }, [contentItem, lessonId, subject, grade, patchMessage, patchStep, insertBlock, lessonSourceText, runFill]);

  const runMode = useCallback(async (activeMode: AiChatMode, rawPrompt: string, materialKind?: LearningMaterialSubtype) => {
    if (busy) return;
    setBusy(true);
    try { await _run(activeMode, rawPrompt, materialKind, true); }
    finally { setBusy(false); }
  }, [busy, _run]);

  /* ─── "+" → chỉ ĐÍNH KÈM (tag), KHÔNG thực thi. Thực thi khi bấm Gửi. ─ */
  const onPickStoryboard = (item: { name: string; storyboard: Storyboard }) => {
    setPicker(null);
    setAttachments((a) => [...a, { kind: "storyboard", label: item.name, storyboard: item.storyboard }]);
  };
  const onPickUiSystem = (item: { name: string; theme: CourseTheme }) => {
    setPicker(null);
    setAttachments((a) => [...a, { kind: "ui", label: item.name, theme: item.theme }]);
  };
  const onPickMaterial = (mat: ContentItem) => {
    setPicker(null);
    setAttachments((a) => [...a, { kind: "material", label: mat.title, material: mat }]);
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAttachments((a) => [...a, { kind: "file", label: f.name }]);
    e.target.value = "";
  };

  const handleInsert = useCallback((id: string, html: string) => { insertBlock("text", { content: html }); patchMessage(id, { inserted: true }); }, [insertBlock, patchMessage]);
  const handleSaveMaterial = useCallback((id: string, mat: GeneratedMaterial) => {
    if (!roleId) return;
    const draftId = useContent.getState().createDraft("learning_material", roleId, { category: "learning_material", materialSubtype: mat.kind });
    useContent.getState().updateItem(draftId, { title: mat.title, subject: subject || "Chung", grade: grade || "", tags: mat.tags, description: mat.description });
    patchMessage(id, { materialSaved: true });
  }, [roleId, subject, grade, patchMessage]);

  const handleSend = async () => {
    if (busy) return;
    const atts = attachments;
    const prompt = input;
    const hasPrompt = prompt.trim().length > 0;
    if (!hasPrompt && atts.length === 0 && mode !== "full-lesson") return;
    setInput("");
    setAttachments([]);
    setBusy(true);
    try {
      // Bong bóng người dùng gộp (câu lệnh + các tag đính kèm)
      const labels = atts.map((a) => a.label);
      const userText = [prompt.trim(), labels.length ? `đính kèm: ${labels.join(", ")}` : ""].filter(Boolean).join("  ·  ") || MODES.find((m) => m.id === mode)!.label;
      setMessages((c) => [...c, { id: newId(), role: "user", text: userText }]);

      // 1) Giao diện
      for (const a of atts) if (a.kind === "ui") {
        useCourseTheme.getState().setTheme(courseId, a.theme);
        pushAssistant(`Đã áp giao diện "${a.label}" cho khoá học.`);
      }
      // 2) Học liệu
      for (const a of atts) if (a.kind === "material") {
        if (!lessonId) pushAssistant("Hãy chọn một bài học trước khi chèn học liệu nhé.");
        else { insertBlock("embed", { embedMaterialId: a.material.id, embedTitle: a.material.title, embedType: a.material.materialSubtype ?? "document" }); pushAssistant(`Đã chèn học liệu "${a.label}" vào bài.`); }
      }
      // 3) Tệp (mô phỏng)
      for (const a of atts) if (a.kind === "file") pushAssistant(`Đã tham khảo tệp "${a.label}" (mô phỏng).`);
      // 4) Dàn ý (agentic, có nhật ký bước)
      for (const a of atts) if (a.kind === "storyboard") {
        if (!lessonId) { pushAssistant("Hãy chọn một bài học trước khi áp dàn ý nhé."); continue; }
        const aid = pushAssistant(`Đang áp dàn ý "${a.label}" vào bài…`);
        useStoryboard.getState().setStoryboard(lessonId, a.storyboard);
        await runFill(aid, a.storyboard, subject || a.label);
        patchMessage(aid, { text: `Đã áp dàn ý "${a.label}" — thêm ${a.storyboard.sections.flatMap((s) => s.items).length} khối.`, followups: followupsFor("full-lesson") });
      }
      // 5) Câu lệnh chữ
      if (hasPrompt || mode === "full-lesson") await _run(mode, prompt, undefined, false);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [
    { mode: "full-lesson" as AiChatMode, text: `Dựng cả bài về ${subject || "chủ đề này"}` },
    { mode: "content" as AiChatMode, text: "Viết đoạn mở đầu cuốn hút" },
    { mode: "quiz" as AiChatMode, text: "Tạo 3 câu hỏi ôn tập" },
    { mode: "flashcards" as AiChatMode, text: "Tạo bộ thẻ ghi nhớ thuật ngữ" },
  ];

  const myMaterials = materials.filter((i) => i.category === "learning_material" && (i.ownerId === roleId || i.status === "published"));

  /* ─── Render pieces ───────────────────────────────────────────── */

  const header = (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-primary"><Sparkles className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Trợ lý AI soạn bài</p>
        <p className="truncate text-[11px] text-muted-foreground">Hỏi bất kỳ điều gì, mình soạn thẳng vào bài</p>
      </div>
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" title={expanded ? "Thu nhỏ" : "Mở rộng"} aria-label={expanded ? "Thu nhỏ" : "Mở rộng"}>
        {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  );

  const thread = (
    <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
      {messages.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col items-center px-2 py-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-primary"><Sparkles className="h-5 w-5" /></span>
          <p className="mt-3 text-sm font-medium text-foreground">Bắt đầu với một gợi ý</p>
          <p className="mt-1 text-xs text-muted-foreground">Chọn chế độ ở dưới, hoặc thử nhanh:</p>
          <div className="mt-3 grid w-full gap-1.5 sm:grid-cols-2">
            {suggestions.map((s) => (
              <button key={s.text} type="button" disabled={busy} onClick={() => { setMode(s.mode); void runMode(s.mode, s.text); }}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-foreground transition hover:border-primary hover:bg-accent disabled:opacity-50">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn("mx-auto space-y-3", expanded && "max-w-2xl")}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onInsert={handleInsert} onSaveMaterial={handleSaveMaterial} scope={scope} onFollowup={(f) => runMode(f.mode, f.text)} busy={busy} />
          ))}
        </div>
      )}
    </div>
  );

  const composer = (
    <div className="border-t border-border p-2.5">
      {/* material kinds */}
      {mode === "material" && (
        <div className="mb-2">
          <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Chọn loại học liệu để tạo</p>
          <div className="flex flex-wrap gap-1.5">
            {LEARNING_MATERIAL_TYPES.map((kind) => {
              const Icon = MATERIAL_TYPE_ICONS[kind];
              return (
                <button key={kind} type="button" disabled={busy} onClick={() => void runMode("material", input, kind)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-primary hover:bg-accent disabled:opacity-50">
                  <Icon className="h-3.5 w-3.5 text-primary" />{MATERIAL_TYPE_LABELS[kind]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* attachments */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-primary">
              {a.kind === "storyboard" ? <LayoutList className="h-3 w-3" /> : a.kind === "ui" ? <Palette className="h-3 w-3" /> : a.kind === "file" ? <Paperclip className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
              {a.label}
              <button type="button" onClick={() => setAttachments((cur) => cur.filter((_, j) => j !== i))} aria-label="Bỏ đính kèm"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}

      <div className="relative rounded-2xl border border-border bg-background p-2 focus-within:border-primary">
        {/* mode chip */}
        <div className="relative mb-1.5 inline-block">
          <button type="button" onClick={() => setModeOpen((v) => !v)} className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-semibold text-primary transition hover:bg-accent">
            <ModeIcon className="h-3.5 w-3.5" /><span>{modeDef.label}</span><ChevronDown className="h-3 w-3" />
          </button>
          {modeOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setModeOpen(false)} />
              <div className="absolute bottom-full left-0 z-50 mb-1.5 w-[220px] rounded-xl border border-border bg-card p-1.5 shadow-xl">
                {MODES.map((m) => { const Icon = m.icon; return (
                  <button key={m.id} type="button" onClick={() => { setMode(m.id); setModeOpen(false); }}
                    className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition", mode === m.id ? "bg-accent text-primary" : "text-foreground hover:bg-muted")}>
                    <Icon className="h-4 w-4 shrink-0" /><span className="flex-1 font-medium">{m.label}</span>{mode === m.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ); })}
              </div>
            </>
          )}
        </div>

        <textarea
          ref={taRef} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          rows={1} placeholder={modeDef.placeholder}
          className="block max-h-[220px] min-h-[44px] w-full resize-none bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />

        <div className="mt-1 flex items-center gap-1">
          {/* "+" menu */}
          <div className="relative">
            <button type="button" onClick={() => setPlusOpen((v) => !v)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-primary hover:text-primary" title="Thêm" aria-label="Thêm nội dung">
              <Plus className="h-4 w-4" />
            </button>
            {plusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPlusOpen(false)} />
                <div className="absolute bottom-full left-0 z-50 mb-1.5 w-[210px] rounded-xl border border-border bg-card p-1.5 shadow-xl">
                  <PlusItem icon={LayoutList} label="Thêm Storyboard" onClick={() => { setPlusOpen(false); setPicker("storyboard"); }} />
                  <PlusItem icon={Palette} label="Thêm Giao diện" onClick={() => { setPlusOpen(false); setPicker("ui"); }} />
                  <div className="my-1 h-px bg-border" />
                  <PlusItem icon={BookOpen} label="Chèn học liệu từ kho" onClick={() => { setPlusOpen(false); setPicker("material"); }} />
                  <PlusItem icon={FileUp} label="Tải tệp lên" onClick={() => { setPlusOpen(false); fileRef.current?.click(); }} />
                  <PlusItem icon={Boxes} label="Tạo học liệu mới" onClick={() => { setPlusOpen(false); setMode("material"); }} />
                </div>
              </>
            )}
          </div>

          <span className="flex-1 truncate px-1 text-[10px] text-muted-foreground">Nội dung do AI tạo — bạn nên đọc lại trước khi xuất bản.</span>

          <Button size="icon" className="h-8 w-8 shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={busy || (!input.trim() && attachments.length === 0 && mode !== "full-lesson")} onClick={handleSend} aria-label="Gửi">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <input ref={fileRef} type="file" className="hidden" onChange={onFile} aria-hidden />

      {/* Picker overlay */}
      {picker && (
        <LibraryPicker
          kind={picker}
          scope={scope}
          roleId={roleId}
          onClose={() => setPicker(null)}
          storyboards={allStoryboardItems(storyboardLib)}
          uiSystems={allUiSystemItems(uiSystemLib)}
          materials={myMaterials}
          onPickStoryboard={onPickStoryboard}
          onPickUiSystem={onPickUiSystem}
          onPickMaterial={onPickMaterial}
        />
      )}
    </div>
  );

  const inner = (
    <div className="flex h-full flex-col bg-card">
      {header}
      {thread}
      {composer}
    </div>
  );

  if (expanded) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setExpanded(false)}>
        <div className="flex h-[84vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {inner}
        </div>
      </div>,
      document.body,
    );
  }
  return inner;
}

/* ─── Sub-components ────────────────────────────────────────────── */

function PlusItem({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-foreground transition hover:bg-muted">
      <Icon className="h-4 w-4 shrink-0 text-primary" /><span className="font-medium">{label}</span>
    </button>
  );
}

function LibraryPicker({
  kind, scope, roleId, onClose, storyboards, uiSystems, materials, onPickStoryboard, onPickUiSystem, onPickMaterial,
}: {
  kind: Exclude<PickerKind, null>;
  scope: BuilderScope;
  roleId: string | null;
  onClose: () => void;
  storyboards: { id: string; name: string; source: string; description?: string; storyboard: Storyboard }[];
  uiSystems: { id: string; name: string; source: string; description?: string; theme: CourseTheme }[];
  materials: ContentItem[];
  onPickStoryboard: (i: { name: string; storyboard: Storyboard }) => void;
  onPickUiSystem: (i: { name: string; theme: CourseTheme }) => void;
  onPickMaterial: (m: ContentItem) => void;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"system" | "user">("system");
  const [q, setQ] = useState("");
  const sysTab = tab === "system";
  const match = (s: string) => !q.trim() || s.toLowerCase().includes(q.trim().toLowerCase());

  const sb = storyboards.filter((it) => (sysTab ? it.source === "system" : it.source === "user")).filter((it) => match(it.name));
  const ui = uiSystems.filter((it) => (sysTab ? it.source === "system" : it.source === "user")).filter((it) => match(it.name));
  const mat = materials.filter((m) => (sysTab ? m.ownerId !== roleId : m.ownerId === roleId)).filter((m) => match(m.title));
  const empty = (kind === "storyboard" ? sb.length : kind === "ui" ? ui.length : mat.length) === 0;

  const title = kind === "storyboard" ? "Chọn dàn ý" : kind === "ui" ? "Chọn giao diện" : "Chọn học liệu";
  const TitleIcon = kind === "ui" ? Palette : kind === "material" ? BookOpen : LayoutList;

  const openKho = () => {
    const id = `mod_${Date.now()}`;
    if (kind === "storyboard") navigate({ to: storyboardRoutePattern(scope), params: { id } });
    else if (kind === "ui") navigate({ to: uiSystemRoutePattern(scope), params: { id } });
    else navigate({ to: scope === "org" ? "/org/library" : "/creator/library" });
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/30 p-4" onClick={onClose}>
      <div className="flex max-h-[74vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-primary"><TitleIcon className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="truncate text-[11px] text-muted-foreground">Đính kèm — bấm Gửi mới thực thi</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        {/* Tabs + search */}
        <div className="flex items-center gap-1 border-b border-border px-3">
          {([["system", "Kho hệ thống"], ["user", "Thư viện của tôi"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={cn("relative px-3 py-2.5 text-xs font-semibold transition", tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              {label}{tab === id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên…"
            className="ml-auto my-1.5 w-[150px] rounded-lg border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary" />
        </div>

        {/* List */}
        <div className="min-h-[160px] flex-1 space-y-1.5 overflow-y-auto p-3">
          {empty && <p className="px-1 py-10 text-center text-xs text-muted-foreground">Không tìm thấy mục nào ở đây.</p>}
          {kind === "storyboard" && sb.map((it) => (
            <button key={it.id} type="button" onClick={() => onPickStoryboard(it)} className="flex w-full items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition hover:border-primary hover:bg-accent">
              <LayoutList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-foreground">{it.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{it.description ?? `${it.storyboard.sections.length} phần`}</span>
              </span>
              <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {kind === "ui" && ui.map((it) => (
            <button key={it.id} type="button" onClick={() => onPickUiSystem(it)} className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition hover:border-primary hover:bg-accent">
              <span className="h-7 w-7 shrink-0 rounded-md border border-border" style={{ background: it.theme.accentSeed }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-foreground">{it.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{it.description ?? "Giao diện khoá học"}</span>
              </span>
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {kind === "material" && mat.map((m) => (
            <button key={m.id} type="button" onClick={() => onPickMaterial(m)} className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition hover:border-primary hover:bg-accent">
              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-foreground">{m.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{MATERIAL_TYPE_LABELS[(m.materialSubtype ?? "document")]} · {m.subject}</span>
              </span>
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Footer: mở kho đầy đủ */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <button type="button" onClick={openKho} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            {kind === "material" ? "Mở Thư viện đầy đủ" : kind === "ui" ? "Mở kho Giao diện" : "Mở kho Storyboard"}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Message bubble ────────────────────────────────────────────── */

function MessageBubble({
  message, onInsert, onSaveMaterial, scope, onFollowup, busy,
}: {
  message: ChatMessage;
  onInsert: (id: string, html: string) => void;
  onSaveMaterial: (id: string, mat: GeneratedMaterial) => void;
  scope: BuilderScope;
  onFollowup: (f: Followup) => void;
  busy: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground">{message.text}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-primary"><Sparkles className="h-3.5 w-3.5" /></span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className={cn("rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-foreground", message.streaming && "gk-ai-thinking")}>
          {message.text}
          {message.streaming && <span className="ml-0.5 inline-block h-3 w-1 -translate-y-px animate-pulse bg-primary align-middle" />}
        </div>

        {message.steps && (
          <div className="gk-pop space-y-1 rounded-xl border border-border bg-card p-2.5">
            {message.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                {s.status === "done" ? <Check className="h-3.5 w-3.5 text-success" /> : s.status === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <CircleDot className="h-3.5 w-3.5 text-muted-foreground/40" />}
                <span className={cn(s.status === "done" ? "text-muted-foreground" : "text-foreground", s.status === "running" && "font-medium")}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {message.insertContent && !message.streaming && (
          message.inserted ? (
            <p className="flex items-center gap-1 text-[11px] font-medium text-success"><Check className="h-3.5 w-3.5" /> Đã chèn vào bài</p>
          ) : (
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => onInsert(message.id, message.insertContent!)}>
              <PenLine className="h-3.5 w-3.5" /> Chèn vào bài
            </Button>
          )
        )}

        {message.material && (
          <div className="gk-pop rounded-xl border border-border bg-card p-3">
            <p className="text-xs font-semibold text-foreground">{message.material.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{message.material.description}</p>
            <ul className="mt-2 space-y-1">
              {message.material.highlights.map((h, i) => (<li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /> {h}</li>))}
            </ul>
            <div className="mt-2.5 flex items-center gap-2">
              {message.materialSaved ? (
                <>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-success"><Check className="h-3.5 w-3.5" /> Đã lưu vào kho</span>
                  <Button asChild size="sm" variant="ghost" className="h-7 gap-1.5 text-xs">
                    <Link to={scope === "org" ? "/org/library" : "/creator/library"}><Library className="h-3.5 w-3.5" /> Mở kho</Link>
                  </Button>
                </>
              ) : (
                <Button size="sm" className="h-7 gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary-hover" onClick={() => onSaveMaterial(message.id, message.material!)}>
                  <Library className="h-3.5 w-3.5" /> Lưu vào kho
                </Button>
              )}
            </div>
          </div>
        )}

        {message.followups && !message.streaming && (
          <div className="space-y-1.5 pt-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Gợi ý tiếp theo</p>
            {message.followups.map((f, i) => (
              <button key={i} type="button" disabled={busy} onClick={() => onFollowup(f)}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-left text-[11.5px] text-foreground transition hover:border-primary hover:bg-accent disabled:opacity-50">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{f.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

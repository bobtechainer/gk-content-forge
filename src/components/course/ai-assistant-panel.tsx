import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import {
  Sparkles, Send, ChevronDown, Wand2, PenLine, ListChecks, GraduationCap, Boxes,
  Check, Loader2, ArrowUpRight, LayoutList, Palette, Library, CircleDot,
  Plus, Maximize2, Minimize2, X, FileUp, Paperclip, BookOpen, BookText, History, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiClient } from "@/lib/ai";
import { streamText, runSteps, sleep, type StepStatus } from "@/lib/ai/stream";
import type { AiChatMode, GeneratedMaterial, Storyboard, CourseOutline } from "@/lib/ai/types";
import { useCourse, type CourseBlock, type CourseBlockType } from "@/stores/course";
import { sceneSrc } from "@/lib/storyboard/scene-art";
import { ramp } from "@/lib/theme/color";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";
import { useStoryboard } from "@/stores/storyboard";
import { useCourseTheme } from "@/stores/course-theme";
import { useStoryboardLibrary, allStoryboardItems } from "@/stores/storyboard-library";
import { useUiSystemLibrary, allUiSystemItems } from "@/stores/ui-system-library";
import type { ContentItem, LearningMaterialSubtype } from "@/lib/types";
import type { ChatMessage, Followup } from "./ai-chat-types";
import { useAiChats, type AiConversation } from "@/stores/ai-chats";
import type { CourseTheme } from "@/lib/theme/resolve";
import { LEARNING_MATERIAL_TYPES, MATERIAL_TYPE_LABELS, MATERIAL_TYPE_ICONS } from "@/lib/taxonomy";
import { type BuilderScope } from "@/lib/builder-url";
import { useModuleStart } from "@/stores/module-start";
import { PreviewConfirmDialog } from "./preview-confirm-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Modes ─────────────────────────────────────────────────────── */

interface ModeDef { id: AiChatMode; label: string; icon: typeof PenLine; placeholder: string; }

const MODES: ModeDef[] = [
  { id: "course", label: "Tạo dàn ý khoá học", icon: GraduationCap, placeholder: "Mô tả khoá học để AI dựng dàn ý Phần/Chương/Bài… (đính kèm 1 storyboard, 1 giao diện nếu muốn)" },
  { id: "full-lesson", label: "Tạo nội dung bài học", icon: Wand2, placeholder: "Nhập chủ đề để AI soạn nội dung cho bài đang chọn…" },
  { id: "quiz", label: "Tạo câu hỏi", icon: ListChecks, placeholder: "Chủ đề câu hỏi ôn tập…" },
  { id: "material", label: "Tạo học liệu", icon: Boxes, placeholder: "Nhập chủ đề rồi chọn loại học liệu bên dưới…" },
];

const BLOCK_LABELS: Partial<Record<CourseBlockType, string>> = {
  text: "Văn bản", image: "Hình ảnh", video: "Video", callout: "Callout", quiz: "Câu hỏi",
  section: "Phần", flashcards: "Thẻ ghi nhớ", accordion: "Accordion", process: "Quy trình",
  code: "Code", math: "Công thức", columns: "Cột", embed: "Học liệu", html: "Tương tác", divider: "Phân cách",
};

function followupsFor(mode: AiChatMode): Followup[] {
  switch (mode) {
    case "content": return [
      { mode: "content", text: "Thêm một ví dụ thực tế minh hoạ" },
      { mode: "quiz", text: "Tạo 3 câu hỏi từ đoạn vừa viết" },
    ];
    case "course": return [
      { mode: "full-lesson", text: "Soạn nội dung bài đầu tiên" },
      { mode: "quiz", text: "Tạo câu hỏi ôn tập cho khoá" },
    ];
    case "full-lesson": return [
      { mode: "quiz", text: "Thêm câu hỏi củng cố cuối bài" },
      { mode: "content", text: "Viết phần tổng kết" },
    ];
    case "quiz": return [
      { mode: "quiz", text: "Tạo thêm 3 câu khó hơn" },
      { mode: "content", text: "Giải thích kỹ hơn đáp án" },
    ];
    case "material": return [
      { mode: "material", text: "Tạo thêm một học liệu loại khác" },
      { mode: "quiz", text: "Tạo bộ đề cho chủ đề này" },
    ];
  }
}

/* ─── Message model ─────────────────────────────────────────────── */

type Attachment =
  | { kind: "storyboard"; label: string; storyboard: Storyboard }
  | { kind: "ui"; label: string; theme: CourseTheme }
  | { kind: "material"; label: string; material: ContentItem }
  | { kind: "book"; label: string; book: ContentItem }
  | { kind: "file"; label: string };
type PickerKind = "storyboard" | "ui" | "material" | "book" | null;

let msgSeq = 0;
const newId = () => `m_${Date.now()}_${msgSeq++}`;
const EMPTY_CONVS: AiConversation[] = [];

/** Thời gian tương đối ngắn gọn cho lịch sử trò chuyện. */
function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
}
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
  const [mode, setMode] = useState<AiChatMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [convId, setConvId] = useState(() => newId());
  // "Tạo học liệu": chọn loại trước, gõ yêu cầu, bấm Gửi mới tạo (không auto).
  const [materialKind, setMaterialKind] = useState<LearningMaterialSubtype | null>(null);
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

  const saveChat = useAiChats((s) => s.save);
  const removeChat = useAiChats((s) => s.remove);
  const convs = useAiChats((s) => s.byCourse[courseId] ?? EMPTY_CONVS);

  const modeDef = MODES.find((m) => m.id === mode) ?? null;
  const ModeIcon = modeDef?.icon ?? Sparkles;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Lưu cuộc trò chuyện vào lịch sử mỗi khi có thay đổi.
  useEffect(() => {
    if (!messages.length) return;
    const firstUser = messages.find((m) => m.role === "user");
    const title = (firstUser?.text || "Cuộc trò chuyện mới").slice(0, 48);
    saveChat(courseId, { id: convId, title, messages: messages.map((m) => ({ ...m, streaming: false })), updatedAt: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const newChat = () => { setMessages([]); setAttachments([]); setConvId(newId()); setHistoryOpen(false); };
  const loadConv = (c: AiConversation) => { setMessages(c.messages); setConvId(c.id); setHistoryOpen(false); };

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
        : rawPrompt.trim() || MODES.find((m) => m.id === activeMode)?.label || "Trợ lý AI";
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
        case "quiz": {
          const source = lessonSourceText() || topic;
          const items = await aiClient.quizFromContent({ sourceText: source, count: 3 });
          // KHÔNG chèn ngay — hiện thẻ xem trước, người dùng xác nhận mới đưa vào bài.
          patchMessage(aid, { quizItems: items, text: `${reply.text} Mình đã soạn ${items.length} câu — bạn xem trước rồi đưa vào bài nhé.` });
          break;
        }
        case "full-lesson": {
          let sbd = useStoryboard.getState().byLesson[lessonId!];
          if (!sbd) { sbd = await aiClient.generateStoryboard({ subject, grade, topic }); useStoryboard.getState().setStoryboard(lessonId!, sbd); }
          // Không đổ ngay — phác rồi xem trước, xác nhận mới đưa vào bài.
          patchMessage(aid, { lessonPlan: { storyboard: sbd, topic }, text: `${reply.text} Mình đã phác các khối cho bài — bạn xem trước rồi đưa vào bài nhé.` });
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
  // Storyboard & Giao diện: tối đa 1 mỗi loại — chọn cái mới thay cái cũ.
  const onPickStoryboard = (item: { name: string; storyboard: Storyboard }) => {
    setPicker(null);
    setAttachments((a) => [...a.filter((x) => x.kind !== "storyboard"), { kind: "storyboard", label: item.name, storyboard: item.storyboard }]);
  };
  const onPickUiSystem = (item: { name: string; theme: CourseTheme }) => {
    setPicker(null);
    setAttachments((a) => [...a.filter((x) => x.kind !== "ui"), { kind: "ui", label: item.name, theme: item.theme }]);
  };
  const onPickMaterial = (mat: ContentItem) => {
    setPicker(null);
    setAttachments((a) => [...a, { kind: "material", label: mat.title, material: mat }]);
  };
  const onPickBook = (b: ContentItem) => {
    setPicker(null);
    setAttachments((a) => [...a, { kind: "book", label: b.title, book: b }]);
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAttachments((a) => [...a, { kind: "file", label: f.name }]);
    e.target.value = "";
  };

  /* ─── "Tạo dàn ý khoá học": PHÁC trước → xem trước → xác nhận mới dựng ─ */
  const runCourseOutline = useCallback(async (prompt: string, storyboard: Storyboard | undefined, labels: string[]) => {
    if (busy) return;
    setBusy(true);
    try {
      const topic = prompt.trim() || subject || "khoá học";
      const userText = [prompt.trim(), labels.length ? `đính kèm: ${labels.join(", ")}` : ""].filter(Boolean).join("  ·  ") || "Tạo dàn ý khoá học";
      setMessages((c) => [...c, { id: newId(), role: "user", text: userText }]);
      const aid = newId();
      setMessages((c) => [...c, { id: aid, role: "assistant", text: "", streaming: true }]);
      const reply = await aiClient.chatReply({ prompt: topic, mode: "course", topic });
      await streamText(reply.text, (p) => patchMessage(aid, { text: p }));
      const outline = await aiClient.generateCourseOutline({ prompt: topic, subject, grade, storyboard });
      patchMessage(aid, { streaming: false, courseOutline: outline, text: `${reply.text} Mình đã phác dàn ý — bạn xem trước rồi dựng vào khoá học nhé.` });
    } catch {
      pushAssistant("Có lỗi khi phác dàn ý khoá học. Bạn thử lại giúp mình nhé.");
    } finally {
      setBusy(false);
    }
  }, [busy, subject, grade, patchMessage]);

  // Sau khi xác nhận: dựng dàn ý vào cây nội dung (agentic, có nhật ký bước).
  const runOutlineBuild = useCallback(async (msgId: string, outline: CourseOutline) => {
    if (busy) return;
    setBusy(true);
    patchMessage(msgId, { courseBuilt: true });
    const aid = pushAssistant("Đang dựng khoá học vào cây nội dung…");
    try {
      const cs = useCourse.getState();
      const steps = outline.parts.map((p) => ({ label: `Phần: ${p.title}`, status: "pending" as StepStatus }));
      patchMessage(aid, { steps });
      let lessons = 0;
      await runSteps(
        steps.map((_, i) => ({ id: String(i), label: steps[i].label })),
        (i, st) => patchStep(aid, i, st),
        {
          perStepMs: 280,
          onWork: (i) => {
            const part = outline.parts[i];
            const pid = cs.addPart(courseId, part.title);
            for (const ch of part.chapters) {
              const cid = cs.addChapterUnder(courseId, pid, ch.title);
              for (const ls of ch.lessons) { cs.addLessonUnder(courseId, { id: cid, type: "chapter" }, ls.title); lessons++; }
            }
          },
        },
      );
      patchMessage(aid, { text: `Xong! Đã dựng ${outline.parts.length} phần, ${lessons} bài vào cây nội dung bên trái.`, followups: followupsFor("course") });
    } catch {
      patchMessage(aid, { text: "Có lỗi khi dựng khoá học. Bạn thử lại giúp mình nhé." });
    } finally {
      setBusy(false);
    }
  }, [busy, courseId, patchMessage, patchStep]);

  // Popup xem trước + xác nhận (preview-before-confirm) cho mọi thao tác thêm vào bài.
  const [confirm, setConfirm] = useState<{ title: string; confirmLabel: string; preview: React.ReactNode; onConfirm: () => void } | null>(null);

  const handleInsert = useCallback((id: string, html: string) => { insertBlock("text", { content: html }); patchMessage(id, { inserted: true }); }, [insertBlock, patchMessage]);
  const handleInsertQuiz = useCallback((id: string, items: NonNullable<ChatMessage["quizItems"]>) => {
    for (const it of items) insertBlock("quiz", { content: it.content, quizOptions: it.quizOptions, quizCorrect: it.quizCorrect, quizExplanation: it.quizExplanation });
    patchMessage(id, { inserted: true });
  }, [insertBlock, patchMessage]);
  const handleEmbedMaterial = useCallback((id: string, mat: GeneratedMaterial) => {
    insertBlock("embed", { embedTitle: mat.title, embedType: mat.kind });
    patchMessage(id, { materialInserted: true });
  }, [insertBlock, patchMessage]);
  // Sau khi xác nhận: đổ nội dung (storyboard) vào bài đang chọn (agentic).
  const handleFillLesson = useCallback(async (msgId: string, storyboard: Storyboard, topic: string) => {
    if (busy || !lessonId) return;
    setBusy(true);
    patchMessage(msgId, { lessonFilled: true });
    const aid = pushAssistant("Đang đưa nội dung vào bài…");
    try {
      await runFill(aid, storyboard, topic);
      patchMessage(aid, { text: `Đã đưa ${storyboard.sections.flatMap((s) => s.items).length} khối vào bài.`, followups: followupsFor("full-lesson") });
    } catch {
      patchMessage(aid, { text: "Có lỗi khi đưa nội dung vào bài. Bạn thử lại nhé." });
    } finally {
      setBusy(false);
    }
  }, [busy, lessonId, runFill, patchMessage]);
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
    if (!hasPrompt && atts.length === 0 && mode !== "full-lesson" && mode !== "course") return;

    // Tạo học liệu: phải chọn loại + gõ yêu cầu (không tự tạo khi chỉ chọn loại).
    if (mode === "material") {
      if (!materialKind) { toast("Bạn chọn loại học liệu muốn tạo trước nhé."); return; }
      if (!hasPrompt) { toast("Nhập yêu cầu/chủ đề cho học liệu rồi gửi nhé."); return; }
    }

    // Tạo dàn ý khoá học: dựng thẳng cây nội dung (áp giao diện nếu có đính kèm).
    if (mode === "course") {
      const sbAtt = atts.find((a) => a.kind === "storyboard");
      const uiAtt = atts.find((a) => a.kind === "ui");
      setInput("");
      setAttachments([]);
      if (uiAtt?.kind === "ui") useCourseTheme.getState().setTheme(courseId, uiAtt.theme);
      await runCourseOutline(prompt, sbAtt?.kind === "storyboard" ? sbAtt.storyboard : undefined, atts.map((a) => a.label));
      return;
    }

    setInput("");
    setAttachments([]);
    setBusy(true);
    try {
      // Bong bóng người dùng gộp (câu lệnh + các tag đính kèm)
      const labels = atts.map((a) => a.label);
      const userText = [prompt.trim(), labels.length ? `đính kèm: ${labels.join(", ")}` : ""].filter(Boolean).join("  ·  ") || MODES.find((m) => m.id === mode)?.label || "Trợ lý AI";
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
      // 3b) Sách — làm ngữ cảnh cho AI
      for (const a of atts) if (a.kind === "book") pushAssistant(`Đã lấy sách "${a.label}" làm ngữ cảnh — mình sẽ bám theo khi soạn.`);
      // 4) Dàn ý (agentic, có nhật ký bước)
      for (const a of atts) if (a.kind === "storyboard") {
        if (!lessonId) { pushAssistant("Hãy chọn một bài học trước khi áp dàn ý nhé."); continue; }
        const aid = pushAssistant(`Đang áp dàn ý "${a.label}" vào bài…`);
        useStoryboard.getState().setStoryboard(lessonId, a.storyboard);
        await runFill(aid, a.storyboard, subject || a.label);
        patchMessage(aid, { text: `Đã áp dàn ý "${a.label}" — thêm ${a.storyboard.sections.flatMap((s) => s.items).length} khối.`, followups: followupsFor("full-lesson") });
      }
      // 5) Câu lệnh chữ
      if (mode === "material") await _run("material", prompt, materialKind ?? undefined, false);
      else if (hasPrompt || mode === "full-lesson") await _run(mode ?? "content", prompt, undefined, false);
    } finally {
      setBusy(false);
    }
  };

  const suggestions: { mode: AiChatMode; text: string }[] = [
    { mode: "course", text: `Dựng dàn ý khoá học về ${subject || "chủ đề này"}` },
    { mode: "full-lesson", text: "Soạn nội dung cho bài đang chọn" },
    { mode: "quiz", text: "Tạo 3 câu hỏi ôn tập" },
  ];

  const myMaterials = materials.filter((i) => i.category === "learning_material" && (i.ownerId === roleId || i.status === "published"));
  const books = materials.filter((i) => i.category === "book");

  /* ─── Render pieces ───────────────────────────────────────────── */

  const header = (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-primary"><Sparkles className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Trợ lý AI soạn bài</p>
        <p className="truncate text-[11px] text-muted-foreground">Hỏi bất kỳ điều gì, mình soạn thẳng vào bài</p>
      </div>
      <button type="button" onClick={newChat} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Cuộc trò chuyện mới" aria-label="Cuộc trò chuyện mới">
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => setHistoryOpen(true)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Lịch sử" aria-label="Lịch sử trò chuyện">
        <History className="h-4 w-4" />
      </button>
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
              <button key={s.text} type="button" disabled={busy} onClick={() => {
                if (s.mode === "course") { void runCourseOutline(s.text, undefined, []); return; }
                setMode(s.mode); void runMode(s.mode, s.text);
              }}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-foreground transition hover:border-primary hover:bg-accent disabled:opacity-50">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn("mx-auto space-y-3", expanded && "max-w-2xl")}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onInsert={handleInsert} onInsertQuiz={handleInsertQuiz} onEmbedMaterial={handleEmbedMaterial} onSaveMaterial={handleSaveMaterial} onBuildOutline={runOutlineBuild} onFillLesson={handleFillLesson} onPreview={setConfirm} scope={scope} onFollowup={(f) => runMode(f.mode, f.text)} busy={busy} />
          ))}
        </div>
      )}
    </div>
  );

  const composer = (
    <div className="border-t border-border p-2.5">
      {/* material kinds — chọn loại rồi nhập yêu cầu và Gửi */}
      {mode === "material" && (
        <div className="mb-2">
          <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Chọn loại học liệu, nhập yêu cầu rồi bấm Gửi</p>
          <div className="flex flex-wrap gap-1.5">
            {LEARNING_MATERIAL_TYPES.map((kind) => {
              const Icon = MATERIAL_TYPE_ICONS[kind];
              const active = materialKind === kind;
              return (
                <button key={kind} type="button" onClick={() => setMaterialKind((k) => (k === kind ? null : kind))}
                  className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition", active ? "border-primary bg-accent text-primary" : "border-border bg-card text-foreground hover:border-primary hover:bg-accent")}>
                  <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-primary")} />{MATERIAL_TYPE_LABELS[kind]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* attachments khác (học liệu / sách / tệp) — nhiều được */}
      {attachments.some((a) => a.kind === "material" || a.kind === "book" || a.kind === "file") && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((a, i) => (a.kind === "storyboard" || a.kind === "ui") ? null : (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-primary">
              {a.kind === "file" ? <Paperclip className="h-3 w-3" /> : a.kind === "book" ? <BookText className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
              {a.label}
              <button type="button" onClick={() => setAttachments((cur) => cur.filter((_, j) => j !== i))} aria-label="Bỏ đính kèm"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Quick-add: Storyboard — chỉ chọn 1; chọn xong "+" thành card, ✕ để gỡ.
          (Giao diện là của cả khoá — chỉnh ở thanh "Giao diện khoá học" cột trái.) */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">Đính kèm:</span>
        <QuickAttach
          icon={LayoutList} label="Storyboard"
          chosen={attachments.find((a) => a.kind === "storyboard")?.label}
          onAdd={() => setPicker("storyboard")}
          onRemove={() => setAttachments((a) => a.filter((x) => x.kind !== "storyboard"))}
        />
      </div>

      <div className="relative rounded-2xl border border-border bg-background p-2 focus-within:border-primary">
        {/* mode chip */}
        <div className="relative mb-1.5 inline-block">
          <button type="button" onClick={() => setModeOpen((v) => !v)} className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-semibold text-primary transition hover:bg-accent">
            <ModeIcon className="h-3.5 w-3.5" /><span>{modeDef?.label ?? "Chọn chế độ"}</span><ChevronDown className="h-3 w-3" />
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
          rows={1} placeholder={modeDef?.placeholder ?? "Nhập yêu cầu cho trợ lý, hoặc chọn một chế độ ở trên…"}
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
                  <PlusItem icon={BookText} label="Chèn sách" onClick={() => { setPlusOpen(false); setPicker("book"); }} />
                  <PlusItem icon={BookOpen} label="Chèn học liệu từ kho" onClick={() => { setPlusOpen(false); setPicker("material"); }} />
                  <PlusItem icon={FileUp} label="Tải tệp lên" onClick={() => { setPlusOpen(false); fileRef.current?.click(); }} />
                </div>
              </>
            )}
          </div>

          <span className="flex-1 truncate px-1 text-[10px] text-muted-foreground">Nội dung do AI tạo — bạn nên đọc lại trước khi xuất bản.</span>

          <Button size="icon" className="h-8 w-8 shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={busy || (!input.trim() && attachments.length === 0 && mode !== "full-lesson" && mode !== "course")} onClick={handleSend} aria-label="Gửi">
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
          books={books}
          onPickStoryboard={onPickStoryboard}
          onPickUiSystem={onPickUiSystem}
          onPickMaterial={onPickMaterial}
          onPickBook={onPickBook}
        />
      )}
    </div>
  );

  const inner = (
    <div className="relative flex h-full flex-col bg-card">
      {header}
      {historyOpen && (
        <div className="absolute inset-0 z-[55] flex flex-col bg-card">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <span className="flex-1 text-sm font-semibold text-foreground">Cuộc trò chuyện</span>
            <button type="button" onClick={newChat} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary">
              <Plus className="h-3.5 w-3.5" /> Mới
            </button>
            <button type="button" onClick={() => setHistoryOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Đóng">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {convs.length === 0 ? (
              <p className="px-2 py-10 text-center text-xs text-muted-foreground">Chưa có cuộc trò chuyện nào được lưu.</p>
            ) : (
              convs.map((c) => (
                <div key={c.id} className={cn("group flex items-center gap-2 rounded-lg px-2.5 py-2 transition hover:bg-muted", c.id === convId && "bg-accent")}>
                  <button type="button" onClick={() => loadConv(c)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-xs font-medium text-foreground">{c.title}</span>
                    <span className="block text-[10px] text-muted-foreground">{relTime(c.updatedAt)} · {c.messages.length} tin nhắn</span>
                  </button>
                  <button type="button" onClick={() => removeChat(courseId, c.id)} className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Xoá cuộc trò chuyện">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {thread}
      {composer}
      {confirm && (
        <PreviewConfirmDialog
          open
          onOpenChange={(o) => { if (!o) setConfirm(null); }}
          title={confirm.title}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
        >
          {confirm.preview}
        </PreviewConfirmDialog>
      )}
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

/** Nút đính kèm nhanh: chưa chọn = "+", đã chọn = card có ✕ (chỉ 1 mỗi loại). */
function QuickAttach({ icon: Icon, label, chosen, onAdd, onRemove }: { icon: typeof Plus; label: string; chosen?: string; onAdd: () => void; onRemove: () => void }) {
  if (chosen) {
    return (
      <span className="inline-flex max-w-[180px] items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-primary">
        <Icon className="h-3 w-3 shrink-0" /> <span className="truncate">{chosen}</span>
        <button type="button" onClick={onRemove} aria-label={`Bỏ ${label}`} className="shrink-0"><X className="h-3 w-3" /></button>
      </span>
    );
  }
  return (
    <button type="button" onClick={onAdd}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary">
      <Plus className="h-3 w-3" /> <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function LibraryPicker({
  kind, scope, roleId, onClose, storyboards, uiSystems, materials, books, onPickStoryboard, onPickUiSystem, onPickMaterial, onPickBook,
}: {
  kind: Exclude<PickerKind, null>;
  scope: BuilderScope;
  roleId: string | null;
  onClose: () => void;
  storyboards: { id: string; name: string; source: string; description?: string; storyboard: Storyboard }[];
  uiSystems: { id: string; name: string; source: string; description?: string; theme: CourseTheme }[];
  materials: ContentItem[];
  books: ContentItem[];
  onPickStoryboard: (i: { name: string; storyboard: Storyboard }) => void;
  onPickUiSystem: (i: { name: string; theme: CourseTheme }) => void;
  onPickMaterial: (m: ContentItem) => void;
  onPickBook: (m: ContentItem) => void;
}) {
  const [tab, setTab] = useState<"system" | "user">("system");
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(null);
  const sysTab = tab === "system";
  const match = (s: string) => !q.trim() || s.toLowerCase().includes(q.trim().toLowerCase());
  const isModule = kind === "storyboard" || kind === "ui";

  const sb = storyboards.filter((it) => (sysTab ? it.source === "system" : it.source === "user")).filter((it) => match(it.name));
  const ui = uiSystems.filter((it) => (sysTab ? it.source === "system" : it.source === "user")).filter((it) => match(it.name));
  const mat = materials.filter((m) => (sysTab ? m.ownerId !== roleId : m.ownerId === roleId)).filter((m) => match(m.title));
  const bk = books.filter((m) => (sysTab ? m.ownerId !== roleId : m.ownerId === roleId)).filter((m) => match(m.title));
  const empty = (kind === "storyboard" ? sb.length : kind === "ui" ? ui.length : kind === "book" ? bk.length : mat.length) === 0;

  const title = kind === "storyboard" ? "Chọn Storyboard" : kind === "ui" ? "Chọn Giao diện" : kind === "book" ? "Chọn sách" : "Chọn học liệu";
  const TitleIcon = kind === "ui" ? Palette : kind === "material" ? BookOpen : kind === "book" ? BookText : LayoutList;

  const base = scope === "org" ? "/org" : "/creator";
  const openCreate = () => {
    if (kind === "storyboard") useModuleStart.getState().request({ module: "storyboard", scope, newTab: true });
    else if (kind === "ui") useModuleStart.getState().request({ module: "ui_system", scope, newTab: true });
    else window.open(`${base}/library`, "_blank", "noopener");
  };

  // Master–detail: chọn ở danh sách trái → xem trước phải → "Đính kèm".
  const ids = (kind === "storyboard" ? sb : kind === "ui" ? ui : kind === "book" ? bk : mat).map((x) => x.id);
  const effId = selId && ids.includes(selId) ? selId : ids[0];
  const selSb = sb.find((x) => x.id === effId);
  const selUi = ui.find((x) => x.id === effId);
  const selMat = mat.find((x) => x.id === effId);
  const selBk = bk.find((x) => x.id === effId);
  const onAttach = () => {
    if (kind === "storyboard" && selSb) onPickStoryboard(selSb);
    else if (kind === "ui" && selUi) onPickUiSystem(selUi);
    else if (kind === "book" && selBk) onPickBook(selBk);
    else if (kind === "material" && selMat) onPickMaterial(selMat);
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/30 p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-primary"><TitleIcon className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="truncate text-[11px] text-muted-foreground">Xem trước rồi đính kèm; bấm Gửi mới áp dụng{isModule ? " · chỉ chọn 1" : ""}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        {/* Tabs + search */}
        <div className="flex items-center gap-1 border-b border-border px-3">
          {([["system", "Kho hệ thống"], ["user", "Thư viện của tôi"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => { setTab(id); setSelId(null); }}
              className={cn("relative px-3 py-2.5 text-xs font-semibold transition", tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              {label}{tab === id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
          <input value={q} onChange={(e) => { setQ(e.target.value); setSelId(null); }} placeholder="Tìm theo tên…"
            className="ml-auto my-1.5 w-[150px] rounded-lg border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary" />
        </div>

        {/* Master–detail */}
        <div className="flex min-h-[280px] flex-1 overflow-hidden">
          {/* Danh sách trái */}
          <div className="w-[220px] shrink-0 space-y-1 overflow-y-auto border-r border-border p-2">
            {empty && <p className="px-1 py-12 text-center text-xs text-muted-foreground">Không có mục nào.</p>}
            {kind === "storyboard" && sb.map((it) => (
              <PickRow key={it.id} name={it.name} meta={`${it.storyboard.sections.flatMap((s) => s.items).length} khung`} icon={<LayoutList className="h-4 w-4 text-primary" />} selected={effId === it.id} onClick={() => setSelId(it.id)} />
            ))}
            {kind === "ui" && ui.map((it) => (
              <PickRow key={it.id} name={it.name} meta={it.source === "system" ? "Hệ thống" : "Của tôi"} icon={<span className="h-4 w-4 shrink-0 rounded border border-border" style={{ background: it.theme.accentSeed }} />} selected={effId === it.id} onClick={() => setSelId(it.id)} />
            ))}
            {kind === "material" && mat.map((m) => (
              <PickRow key={m.id} name={m.title} meta={MATERIAL_TYPE_LABELS[(m.materialSubtype ?? "document")]} icon={<BookOpen className="h-4 w-4 text-primary" />} selected={effId === m.id} onClick={() => setSelId(m.id)} />
            ))}
            {kind === "book" && bk.map((m) => (
              <PickRow key={m.id} name={m.title} meta="Sách" icon={<BookText className="h-4 w-4 text-primary" />} selected={effId === m.id} onClick={() => setSelId(m.id)} />
            ))}
          </div>

          {/* Xem trước phải */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!effId ? (
              <p className="py-12 text-center text-xs text-muted-foreground">Chọn một mục bên trái để xem trước.</p>
            ) : (
              <>
                {kind === "storyboard" && selSb && <StoryboardPreviewPane name={selSb.name} storyboard={selSb.storyboard} />}
                {kind === "ui" && selUi && <UiPreviewPane name={selUi.name} theme={selUi.theme} description={selUi.description} />}
                {kind === "material" && selMat && <ContentPreviewPane item={selMat} label={MATERIAL_TYPE_LABELS[(selMat.materialSubtype ?? "document")]} />}
                {kind === "book" && selBk && <ContentPreviewPane item={selBk} label="Sách" />}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            {isModule ? "Tạo mới" : "Mở Thư viện"}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={onClose}>Đóng</Button>
          <Button size="sm" className="gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary-hover" disabled={!effId} onClick={onAttach}>
            <Plus className="h-3.5 w-3.5" /> Đính kèm
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Hàng chọn + các khung xem trước cho LibraryPicker ─────────── */

function PickRow({ name, meta, icon, selected, onClick }: { name: string; meta?: string; icon: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full items-center gap-2 rounded-lg border p-2 text-left transition", selected ? "border-primary bg-accent" : "border-transparent hover:bg-muted")}>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-foreground">{name}</span>
        {meta && <span className="block truncate text-[10px] text-muted-foreground">{meta}</span>}
      </span>
    </button>
  );
}

function StoryboardPreviewPane({ name, storyboard }: { name: string; storyboard: Storyboard }) {
  const frames = storyboard.sections.flatMap((s) => s.items);
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{name}</p>
      <p className="mb-2 text-[11px] text-muted-foreground">{frames.length} khung cảnh</p>
      <div className="grid grid-cols-2 gap-2">
        {frames.map((f, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border">
            <div className="h-20 bg-cover bg-center" style={{ backgroundImage: `url("${sceneSrc(f.image)}")` }} />
            <p className="truncate px-2 py-1 text-[11px] font-medium text-foreground">{i + 1}. {f.title || f.intent}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UiPreviewPane({ name, theme, description }: { name: string; theme: CourseTheme; description?: string }) {
  const r = ramp(theme.accentSeed);
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{name}</p>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      <div className="mt-3 flex gap-1.5">
        {[r.soft, r.accent, r.strong].map((c) => <span key={c} className="h-8 w-12 rounded-md border border-border" style={{ background: c }} />)}
      </div>
      <div className="mt-3 rounded-xl border border-border p-3" style={{ background: theme.mode === "dark" ? "#0f1729" : "#ffffff" }}>
        <div className="text-lg font-extrabold" style={{ color: theme.accentSeed }}>Aa Tốc độ phản ứng</div>
        <div className="mt-2 flex gap-2">
          <span className="rounded-md px-3 py-1.5 text-xs font-semibold text-white" style={{ background: theme.accentSeed }}>Tiếp tục học</span>
          <span className="rounded-md border px-3 py-1.5 text-xs font-medium" style={{ borderColor: theme.accentSeed, color: theme.accentSeed }}>Làm bài tập</span>
        </div>
      </div>
    </div>
  );
}

function ContentPreviewPane({ item, label }: { item: ContentItem; label: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{item.title}</p>
      <p className="text-[11px] text-muted-foreground">{label}{item.subject ? ` · ${item.subject}` : ""}{item.grade ? ` · ${item.grade}` : ""}</p>
      {item.description && <p className="mt-2 text-xs leading-relaxed text-foreground">{item.description}</p>}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.tags.map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>)}
        </div>
      )}
    </div>
  );
}

/* ─── Preview nội dung cho popup xác nhận ───────────────────────── */

function QuizPreview({ items }: { items: NonNullable<ChatMessage["quizItems"]> }) {
  return (
    <div className="space-y-3">
      {items.map((q, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-sm font-medium text-foreground">{i + 1}. {q.content}</p>
          <ul className="mt-1.5 space-y-1">
            {q.quizOptions.map((opt, oi) => (
              <li key={oi} className={cn("flex items-center gap-1.5 text-xs", oi === q.quizCorrect ? "font-medium text-success" : "text-muted-foreground")}>
                {oi === q.quizCorrect ? <Check className="h-3.5 w-3.5 shrink-0" /> : <CircleDot className="h-3 w-3 shrink-0 opacity-40" />} {opt}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function MaterialPreview({ mat }: { mat: GeneratedMaterial }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{mat.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{mat.description}</p>
      <ul className="mt-2 space-y-1">
        {mat.highlights.map((h, i) => (<li key={i} className="flex items-start gap-1.5 text-xs text-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /> {h}</li>))}
      </ul>
    </div>
  );
}

function OutlinePreview({ outline }: { outline: CourseOutline }) {
  return (
    <div className="space-y-2">
      {outline.parts.map((p, pi) => (
        <div key={pi} className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-sm font-semibold text-foreground">Phần {pi + 1}: {p.title}</p>
          {p.chapters.map((ch, ci) => (
            <div key={ci} className="mt-1.5 pl-2">
              <p className="text-xs font-medium text-foreground">{ch.title}</p>
              <ul className="mt-0.5 space-y-0.5 pl-2">
                {ch.lessons.map((ls, li) => <li key={li} className="text-[11px] text-muted-foreground">• {ls.title}</li>)}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function LessonPlanPreview({ storyboard }: { storyboard: Storyboard }) {
  const frames = storyboard.sections.flatMap((s) => s.items);
  return (
    <div className="space-y-2">
      {frames.map((f, i) => (
        <div key={i} className="flex gap-2 rounded-lg border border-border bg-card p-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-primary">{i + 1}</span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">{f.title || BLOCK_LABELS[f.blockType] || f.blockType}</p>
            <p className="text-[11px] text-muted-foreground">{f.intent}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Message bubble ────────────────────────────────────────────── */

type ConfirmReq = { title: string; confirmLabel: string; preview: React.ReactNode; onConfirm: () => void };

function MessageBubble({
  message, onInsert, onInsertQuiz, onEmbedMaterial, onSaveMaterial, onBuildOutline, onFillLesson, onPreview, scope, onFollowup, busy,
}: {
  message: ChatMessage;
  onInsert: (id: string, html: string) => void;
  onInsertQuiz: (id: string, items: NonNullable<ChatMessage["quizItems"]>) => void;
  onEmbedMaterial: (id: string, mat: GeneratedMaterial) => void;
  onSaveMaterial: (id: string, mat: GeneratedMaterial) => void;
  onBuildOutline: (id: string, outline: CourseOutline) => void;
  onFillLesson: (id: string, storyboard: Storyboard, topic: string) => void;
  onPreview: (req: ConfirmReq) => void;
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
            <p className="flex items-center gap-1 text-[11px] font-medium text-success"><Check className="h-3.5 w-3.5" /> Đã đưa vào bài</p>
          ) : (
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs"
              onClick={() => onPreview({
                title: "Xem trước nội dung",
                confirmLabel: "Đưa vào bài",
                onConfirm: () => onInsert(message.id, message.insertContent!),
                preview: <div className="prose prose-sm max-w-none text-sm text-foreground" dangerouslySetInnerHTML={{ __html: message.insertContent! }} />,
              })}>
              <PenLine className="h-3.5 w-3.5" /> Xem trước & đưa vào bài
            </Button>
          )
        )}

        {message.quizItems && !message.streaming && (
          message.inserted ? (
            <p className="flex items-center gap-1 text-[11px] font-medium text-success"><Check className="h-3.5 w-3.5" /> Đã đưa vào bài</p>
          ) : (
            <div className="gk-pop rounded-xl border border-border bg-card p-2.5">
              <p className="text-[11px] font-semibold text-foreground">Xem trước · {message.quizItems.length} câu hỏi</p>
              <ol className="mt-1 space-y-0.5">
                {message.quizItems.slice(0, 2).map((q, i) => (
                  <li key={i} className="truncate text-[11px] text-muted-foreground">{i + 1}. {q.content}</li>
                ))}
                {message.quizItems.length > 2 && <li className="text-[10px] text-muted-foreground">+{message.quizItems.length - 2} câu nữa…</li>}
              </ol>
              <Button size="sm" className="mt-2 h-7 gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary-hover"
                onClick={() => onPreview({
                  title: "Xem trước câu hỏi",
                  confirmLabel: "Đưa vào bài",
                  onConfirm: () => onInsertQuiz(message.id, message.quizItems!),
                  preview: <QuizPreview items={message.quizItems!} />,
                })}>
                <PenLine className="h-3.5 w-3.5" /> Xem trước & đưa vào bài
              </Button>
            </div>
          )
        )}

        {message.courseOutline && !message.streaming && (
          message.courseBuilt ? (
            <p className="flex items-center gap-1 text-[11px] font-medium text-success"><Check className="h-3.5 w-3.5" /> Đã dựng vào khoá học</p>
          ) : (
            <div className="gk-pop rounded-xl border border-border bg-card p-2.5">
              <p className="text-[11px] font-semibold text-foreground">Xem trước dàn ý · {message.courseOutline.parts.length} phần</p>
              <ul className="mt-1 space-y-0.5">
                {message.courseOutline.parts.slice(0, 3).map((p, i) => (
                  <li key={i} className="truncate text-[11px] text-muted-foreground">▸ {p.title}</li>
                ))}
                {message.courseOutline.parts.length > 3 && <li className="text-[10px] text-muted-foreground">+{message.courseOutline.parts.length - 3} phần nữa…</li>}
              </ul>
              <Button size="sm" className="mt-2 h-7 gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary-hover"
                onClick={() => onPreview({
                  title: "Xem trước dàn ý khoá học",
                  confirmLabel: "Dựng vào khoá học",
                  onConfirm: () => onBuildOutline(message.id, message.courseOutline!),
                  preview: <OutlinePreview outline={message.courseOutline!} />,
                })}>
                <PenLine className="h-3.5 w-3.5" /> Xem trước & dựng khoá học
              </Button>
            </div>
          )
        )}

        {message.lessonPlan && !message.streaming && (
          message.lessonFilled ? (
            <p className="flex items-center gap-1 text-[11px] font-medium text-success"><Check className="h-3.5 w-3.5" /> Đã đưa vào bài</p>
          ) : (
            <div className="gk-pop rounded-xl border border-border bg-card p-2.5">
              <p className="text-[11px] font-semibold text-foreground">Xem trước nội dung · {message.lessonPlan.storyboard.sections.flatMap((s) => s.items).length} khối</p>
              <ul className="mt-1 space-y-0.5">
                {message.lessonPlan.storyboard.sections.flatMap((s) => s.items).slice(0, 3).map((it, i) => (
                  <li key={i} className="truncate text-[11px] text-muted-foreground">• {it.title || it.intent}</li>
                ))}
              </ul>
              <Button size="sm" className="mt-2 h-7 gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary-hover"
                onClick={() => onPreview({
                  title: "Xem trước nội dung bài",
                  confirmLabel: "Đưa vào bài",
                  onConfirm: () => onFillLesson(message.id, message.lessonPlan!.storyboard, message.lessonPlan!.topic),
                  preview: <LessonPlanPreview storyboard={message.lessonPlan!.storyboard} />,
                })}>
                <PenLine className="h-3.5 w-3.5" /> Xem trước & đưa vào bài
              </Button>
            </div>
          )
        )}

        {message.material && (
          <div className="gk-pop rounded-xl border border-border bg-card p-3">
            <p className="text-xs font-semibold text-foreground">{message.material.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{message.material.description}</p>
            <ul className="mt-2 space-y-1">
              {message.material.highlights.map((h, i) => (<li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /> {h}</li>))}
            </ul>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {message.materialInserted ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-success"><Check className="h-3.5 w-3.5" /> Đã đưa vào bài</span>
              ) : (
                <Button size="sm" className="h-7 gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary-hover"
                  onClick={() => onPreview({
                    title: "Xem trước học liệu",
                    confirmLabel: "Đưa vào bài giảng",
                    onConfirm: () => onEmbedMaterial(message.id, message.material!),
                    preview: <MaterialPreview mat={message.material!} />,
                  })}>
                  <ArrowUpRight className="h-3.5 w-3.5" /> Đưa vào bài giảng
                </Button>
              )}
              {message.materialSaved ? (
                <Button asChild size="sm" variant="ghost" className="h-7 gap-1.5 text-xs">
                  <Link to={scope === "org" ? "/org/library" : "/creator/library"}><Library className="h-3.5 w-3.5" /> Mở kho</Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => onSaveMaterial(message.id, message.material!)}>
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

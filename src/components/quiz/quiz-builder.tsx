import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  Pencil,
  Settings,
  ChevronLeft,
  ChevronRight,
  Move,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuizSidebar } from "@/components/quiz/palette";
import { QuestionCard } from "@/components/quiz/question-card";
import { QuestionStrip } from "@/components/quiz/question-strip";
import { AiPanel } from "@/components/quiz/ai-panel";
import { QuizSettingsDialog } from "@/components/quiz/quiz-settings";
import { PublishSheet } from "@/components/publish-sheet";
import { toast } from "sonner";
import { useQuiz } from "@/stores/quiz";
import { useContent } from "@/stores/content";
import type { ContentItem, MaterialType, QuestionType } from "@/lib/types";

/** Dashboard paths the builder can return to, scoped to the workspace it was opened from. */
export type QuizBuilderBackTo = "/creator/dashboard" | "/org/dashboard";

/* ─── Canvas drop zone ─────────────────────────────────────────── */

function CanvasDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-1 flex-col items-center justify-center p-4 transition ${
        isOver ? "bg-accent ring-2 ring-inset ring-dashed ring-primary" : ""
      }`}
    >
      {children}
    </div>
  );
}

/* ─── Type labels for confirmation dialog ─────────────────────── */

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Trắc nghiệm",
  essay: "Tự luận",
  matching: "Ghép đôi",
  dropbox: "Hộp thả",
  drag_drop: "Kéo thả",
  ordering: "Sắp xếp",
  video: "Trả lời video",
  audio: "Trả lời ghi âm",
  recognition: "Nhận dạng",
  marker: "Điểm đánh dấu",
};

/* ─── Main component ───────────────────────────────────────────── */

/**
 * Shared quiz builder rendered by both `/creator/builder/quiz/$id` and
 * `/org/builder/quiz/$id`. The only scope difference is where the back/publish
 * navigation returns to (`backTo`).
 */
export function QuizBuilder({ quizId: id, backTo }: { quizId: string; backTo: QuizBuilderBackTo }) {
  const navigate = useNavigate();
  const init = useQuiz((s) => s.init);
  const addBlank = useQuiz((s) => s.addBlank);
  const replaceQuestion = useQuiz((s) => s.replaceQuestion);
  const updateQuestion = useQuiz((s) => s.updateQuestion);
  const reorder = useQuiz((s) => s.reorder);
  const questions = useQuiz((s) => s.questionsByQuiz[id] ?? []);
  const blankIds = useQuiz((s) => s.blankIds);
  const item = useContent((s) => s.items.find((x) => x.id === id));
  const updateItem = useContent((s) => s.updateItem);

  const [title, setTitle] = useState(item?.title ?? "Bộ đề chưa đặt tên");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeType, setActiveType] = useState<QuestionType | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<ContentItem | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Confirmation dialog state
  const [confirmReplace, setConfirmReplace] = useState<{
    questionId: string;
    newType: QuestionType;
  } | null>(null);

  useEffect(() => {
    init(id);
  }, [id, init]);

  useEffect(() => {
    if (item) setTitle(item.title);
  }, [item?.id]); // eslint-disable-line

  // Clamp active index
  useEffect(() => {
    if (activeIndex >= questions.length && questions.length > 0) {
      setActiveIndex(questions.length - 1);
    }
  }, [questions.length, activeIndex]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as Record<string, unknown> | undefined;
    setActiveDragId(String(e.active.id));
    if (data?.source === "palette") {
      setActiveType((data.questionType as QuestionType) ?? null);
      setActiveMaterial(null);
    } else if (data?.source === "material") {
      setActiveType(null);
      setActiveMaterial((data.item as ContentItem) ?? null);
    } else {
      setActiveType(null);
      setActiveMaterial(null);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const active = e.active;
    const over = e.over;
    setActiveDragId(null);
    setActiveType(null);
    setActiveMaterial(null);
    if (!over) return;

    const data = active.data.current as Record<string, unknown> | undefined;

    // Strip reorder: dragging a strip item over another strip item
    if (data?.source === "strip" && over.data.current?.source === "strip") {
      reorder(id, String(active.id), String(over.id));
      return;
    }

    // Palette → canvas: add or replace question
    if (data?.source === "palette" && data.questionType) {
      const newType = data.questionType as QuestionType;
      const current = questions[activeIndex];
      if (current && blankIds.has(current.id)) {
        // Blank slot → fill directly
        replaceQuestion(id, current.id, newType);
      } else if (current) {
        // Existing question → ask for confirmation
        setConfirmReplace({ questionId: current.id, newType });
      }
      return;
    }

    // Material → canvas: attach to the active question
    if (data?.source === "material" && data.item) {
      attachMaterial(data.item as ContentItem);
      return;
    }

    // Strip → canvas reorder fallback
    if (data?.source === "strip" && over.id === "canvas-drop") {
      // dropped on canvas, no action needed
      return;
    }

    // Generic reorder
    if (over.id !== active.id) {
      reorder(id, String(active.id), String(over.id));
    }
  };

  const saveTitle = () => {
    if (item && title.trim() && title !== item.title) updateItem(id, { title: title.trim() });
  };

  /** From sidebar click: if current is blank, fill it; otherwise add blank + fill */
  const handleAddFromSidebar = (type: QuestionType) => {
    const current = questions[activeIndex];
    if (current && blankIds.has(current.id)) {
      replaceQuestion(id, current.id, type);
    } else if (current) {
      setConfirmReplace({ questionId: current.id, newType: type });
    } else {
      // No questions at all — create one directly
      const blankId = addBlank(id);
      replaceQuestion(id, blankId, type);
      setActiveIndex(0);
    }
  };

  /** Attach a learning material to the currently-selected question (multiple allowed) */
  const attachMaterial = (material: ContentItem) => {
    const current = questions[activeIndex];
    if (!current || blankIds.has(current.id)) {
      toast.info("Hãy chọn hoặc tạo câu hỏi trước khi chèn học liệu");
      return;
    }
    const existing = current.attachments ?? [];
    if (existing.some((a) => a.materialId === material.id)) {
      toast.info("Học liệu này đã được đính kèm");
      return;
    }
    const next = [
      ...existing,
      {
        materialId: material.id,
        title: material.title,
        type: (material.materialSubtype ?? "document") as MaterialType,
        thumbnailColor: material.thumbnailColor,
        fileExtension: material.fileExtension,
      },
    ];
    updateQuestion(id, current.id, { attachments: next });
    toast.success(`Đã chèn học liệu "${material.title}" (tổng ${next.length})`);
  };

  /** "+ Thêm" → add blank page */
  const handleAddBlank = () => {
    addBlank(id);
    setActiveIndex(questions.length); // new blank is at end
  };

  const handleConfirmReplace = () => {
    if (confirmReplace) {
      replaceQuestion(id, confirmReplace.questionId, confirmReplace.newType);
      setConfirmReplace(null);
    }
  };

  const currentQuestion = questions[activeIndex] ?? null;
  const isCurrentBlank = currentQuestion ? blankIds.has(currentQuestion.id) : false;
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < questions.length - 1;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-screen flex-col bg-muted/20">
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Quay lại"
            onClick={() => navigate({ to: backTo })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            Q
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              aria-label="Tiêu đề bộ đề"
              className="min-w-0 flex-1 rounded bg-transparent px-1 py-1 text-sm font-semibold text-foreground outline-none hover:bg-muted/50 focus:bg-muted/50"
            />
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Mở trang xem trước trong tab mới (demo)")}
            >
              <Eye className="mr-1.5 h-4 w-4" /> Xem trước
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-1.5 h-4 w-4" /> Thiết lập
            </Button>
            <Button
              size="sm"
              className="bg-primary text-white hover:bg-primary-hover"
              onClick={() => setPublishOpen(true)}
            >
              Xuất bản
            </Button>
          </div>
        </div>

        {/* ─── Body ───────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1">
          {/* Left: Icon Rail + Expandable Panel */}
          <div className="hidden shrink-0 md:flex">
            <QuizSidebar onAddQuestion={handleAddFromSidebar} onAttachMaterial={attachMaterial} />
          </div>

          {/* Center: Canvas + Strip */}
          <div className="flex min-w-0 flex-1 flex-col bg-muted/30">
            <CanvasDropZone>
              {questions.length === 0 ? (
                <EmptyCanvasPlaceholder />
              ) : isCurrentBlank ? (
                <BlankPagePlaceholder index={activeIndex} />
              ) : currentQuestion ? (
                <div className="flex w-full max-w-3xl items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!canPrev}
                    onClick={() => setActiveIndex((i) => i - 1)}
                    className="hidden shrink-0 sm:flex"
                    aria-label="Câu trước"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.15 }}
                      >
                        <QuestionCard question={currentQuestion} index={activeIndex} quizId={id} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!canNext}
                    onClick={() => setActiveIndex((i) => i + 1)}
                    className="hidden shrink-0 sm:flex"
                    aria-label="Câu sau"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              ) : null}
            </CanvasDropZone>

            {/* Bottom question strip */}
            <QuestionStrip
              questions={questions}
              activeIndex={activeIndex}
              blankIds={blankIds}
              onSelect={setActiveIndex}
              onAdd={handleAddBlank}
            />
          </div>

          {/* Right: AI Panel */}
          <div className="hidden w-[280px] shrink-0 border-l border-border lg:block">
            <AiPanel quizId={id} />
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragId && activeType && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="rounded-md border border-primary bg-card px-3 py-2 text-xs font-medium text-primary shadow-lg"
          >
            + {TYPE_LABELS[activeType]}
          </motion.div>
        )}
        {activeDragId && activeMaterial && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="max-w-[220px] truncate rounded-md border border-success bg-card px-3 py-2 text-xs font-medium text-success shadow-lg"
          >
            📎 {activeMaterial.title}
          </motion.div>
        )}
      </DragOverlay>

      {/* Replace confirmation dialog */}
      <Dialog open={!!confirmReplace} onOpenChange={(o) => !o && setConfirmReplace(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Thay đổi loại câu hỏi?
            </DialogTitle>
            <DialogDescription>
              Câu hỏi hiện tại sẽ bị xóa và thay thế bằng{" "}
              <strong>{confirmReplace ? TYPE_LABELS[confirmReplace.newType] : ""}</strong> mới. Thao
              tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmReplace(null)}>
              Hủy
            </Button>
            <Button
              className="bg-primary text-white hover:bg-primary-hover"
              onClick={handleConfirmReplace}
            >
              Thay thế
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings dialog */}
      <QuizSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Publish sheet */}
      <PublishSheet
        open={publishOpen}
        onOpenChange={setPublishOpen}
        contentId={id}
        title={title}
        onPublished={() => navigate({ to: backTo })}
      />
    </DndContext>
  );
}

/* ─── Placeholder components ───────────────────────────────────── */

function EmptyCanvasPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full max-h-[420px] w-full max-w-2xl flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card text-center"
    >
      <Move className="h-8 w-8 text-muted-foreground/50" />
      <div className="mt-3 text-base font-medium text-foreground">✦ Bắt đầu tạo bộ đề</div>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Bấm <strong>+ Thêm</strong> ở thanh dưới để tạo trang mới, sau đó kéo loại câu hỏi vào.
      </p>
    </motion.div>
  );
}

function BlankPagePlaceholder({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-full max-h-[480px] w-full max-w-2xl flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-card text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
        <Move className="h-8 w-8 text-primary" />
      </div>
      <div className="mt-4 text-lg font-semibold text-foreground">Trang {index + 1}</div>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Kéo loại câu hỏi bạn muốn tạo từ thanh công cụ bên trái vào không gian này, hoặc bấm vào loại
        câu hỏi để thêm.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(["multiple_choice", "essay", "matching", "drag_drop"] as QuestionType[]).map((t) => (
          <span
            key={t}
            className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            {TYPE_LABELS[t]}
          </span>
        ))}
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          +6 loại khác
        </span>
      </div>
    </motion.div>
  );
}

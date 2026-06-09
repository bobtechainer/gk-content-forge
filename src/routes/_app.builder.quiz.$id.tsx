import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionPalette } from "@/components/quiz/palette";
import { QuestionCard } from "@/components/quiz/question-card";
import { AiPanel } from "@/components/quiz/ai-panel";
import { PublishSheet } from "@/components/publish-sheet";
import { useQuiz } from "@/stores/quiz";
import { useContent } from "@/stores/content";
import type { QuestionType } from "@/lib/types";

export const Route = createFileRoute("/_app/builder/quiz/$id")({
  head: () => ({ meta: [{ title: "Soạn bộ đề — GK Studio" }] }),
  component: QuizBuilder,
});

function CanvasDropZone({ children, empty }: { children: React.ReactNode; empty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });
  return (
    <div
      ref={setNodeRef}
      className={`mx-auto max-w-3xl space-y-3 rounded-xl p-6 transition ${
        isOver ? "bg-[#EFF6FF] ring-2 ring-dashed ring-[#2563EB]" : ""
      } ${empty ? "min-h-[420px]" : ""}`}
    >
      {children}
    </div>
  );
}

function QuizBuilder() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const init = useQuiz((s) => s.init);
  const addQuestion = useQuiz((s) => s.addQuestion);
  const reorder = useQuiz((s) => s.reorder);
  const questions = useQuiz((s) => s.questionsByQuiz[id] ?? []);
  const item = useContent((s) => s.items.find((x) => x.id === id));
  const updateItem = useContent((s) => s.updateItem);

  const [title, setTitle] = useState(item?.title ?? "Bộ đề chưa đặt tên");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<QuestionType | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  useEffect(() => {
    init(id);
  }, [id, init]);

  useEffect(() => {
    if (item) setTitle(item.title);
  }, [item?.id]); // eslint-disable-line

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as { source?: string; questionType?: QuestionType } | undefined;
    setActiveId(String(e.active.id));
    if (data?.source === "palette") setActiveType(data.questionType ?? null);
    else setActiveType(null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const active = e.active;
    const over = e.over;
    setActiveId(null);
    setActiveType(null);
    if (!over) return;
    const data = active.data.current as { source?: string; questionType?: QuestionType } | undefined;
    if (data?.source === "palette" && data.questionType) {
      addQuestion(id, data.questionType);
      return;
    }
    if (over.id !== active.id) {
      reorder(id, String(active.id), String(over.id));
    }
  };

  const saveTitle = () => {
    if (item && title.trim() && title !== item.title) updateItem(id, { title: title.trim() });
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-base font-semibold text-foreground outline-none hover:bg-muted/50 focus:bg-muted/50"
          />
          <Button variant="outline" size="sm">
            <Eye className="mr-1.5 h-4 w-4" /> Xem trước
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-1.5 h-4 w-4" /> Thiết lập
          </Button>
          <Button
            size="sm"
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            onClick={() => setPublishOpen(true)}
          >
            Xuất bản
          </Button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="w-[240px] shrink-0">
            <QuestionPalette isDragActive={activeType !== null} />
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/30">
            <CanvasDropZone empty={questions.length === 0}>
              {questions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-[380px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card text-center"
                >
                  <div className="text-base font-medium text-foreground">Canvas trống</div>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Kéo loại câu hỏi từ thanh bên trái hoặc bấm + Thêm bên dưới.
                  </p>
                </motion.div>
              ) : (
                <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                  {questions.map((q, idx) => (
                    <QuestionCard key={q.id} question={q} index={idx} quizId={id} />
                  ))}
                </SortableContext>
              )}
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  className="border-dashed"
                  onClick={() => addQuestion(id, "multiple_choice")}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Thêm câu hỏi
                </Button>
              </div>
            </CanvasDropZone>
          </div>

          <AiPanel quizId={id} />
        </div>
      </div>

      <DragOverlay>
        {activeId && activeType && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="rounded-md border border-[#2563EB] bg-card px-3 py-2 text-xs font-medium text-[#2563EB] shadow-lg"
          >
            + Thêm câu hỏi mới
          </motion.div>
        )}
      </DragOverlay>

      <PublishSheet
        open={publishOpen}
        onOpenChange={setPublishOpen}
        contentId={id}
        title={title}
        onPublished={() => navigate({ to: "/dashboard" })}
      />
    </DndContext>
  );
}
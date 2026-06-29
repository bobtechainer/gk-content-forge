import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAMPLE_COURSE } from "./course-sample";
import { hashBlocks } from "@/lib/publish/snapshot";

/* ─── Block Types ──────────────────────────────────────────────── */

export type CourseBlockType =
  | "text"
  | "image"
  | "video"
  | "callout"
  | "divider"
  | "embed"
  | "code"
  | "math"
  | "columns"
  | "quiz"
  | "html"
  | "section"
  | "accordion"
  | "process"
  | "flashcards";

export type CalloutVariant = "info" | "tip" | "warning" | "danger";
export type BlockLayout = "centered" | "full";
export type BlockAnimation = "none" | "fade-up" | "parallax" | "progressive";

export interface CourseBlock {
  id: string;
  type: CourseBlockType;
  content: string;
  /** Callout variant */
  calloutVariant?: CalloutVariant;
  /** Embed: linked material id */
  embedMaterialId?: string;
  /** Embed: material title (denormalized) */
  embedTitle?: string;
  /** Embed: material type label */
  embedType?: string;
  /** Code: language */
  codeLanguage?: string;
  /** Image/Video: alt text or caption */
  caption?: string;
  /** Layout mode: centered (default) or full-width */
  layout?: BlockLayout;
  /** Scroll animation style */
  animation?: BlockAnimation;
  /** Columns block: number of columns (2+) */
  columnCount?: number;
  /** Columns block: child blocks per column */
  columnChildren?: CourseBlock[][];

  /* ─── Interactive blocks ─────────────────────────────── */
  /** Quiz: answer options (content holds the question) */
  quizOptions?: string[];
  /** Quiz: index of the correct option */
  quizCorrect?: number;
  /** Quiz: explanation shown after answering */
  quizExplanation?: string;
  /* html block: `content` holds raw HTML rendered inside a sandboxed iframe. */
  /* section block: `content` holds the section/part title (gates progression). */

  /** Accordion block: list of collapsible items */
  accordionItems?: { id: string; title: string; body: string }[];
  /** Process block: ordered steps */
  processSteps?: { id: string; title: string; body: string }[];
  /** Flashcards block: front/back card pairs */
  flashcards?: { id: string; front: string; back: string }[];
  /** Embed: direct URL for PDF or web page (bypasses material picker) */
  embedUrl?: string;
  /** Embed: aspect ratio for the iframe */
  embedAspect?: "16:9" | "4:3" | "auto";
  /** Marks this block as AI-generated (for display badge) */
  aiGenerated?: boolean;
}

/* ─── Lesson / Chapter / Course ────────────────────────────────── */

export interface CourseLesson {
  id: string;
  title: string;
  /** Chương cha (null = không thuộc chương nào — nằm thẳng trong Phần hoặc ở gốc). */
  chapterId: string | null;
  /** Phần cha khi bài nằm thẳng trong Phần (chỉ dùng khi chapterId = null). */
  partId?: string | null;
  /** Thứ tự trong nhóm anh em (để xếp xen kẽ Chương/Bài). */
  order?: number;
  blocks: CourseBlock[];
  /** Thời điểm xuất bản gần nhất (timestamp ms). Không có = chưa xuất bản. */
  publishedAt?: number;
  /** Hash của blocks tại lần xuất bản gần nhất. */
  publishedHash?: string;
}

export interface CourseChapter {
  id: string;
  title: string;
  courseId: string;
  /** Phần cha (null/undefined = chương ở gốc). */
  partId?: string | null;
  /** Thứ tự trong nhóm anh em. */
  order?: number;
}

/** Phần — cấp folder cao nhất (chứa Chương hoặc Bài). */
export interface CoursePart {
  id: string;
  title: string;
  order?: number;
}

export interface CourseData {
  parts?: CoursePart[];
  chapters: CourseChapter[];
  lessons: CourseLesson[];
}

/* ─── Cây cấu trúc dẫn xuất (Phần → Chương/Bài → Bài) ──────────────── */

export type CourseNodeType = "part" | "chapter" | "lesson";

export interface CourseTreeNode {
  id: string;
  type: CourseNodeType;
  title: string;
  /** Chỉ lesson mới có (tham chiếu để đọc trạng thái xuất bản…). */
  lesson?: CourseLesson;
  children: CourseTreeNode[];
}

type ParentRef = { id: string; type: "part" | "chapter" } | null;

interface OrderedRef {
  id: string;
  type: CourseNodeType;
  title: string;
  order: number;
  lesson?: CourseLesson;
}

/** Lấy danh sách con (đã sắp xếp) của một parent (null = gốc). */
function childrenOf(data: CourseData, parent: ParentRef): OrderedRef[] {
  const parts = data.parts ?? [];
  const refs: OrderedRef[] = [];
  const fallback = (i: number, base: number) => base + i; // giữ thứ tự mảng khi thiếu order

  if (parent === null) {
    parts.forEach((p, i) => refs.push({ id: p.id, type: "part", title: p.title, order: p.order ?? fallback(i, 0) }));
    data.chapters.forEach((c, i) => {
      if (!c.partId) refs.push({ id: c.id, type: "chapter", title: c.title, order: c.order ?? fallback(i, 1000) });
    });
    data.lessons.forEach((l, i) => {
      if (!l.chapterId && !l.partId) refs.push({ id: l.id, type: "lesson", title: l.title, order: l.order ?? fallback(i, 2000), lesson: l });
    });
  } else if (parent.type === "part") {
    data.chapters.forEach((c, i) => {
      if (c.partId === parent.id) refs.push({ id: c.id, type: "chapter", title: c.title, order: c.order ?? fallback(i, 0) });
    });
    data.lessons.forEach((l, i) => {
      if (!l.chapterId && l.partId === parent.id) refs.push({ id: l.id, type: "lesson", title: l.title, order: l.order ?? fallback(i, 1000), lesson: l });
    });
  } else {
    data.lessons.forEach((l, i) => {
      if (l.chapterId === parent.id) refs.push({ id: l.id, type: "lesson", title: l.title, order: l.order ?? fallback(i, 0), lesson: l });
    });
  }
  return refs.sort((a, b) => a.order - b.order);
}

/** Dựng cây cấu trúc đầy đủ từ CourseData. */
export function buildCourseTree(data: CourseData): CourseTreeNode[] {
  const toNode = (r: OrderedRef): CourseTreeNode => ({
    id: r.id,
    type: r.type,
    title: r.title,
    lesson: r.lesson,
    children:
      r.type === "lesson"
        ? []
        : childrenOf(data, { id: r.id, type: r.type as "part" | "chapter" }).map(toNode),
  });
  return childrenOf(data, null).map(toNode);
}

/** Order kế tiếp cho một nhóm anh em (lớn hơn mọi order hiện có). */
function childOrderNext(data: CourseData, parent: ParentRef): number {
  const sibs = childrenOf(data, parent);
  return sibs.length ? Math.max(...sibs.map((s) => s.order)) + 1 : 0;
}

/** Đánh số lại order cho nhóm anh em của `parent`, chèn `movedId` trước `beforeId`. */
function renumberSiblings(
  data: CourseData,
  parent: ParentRef,
  movedId: string,
  beforeId: string | null,
): CourseData {
  const sibs = childrenOf(data, parent).map((s) => s.id);
  const order = sibs.filter((id) => id !== movedId);
  const idx = beforeId ? order.indexOf(beforeId) : -1;
  if (idx >= 0) order.splice(idx, 0, movedId);
  else order.push(movedId);
  const orderMap = new Map(order.map((id, i) => [id, i] as const));
  const reorder = <T extends { id: string; order?: number }>(arr: T[]): T[] =>
    arr.map((x) => (orderMap.has(x.id) ? { ...x, order: orderMap.get(x.id)! } : x));
  return {
    ...data,
    parts: data.parts ? reorder(data.parts) : data.parts,
    chapters: reorder(data.chapters),
    lessons: reorder(data.lessons),
  };
}

/* ─── Store ─────────────────────────────────────────────────────── */

interface CourseState {
  courseData: Record<string, CourseData>;
  activeLessonId: string | null;

  init: (courseId: string, options?: { empty?: boolean }) => void;

  // Chapter CRUD
  addChapter: (courseId: string, title?: string) => string;
  renameChapter: (courseId: string, chapterId: string, title: string) => void;
  deleteChapter: (courseId: string, chapterId: string) => void;
  reorderChapters: (courseId: string, fromId: string, toId: string) => void;

  // Lesson CRUD
  addLesson: (courseId: string, chapterId: string, title?: string) => string;
  renameLesson: (courseId: string, lessonId: string, title: string) => void;
  deleteLesson: (courseId: string, lessonId: string) => void;
  reorderLessons: (courseId: string, fromId: string, toId: string) => void;
  setActiveLesson: (lessonId: string | null) => void;

  // Publish state per lesson
  publishLesson: (courseId: string, lessonId: string) => void;
  getLessonPublishState: (courseId: string, lessonId: string) => "never" | "published" | "dirty";

  // Block CRUD
  addBlock: (courseId: string, lessonId: string, type: CourseBlockType, atIndex?: number) => string;
  updateBlock: (courseId: string, lessonId: string, blockId: string, patch: Partial<CourseBlock>) => void;
  deleteBlock: (courseId: string, lessonId: string, blockId: string) => void;
  duplicateBlock: (courseId: string, lessonId: string, blockId: string) => string;
  reorderBlocks: (courseId: string, lessonId: string, fromId: string, toId: string) => void;
  moveBlockToIndex: (courseId: string, lessonId: string, blockId: string, newIndex: number) => void;

  // Cây cấu trúc linh hoạt (Phần/Chương/Bài)
  addPart: (courseId: string, title?: string) => string;
  addChapterUnder: (courseId: string, partId: string | null, title?: string) => string;
  addLessonUnder: (
    courseId: string,
    parent: { id: string; type: "part" | "chapter" } | null,
    title?: string,
  ) => string;
  renameNode: (courseId: string, nodeId: string, type: CourseNodeType, title: string) => void;
  deleteNode: (courseId: string, nodeId: string, type: CourseNodeType) => void;
  moveNode: (
    courseId: string,
    nodeId: string,
    type: CourseNodeType,
    newParent: { id: string; type: "part" | "chapter" } | null,
    beforeId?: string | null,
  ) => void;
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function defaultBlock(type: CourseBlockType): CourseBlock {
  const id = makeId("blk");
  const base: CourseBlock = { id, type, content: "", layout: "centered", animation: "fade-up" };
  switch (type) {
    case "text":
      return { ...base, content: "" };
    case "image":
      return { ...base, content: "", caption: "" };
    case "video":
      return { ...base, content: "", caption: "" };
    case "callout":
      return { ...base, content: "", calloutVariant: "info" };
    case "divider":
      return { ...base };
    case "embed":
      return { ...base, embedMaterialId: "", embedTitle: "", embedType: "" };
    case "code":
      return { ...base, content: "", codeLanguage: "javascript" };
    case "math":
      return { ...base, content: "" };
    case "columns":
      return { ...base, columnCount: 2, columnChildren: [[], []] };
    case "quiz":
      return {
        ...base,
        content: "Câu hỏi của bạn?",
        quizOptions: ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C"],
        quizCorrect: 0,
        quizExplanation: "",
      };
    case "html":
      return {
        ...base,
        layout: "full",
        content:
          "<!-- Dán HTML tương tác vào đây (mô phỏng, bảng tuần hoàn 3D, v.v.) -->\n<div style=\"padding:24px;font-family:sans-serif;text-align:center;color:#475569\">Khối HTML nâng cao — bấm để soạn nội dung.</div>",
      };
    case "section":
      return { ...base, animation: "none", content: "Phần mới" };
    case "accordion":
      return { ...base, accordionItems: [{ id: `item_${Date.now()}`, title: "Mục 1", body: "" }] };
    case "process":
      return { ...base, processSteps: [{ id: `step_${Date.now()}`, title: "Bước 1", body: "" }] };
    case "flashcards":
      return { ...base, flashcards: [{ id: `card_${Date.now()}`, front: "Mặt trước", back: "Mặt sau" }] };
    default:
      return base;
  }
}

function reorderArray<T extends { id: string }>(arr: T[], fromId: string, toId: string): T[] {
  const from = arr.findIndex((x) => x.id === fromId);
  const to = arr.findIndex((x) => x.id === toId);
  if (from < 0 || to < 0 || from === to) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Deep-clone a block, regenerating its id and copying nested arrays so a
 *  duplicate never shares mutable state (column children, quiz options) with the
 *  original. */
export function cloneBlockDeep(block: CourseBlock): CourseBlock {
  return {
    ...block,
    id: makeId("blk"),
    columnChildren: block.columnChildren?.map((col) => col.map((child) => cloneBlockDeep(child))),
    quizOptions: block.quizOptions ? [...block.quizOptions] : undefined,
    accordionItems: block.accordionItems ? block.accordionItems.map((item) => ({ ...item })) : undefined,
    processSteps: block.processSteps ? block.processSteps.map((step) => ({ ...step })) : undefined,
    flashcards: block.flashcards ? block.flashcards.map((card) => ({ ...card })) : undefined,
  };
}

/* ─── Sections ──────────────────────────────────────────────────────
 * A lesson is a flat list of blocks. A block of type "section" marks the
 * start of a new gated part; its `content` is the part title. Blocks before
 * the first marker form an untitled intro part. The preview renders one part
 * at a time and only unlocks the next once the current part is completed.
 * ────────────────────────────────────────────────────────────────── */

export interface LessonSection {
  /** Title from the "section" marker, or null for the intro part. */
  title: string | null;
  /** Content blocks of this part (the marker itself is not included). */
  blocks: CourseBlock[];
}

export function partitionSections(blocks: CourseBlock[]): LessonSection[] {
  const sections: LessonSection[] = [];
  let current: LessonSection = { title: null, blocks: [] };
  let started = false;
  for (const block of blocks) {
    if (block.type === "section") {
      // Only push the leading intro part if it actually had content.
      if (started || current.blocks.length > 0) sections.push(current);
      current = { title: block.content || "Phần mới", blocks: [] };
      started = true;
    } else {
      current.blocks.push(block);
    }
  }
  sections.push(current);
  return sections;
}


/** Build a blank course with 1 chapter, 1 empty lesson, and 0 blocks. */
function emptyCourse(courseId: string): CourseData {
  const chId = makeId("ch");
  return {
    chapters: [{ id: chId, title: "Chương 1", courseId }],
    lessons: [{ id: makeId("ls"), title: "Bài 1", chapterId: chId, blocks: [] }],
  };
}

/** Build a fresh copy of the sample course for a given courseId, with unique
 *  chapter/lesson/block ids so different courses never alias the same objects. */
function cloneSampleCourse(courseId: string): CourseData {
  const chapterIdMap: Record<string, string> = {};
  const chapters: CourseChapter[] = SAMPLE_COURSE.chapters.map((ch) => {
    const id = makeId("ch");
    chapterIdMap[ch.id] = id;
    return { ...ch, id, courseId };
  });
  const lessons: CourseLesson[] = SAMPLE_COURSE.lessons.map((ls) => ({
    ...ls,
    id: makeId("ls"),
    chapterId: ls.chapterId ? (chapterIdMap[ls.chapterId] ?? ls.chapterId) : ls.chapterId,
    blocks: ls.blocks.map((b) => cloneBlockDeep(b)),
  }));
  return { chapters, lessons };
}

/** Migrate KHÔNG hủy: giữ nguyên courseData người dùng đã soạn. */
export function courseMigrate(
  persisted: unknown,
  _version: number,
): Pick<CourseState, "courseData" | "activeLessonId"> {
  const p = (persisted ?? {}) as Partial<Pick<CourseState, "courseData" | "activeLessonId">>;
  return {
    courseData: p.courseData ?? {},
    activeLessonId: p.activeLessonId ?? null,
  };
}

export const useCourse = create<CourseState>()(
  persist(
    (set, get) => ({
      courseData: {},
      activeLessonId: null,

      init: (courseId, options) => {
        const existing = get().courseData[courseId];
        if (!existing) {
          const data = options?.empty ? emptyCourse(courseId) : cloneSampleCourse(courseId);
          set({
            courseData: { ...get().courseData, [courseId]: data },
            activeLessonId: data.lessons[0]?.id ?? null,
          });
        } else {
          // activeLessonId is a single global value; make sure it points at a
          // lesson that actually belongs to THIS course (otherwise switching
          // courses would leave a stale id and a blank canvas).
          const cur = get().activeLessonId;
          const valid = cur != null && existing.lessons.some((l) => l.id === cur);
          if (!valid) {
            set({ activeLessonId: existing.lessons[0]?.id ?? null });
          }
        }
      },

      // ─── Chapter CRUD ──────────────────────────────
      addChapter: (courseId, title) => {
        const id = makeId("ch");
        const data = get().courseData[courseId];
        if (!data) return id;
        const chapter: CourseChapter = {
          id,
          title: title ?? `Chương ${data.chapters.length + 1}`,
          courseId,
        };
        set({
          courseData: {
            ...get().courseData,
            [courseId]: { ...data, chapters: [...data.chapters, chapter] },
          },
        });
        return id;
      },

      renameChapter: (courseId, chapterId, title) => {
        const data = get().courseData[courseId];
        if (!data) return;
        set({
          courseData: {
            ...get().courseData,
            [courseId]: {
              ...data,
              chapters: data.chapters.map((ch) =>
                ch.id === chapterId ? { ...ch, title } : ch,
              ),
            },
          },
        });
      },

      deleteChapter: (courseId, chapterId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessonIds = data.lessons.filter((l) => l.chapterId === chapterId).map((l) => l.id);
        const active = get().activeLessonId;
        set({
          courseData: {
            ...get().courseData,
            [courseId]: {
              ...data,
              chapters: data.chapters.filter((ch) => ch.id !== chapterId),
              lessons: data.lessons.filter((l) => l.chapterId !== chapterId),
            },
          },
          activeLessonId: active && lessonIds.includes(active) ? null : active,
        });
      },

      reorderChapters: (courseId, fromId, toId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        set({
          courseData: {
            ...get().courseData,
            [courseId]: { ...data, chapters: reorderArray(data.chapters, fromId, toId) },
          },
        });
      },

      // ─── Lesson CRUD ──────────────────────────────
      addLesson: (courseId, chapterId, title) => {
        const id = makeId("ls");
        const data = get().courseData[courseId];
        if (!data) return id;
        const existingInChapter = data.lessons.filter((l) => l.chapterId === chapterId);
        const lesson: CourseLesson = {
          id,
          title: title ?? `Bài ${existingInChapter.length + 1}`,
          chapterId,
          blocks: [],
        };
        // Insert lesson after last lesson of this chapter
        const lastIndex = data.lessons.map((l) => l.chapterId).lastIndexOf(chapterId);
        const insertAt = lastIndex >= 0 ? lastIndex + 1 : data.lessons.length;
        const nextLessons = [...data.lessons];
        nextLessons.splice(insertAt, 0, lesson);
        set({
          courseData: {
            ...get().courseData,
            [courseId]: { ...data, lessons: nextLessons },
          },
          activeLessonId: id,
        });
        return id;
      },

      renameLesson: (courseId, lessonId, title) => {
        const data = get().courseData[courseId];
        if (!data) return;
        set({
          courseData: {
            ...get().courseData,
            [courseId]: {
              ...data,
              lessons: data.lessons.map((l) =>
                l.id === lessonId ? { ...l, title } : l,
              ),
            },
          },
        });
      },

      deleteLesson: (courseId, lessonId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const active = get().activeLessonId;
        const remaining = data.lessons.filter((l) => l.id !== lessonId);
        set({
          courseData: {
            ...get().courseData,
            [courseId]: { ...data, lessons: remaining },
          },
          activeLessonId: active === lessonId ? (remaining[0]?.id ?? null) : active,
        });
      },

      reorderLessons: (courseId, fromId, toId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const fromL = data.lessons.find((l) => l.id === fromId);
        const toL = data.lessons.find((l) => l.id === toId);
        if (!fromL || !toL) return;
        // When dropping onto a lesson in another chapter, adopt that chapter so
        // the moved lesson re-renders under the destination group (not snapped
        // back to its original chapter).
        let lessons = data.lessons;
        if (fromL.chapterId !== toL.chapterId) {
          lessons = lessons.map((l) => (l.id === fromId ? { ...l, chapterId: toL.chapterId } : l));
        }
        lessons = reorderArray(lessons, fromId, toId);
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },

      setActiveLesson: (lessonId) => set({ activeLessonId: lessonId }),

      // ─── Publish state per lesson ─────────────────
      publishLesson: (courseId, lessonId) =>
        set((state) => {
          const data = state.courseData[courseId];
          if (!data) return {};
          const lesson = data.lessons.find((l) => l.id === lessonId);
          if (!lesson) return {};
          const now = Date.now();
          const hash = hashBlocks(lesson.blocks);
          return {
            courseData: {
              ...state.courseData,
              [courseId]: {
                ...data,
                lessons: data.lessons.map((l) =>
                  l.id === lessonId ? { ...l, publishedAt: now, publishedHash: hash } : l,
                ),
              },
            },
          };
        }),

      getLessonPublishState: (courseId, lessonId) => {
        const data = get().courseData[courseId];
        if (!data) return "never";
        const lesson = data.lessons.find((l) => l.id === lessonId);
        if (!lesson) return "never";
        if (!lesson.publishedAt) return "never";
        const currentHash = hashBlocks(lesson.blocks);
        return currentHash === lesson.publishedHash ? "published" : "dirty";
      },

      // ─── Block CRUD ──────────────────────────────
      addBlock: (courseId, lessonId, type, atIndex) => {
        const data = get().courseData[courseId];
        if (!data) return "";
        const block = defaultBlock(type);
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const blocks = [...l.blocks];
          if (atIndex !== undefined) blocks.splice(atIndex, 0, block);
          else blocks.push(block);
          return { ...l, blocks };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
        return block.id;
      },

      updateBlock: (courseId, lessonId, blockId, patch) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          return {
            ...l,
            blocks: l.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
          };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },

      deleteBlock: (courseId, lessonId, blockId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          return { ...l, blocks: l.blocks.filter((b) => b.id !== blockId) };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },

      duplicateBlock: (courseId, lessonId, blockId) => {
        const data = get().courseData[courseId];
        if (!data) return "";
        let newId = "";
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const idx = l.blocks.findIndex((b) => b.id === blockId);
          if (idx < 0) return l;
          const clone = cloneBlockDeep(l.blocks[idx]);
          newId = clone.id;
          const blocks = [...l.blocks];
          blocks.splice(idx + 1, 0, clone);
          return { ...l, blocks };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
        return newId;
      },

      reorderBlocks: (courseId, lessonId, fromId, toId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          return { ...l, blocks: reorderArray(l.blocks, fromId, toId) };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },

      moveBlockToIndex: (courseId, lessonId, blockId, newIndex) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const blocks = [...l.blocks];
          const oldIndex = blocks.findIndex((b) => b.id === blockId);
          if (oldIndex < 0) return l;
          const [moved] = blocks.splice(oldIndex, 1);
          blocks.splice(newIndex, 0, moved);
          return { ...l, blocks };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },

      // ─── Cây cấu trúc linh hoạt (Phần/Chương/Bài) ──────────
      addPart: (courseId, title) => {
        const id = makeId("part");
        const data = get().courseData[courseId];
        if (!data) return id;
        const parts = data.parts ?? [];
        const order = childOrderNext(data, null);
        set({
          courseData: {
            ...get().courseData,
            [courseId]: { ...data, parts: [...parts, { id, title: title ?? `Phần ${parts.length + 1}`, order }] },
          },
        });
        return id;
      },

      addChapterUnder: (courseId, partId, title) => {
        const id = makeId("ch");
        const data = get().courseData[courseId];
        if (!data) return id;
        const parent = partId ? ({ id: partId, type: "part" } as const) : null;
        const order = childOrderNext(data, parent);
        const chapter: CourseChapter = {
          id,
          title: title ?? `Chương ${data.chapters.length + 1}`,
          courseId,
          partId: partId ?? null,
          order,
        };
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, chapters: [...data.chapters, chapter] } },
        });
        return id;
      },

      addLessonUnder: (courseId, parent, title) => {
        const id = makeId("ls");
        const data = get().courseData[courseId];
        if (!data) return id;
        const order = childOrderNext(data, parent);
        const chapterId = parent?.type === "chapter" ? parent.id : null;
        const partId = parent?.type === "part" ? parent.id : null;
        const lesson: CourseLesson = { id, title: title ?? "Bài mới", chapterId, partId, order, blocks: [] };
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons: [...data.lessons, lesson] } },
          activeLessonId: id,
        });
        return id;
      },

      renameNode: (courseId, nodeId, type, title) => {
        const data = get().courseData[courseId];
        if (!data) return;
        let next: CourseData = data;
        if (type === "part") next = { ...data, parts: (data.parts ?? []).map((p) => (p.id === nodeId ? { ...p, title } : p)) };
        else if (type === "chapter") next = { ...data, chapters: data.chapters.map((c) => (c.id === nodeId ? { ...c, title } : c)) };
        else next = { ...data, lessons: data.lessons.map((l) => (l.id === nodeId ? { ...l, title } : l)) };
        set({ courseData: { ...get().courseData, [courseId]: next } });
      },

      deleteNode: (courseId, nodeId, type) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const active = get().activeLessonId;
        let parts = data.parts ?? [];
        let chapters = data.chapters;
        let lessons = data.lessons;
        let nextActive = active;
        if (type === "lesson") {
          lessons = lessons.filter((l) => l.id !== nodeId);
          if (active === nodeId) nextActive = lessons[0]?.id ?? null;
        } else if (type === "chapter") {
          const chap = chapters.find((c) => c.id === nodeId);
          const toPart = chap?.partId ?? null;
          lessons = lessons.map((l) => (l.chapterId === nodeId ? { ...l, chapterId: null, partId: toPart } : l));
          chapters = chapters.filter((c) => c.id !== nodeId);
        } else {
          chapters = chapters.map((c) => (c.partId === nodeId ? { ...c, partId: null } : c));
          lessons = lessons.map((l) => (!l.chapterId && l.partId === nodeId ? { ...l, partId: null } : l));
          parts = parts.filter((p) => p.id !== nodeId);
        }
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, parts, chapters, lessons } },
          activeLessonId: nextActive,
        });
      },

      moveNode: (courseId, nodeId, type, newParent, beforeId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        let chapters = data.chapters;
        let lessons = data.lessons;
        const parts = data.parts ?? [];
        if (type === "lesson") {
          const chapterId = newParent?.type === "chapter" ? newParent.id : null;
          const partId = newParent?.type === "part" ? newParent.id : null;
          lessons = lessons.map((l) => (l.id === nodeId ? { ...l, chapterId, partId } : l));
        } else if (type === "chapter") {
          if (newParent?.type === "chapter") return; // chương không nằm trong chương
          const partId = newParent?.type === "part" ? newParent.id : null;
          chapters = chapters.map((c) => (c.id === nodeId ? { ...c, partId } : c));
        } else if (newParent !== null) {
          return; // phần luôn ở gốc
        }
        const reassigned: CourseData = { ...data, parts, chapters, lessons };
        const next = renumberSiblings(reassigned, newParent, nodeId, beforeId ?? null);
        set({ courseData: { ...get().courseData, [courseId]: next } });
      },
    }),
    {
      name: "gk-course",
      version: 3,
      migrate: (persisted, version) => courseMigrate(persisted, version) as CourseState,
    },
  ),
);

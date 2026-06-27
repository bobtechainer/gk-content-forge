import { beforeEach, describe, expect, it } from "vitest";
import { useCourse, partitionSections, courseMigrate, cloneBlockDeep } from "./course";
import type { CourseBlock } from "./course";
import { builderHref } from "@/lib/builder-url";

const CID = "test-course";

function blk(id: string, type: CourseBlock["type"], content = ""): CourseBlock {
  return { id, type, content };
}

function reset() {
  useCourse.setState({ courseData: {}, activeLessonId: null });
}

describe("course store", () => {
  beforeEach(reset);

  it("seeds each course with unique ids (no cross-course aliasing)", () => {
    useCourse.getState().init("a");
    useCourse.getState().init("b");
    const a = useCourse.getState().courseData["a"];
    const b = useCourse.getState().courseData["b"];

    const aLessonIds = a.lessons.map((l) => l.id);
    const bLessonIds = b.lessons.map((l) => l.id);
    expect(aLessonIds.some((id) => bLessonIds.includes(id))).toBe(false);

    const aBlockIds = a.lessons.flatMap((l) => l.blocks.map((x) => x.id));
    const bBlockIds = b.lessons.flatMap((l) => l.blocks.map((x) => x.id));
    expect(aBlockIds.some((id) => bBlockIds.includes(id))).toBe(false);
  });

  it("resets activeLessonId when it doesn't belong to the opened course", () => {
    useCourse.getState().init("a");
    const aFirst = useCourse.getState().courseData["a"].lessons[0].id;
    expect(useCourse.getState().activeLessonId).toBe(aFirst);

    useCourse.getState().init("b");
    const bFirst = useCourse.getState().courseData["b"].lessons[0].id;

    // Simulate a stale active id from course "a", then re-open "b"
    useCourse.getState().setActiveLesson(aFirst);
    useCourse.getState().init("b");
    expect(useCourse.getState().activeLessonId).toBe(bFirst);
  });

  it("moveBlockToIndex places the block at the requested index", () => {
    useCourse.getState().init(CID);
    const lesson = useCourse.getState().courseData[CID].lessons[0];
    const ids = lesson.blocks.map((b) => b.id);
    const last = ids[ids.length - 1];

    useCourse.getState().moveBlockToIndex(CID, lesson.id, last, 0);

    const after = useCourse.getState().courseData[CID].lessons[0].blocks.map((b) => b.id);
    expect(after[0]).toBe(last);
    expect(after).toHaveLength(ids.length);
  });

  it("duplicateBlock deep-clones columns children with fresh ids", () => {
    useCourse.getState().init(CID);
    const lesson = useCourse.getState().courseData[CID].lessons[0];
    const colId = useCourse.getState().addBlock(CID, lesson.id, "columns");
    useCourse.getState().updateBlock(CID, lesson.id, colId, {
      columnChildren: [[{ id: "child_1", type: "text", content: "hi" }], []],
    });

    useCourse.getState().duplicateBlock(CID, lesson.id, colId);

    const blocks = useCourse.getState().courseData[CID].lessons[0].blocks;
    const orig = blocks.find((b) => b.id === colId)!;
    const dup = blocks[blocks.findIndex((b) => b.id === colId) + 1];

    expect(dup.type).toBe("columns");
    expect(dup.id).not.toBe(orig.id);
    expect(dup.columnChildren).not.toBe(orig.columnChildren);
    expect(dup.columnChildren![0]).not.toBe(orig.columnChildren![0]);
    expect(dup.columnChildren![0][0].id).not.toBe("child_1");
    expect(dup.columnChildren![0][0].content).toBe("hi");
  });

  it("reorderLessons moves a lesson into the target chapter (cross-chapter)", () => {
    useCourse.getState().init(CID);
    const data = useCourse.getState().courseData[CID];
    const ch1 = data.chapters[0].id;
    const ch2 = data.chapters[1].id;
    const fromLesson = data.lessons.find((l) => l.chapterId === ch1)!;
    const toLesson = data.lessons.find((l) => l.chapterId === ch2)!;

    useCourse.getState().reorderLessons(CID, fromLesson.id, toLesson.id);

    const moved = useCourse.getState().courseData[CID].lessons.find((l) => l.id === fromLesson.id)!;
    expect(moved.chapterId).toBe(ch2);
  });

  it("seeds the Tốc độ phản ứng sample with gated sections (no reveal/slider)", () => {
    useCourse.getState().init(CID);
    const blocks = useCourse.getState().courseData[CID].lessons[0].blocks;
    const types = new Set(blocks.map((b) => b.type));
    expect(types.has("section")).toBe(true);
    expect(types.has("html")).toBe(true);
    expect(types.has("reveal" as never)).toBe(false);
    expect(types.has("slider" as never)).toBe(false);
    // The journey is split into several gated parts.
    expect(partitionSections(blocks).length).toBeGreaterThan(1);
  });

  it("cloneBlockDeep deep-copies accordionItems so mutations don't alias", () => {
    const orig: CourseBlock = {
      id: "blk_1",
      type: "accordion",
      content: "",
      accordionItems: [{ id: "item_1", title: "T1", body: "B1" }],
    };
    const cloned = cloneBlockDeep(orig);
    expect(cloned.accordionItems).not.toBe(orig.accordionItems);
    // Mutate the clone — original must be unaffected
    cloned.accordionItems![0].title = "changed";
    expect(orig.accordionItems![0].title).toBe("T1");
  });

  it("cloneBlockDeep deep-copies processSteps so mutations don't alias", () => {
    const orig: CourseBlock = {
      id: "blk_2",
      type: "process",
      content: "",
      processSteps: [{ id: "step_1", title: "S1", body: "B1" }],
    };
    const cloned = cloneBlockDeep(orig);
    expect(cloned.processSteps).not.toBe(orig.processSteps);
    cloned.processSteps![0].title = "changed";
    expect(orig.processSteps![0].title).toBe("S1");
  });

  it("cloneBlockDeep deep-copies flashcards so mutations don't alias", () => {
    const orig: CourseBlock = {
      id: "blk_3",
      type: "flashcards",
      content: "",
      flashcards: [{ id: "card_1", front: "F1", back: "Bk1" }],
    };
    const cloned = cloneBlockDeep(orig);
    expect(cloned.flashcards).not.toBe(orig.flashcards);
    cloned.flashcards![0].front = "changed";
    expect(orig.flashcards![0].front).toBe("F1");
  });
});

describe("partitionSections", () => {
  it("returns one untitled part when there are no section markers", () => {
    const blocks = [blk("a", "text"), blk("b", "quiz")];
    const parts = partitionSections(blocks);
    expect(parts).toHaveLength(1);
    expect(parts[0].title).toBeNull();
    expect(parts[0].blocks.map((b) => b.id)).toEqual(["a", "b"]);
  });

  it("starts the first part at a leading marker and excludes markers from blocks", () => {
    const blocks = [
      blk("s1", "section", "Phần 1"),
      blk("a", "text"),
      blk("s2", "section", "Phần 2"),
      blk("b", "quiz"),
      blk("c", "text"),
    ];
    const parts = partitionSections(blocks);
    expect(parts.map((p) => p.title)).toEqual(["Phần 1", "Phần 2"]);
    expect(parts[0].blocks.map((b) => b.id)).toEqual(["a"]);
    expect(parts[1].blocks.map((b) => b.id)).toEqual(["b", "c"]);
    expect(parts.flatMap((p) => p.blocks).some((b) => b.type === "section")).toBe(false);
  });

  it("keeps a leading intro part before the first marker", () => {
    const blocks = [blk("intro", "text"), blk("s1", "section", "Phần 1"), blk("a", "text")];
    const parts = partitionSections(blocks);
    expect(parts).toHaveLength(2);
    expect(parts[0].title).toBeNull();
    expect(parts[0].blocks.map((b) => b.id)).toEqual(["intro"]);
  });
});

describe("course migrate is non-destructive", () => {
  it("preserves persisted courseData across a version bump", () => {
    const persisted = {
      courseData: { c1: { chapters: [], lessons: [{ id: "l1", title: "Của tôi", chapterId: "ch", blocks: [] }] } },
      activeLessonId: "l1",
    };
    const out = courseMigrate(persisted, 2);
    expect(out.courseData.c1.lessons[0].title).toBe("Của tôi");
    expect(out.activeLessonId).toBe("l1");
  });

  it("tolerates empty/undefined persisted (fresh install)", () => {
    const out = courseMigrate(undefined, 2);
    expect(out.courseData).toEqual({});
    expect(out.activeLessonId).toBeNull();
  });
});

describe("builderHref", () => {
  it("builds concrete builder URLs per content type and scope", () => {
    expect(builderHref("creator", { id: "x1", category: "course" })).toBe("/creator/builder/course/x1");
    expect(builderHref("creator", { id: "x2", category: "book" })).toBe("/creator/builder/book/x2");
    expect(builderHref("creator", { id: "x3", category: "learning_material", materialSubtype: "quiz" })).toBe(
      "/creator/builder/quiz/x3",
    );
    expect(builderHref("org", { id: "x4", category: "learning_material", materialSubtype: "document" })).toBe(
      "/org/builder/material/x4",
    );
  });
});

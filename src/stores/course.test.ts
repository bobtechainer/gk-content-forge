import { beforeEach, describe, expect, it } from "vitest";
import { useCourse, splitIntoSections, collectQuizIds } from "./course";
import type { CourseBlock } from "./course";

const CID = "test-course";

function block(id: string, type: CourseBlock["type"], extra: Partial<CourseBlock> = {}): CourseBlock {
  return { id, type, content: "", ...extra };
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
});

describe("gated preview sections", () => {
  it("splits blocks on dividers and drops the divider blocks", () => {
    const blocks = [
      block("a", "text"),
      block("b", "quiz"),
      block("d1", "divider"),
      block("c", "text"),
      block("d2", "divider"),
      block("e", "embed"),
    ];
    const sections = splitIntoSections(blocks);
    expect(sections).toHaveLength(3);
    expect(sections[0].map((b) => b.id)).toEqual(["a", "b"]);
    expect(sections[1].map((b) => b.id)).toEqual(["c"]);
    expect(sections[2].map((b) => b.id)).toEqual(["e"]);
    expect(sections.flat().some((b) => b.type === "divider")).toBe(false);
  });

  it("treats a divider-less lesson as a single section, and never returns empty", () => {
    expect(splitIntoSections([block("a", "text")])).toHaveLength(1);
    expect(splitIntoSections([])).toEqual([[]]);
    // Leading/trailing dividers don't produce empty sections.
    expect(splitIntoSections([block("d", "divider"), block("a", "text"), block("d2", "divider")])).toEqual([
      [expect.objectContaining({ id: "a" })],
    ]);
  });

  it("collects quiz ids, recursing into columns", () => {
    const blocks = [
      block("q1", "quiz"),
      block("t", "text"),
      block("col", "columns", {
        columnChildren: [[block("q2", "quiz")], [block("t2", "text"), block("q3", "quiz")]],
      }),
    ];
    expect(collectQuizIds(blocks)).toEqual(["q1", "q2", "q3"]);
  });

  it("seeds a multi-section demo lesson with no reveal/slider blocks and a live HTML embed", () => {
    useCourse.setState({ courseData: {}, activeLessonId: null });
    useCourse.getState().init("demo-seed-check");
    const lesson = useCourse.getState().courseData["demo-seed-check"].lessons[0];

    // Reveal/slider were removed entirely.
    const types = new Set(lesson.blocks.map((b) => b.type));
    expect(types.has("reveal" as never)).toBe(false);
    expect(types.has("slider" as never)).toBe(false);

    // Dividers split the lesson into several gated sections.
    expect(splitIntoSections(lesson.blocks).length).toBeGreaterThan(1);

    // The advanced material is an embed block carrying real HTML.
    const htmlEmbed = lesson.blocks.find((b) => b.type === "embed" && b.embedHtml);
    expect(htmlEmbed?.embedHtml).toContain("<");
  });
});

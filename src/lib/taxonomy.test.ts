import { describe, expect, test } from "vitest";
import {
  CONTENT_TAXONOMY,
  CREATION_CATEGORIES,
  LEARNING_MATERIAL_SUBTYPES,
  LEARNING_MATERIAL_TYPES,
  MATERIAL_TYPE_LABELS,
  getBuilderPath,
  getCreationCategory,
  getCreationLabel,
  getDefaultAppPath,
  getMaterialZone,
  getRoleHomePath,
} from "./taxonomy";

describe("Content Studio v2 taxonomy", () => {
  test("uses three top-level creation categories", () => {
    expect(CREATION_CATEGORIES.map((category) => category.id)).toEqual([
      "book",
      "course",
      "learning_material",
    ]);
    expect(CONTENT_TAXONOMY.map((category) => category.label)).toEqual([
      "Sách",
      "Khóa học",
      "Học liệu",
    ]);
  });

  test("keeps nine learning material subtypes under Học liệu", () => {
    expect(LEARNING_MATERIAL_TYPES).toEqual([
      "quiz",
      "lesson",
      "advanced",
      "scorm",
      "document",
      "video",
      "image",
      "audio",
      "3d_vr",
    ]);
    expect(
      CREATION_CATEGORIES.find((category) => category.id === "learning_material")?.children,
    ).toEqual(LEARNING_MATERIAL_SUBTYPES);
  });

  test("maps material types to Vietnamese labels and zones", () => {
    expect(MATERIAL_TYPE_LABELS.book).toBe("Sách điện tử");
    expect(MATERIAL_TYPE_LABELS.course).toBe("Khóa học");
    expect(MATERIAL_TYPE_LABELS.quiz).toBe("Bộ đề");
    expect(getMaterialZone("book")).toBe("product");
    expect(getMaterialZone("quiz")).toBe("learning_material");
    expect(getMaterialZone("video")).toBe("learning_material");
  });

  test("maps material types to creation categories and builder paths", () => {
    expect(getCreationCategory("book")).toBe("book");
    expect(getCreationCategory("course")).toBe("course");
    expect(getCreationCategory("scorm")).toBe("learning_material");
    expect(getBuilderPath("book")).toBe("/builder/book/$id");
    expect(getBuilderPath("course")).toBe("/builder/course/$id");
    expect(getBuilderPath("quiz")).toBe("/builder/quiz/$id");
    expect(getBuilderPath("audio")).toBe("/builder/material/$id");
    expect(getCreationLabel("audio")).toBe("Âm thanh");
  });

  test("routes account types to the correct app shell", () => {
    expect(getDefaultAppPath("personal")).toBe("/creator/dashboard");
    expect(getDefaultAppPath("organization")).toBe("/org/dashboard");
    expect(getDefaultAppPath("admin")).toBe("/admin/dashboard");
  });

  test("getRoleHomePath đưa từng vai trò về màn mặc định", () => {
    expect(getRoleHomePath("admin")).toBe("/admin/dashboard");
    expect(getRoleHomePath("teacher")).toBe("/creator/dashboard");
    expect(getRoleHomePath("verified_teacher")).toBe("/creator/dashboard");
    expect(getRoleHomePath("publisher")).toBe("/org/dashboard");
    expect(getRoleHomePath("reviewer")).toBe("/reviewer/queue");
    expect(getRoleHomePath("student")).toBe("/student/home");
    expect(getRoleHomePath("school")).toBe("/school/dashboard");
    // Tổ trưởng nay là tài khoản giáo viên (schoolRole "dept_head"); nhà trường chỉ còn vai trò quản lý.
    expect(getRoleHomePath("teacher", "dept_head")).toBe("/creator/dashboard");
  });
});

import {
  AudioLines,
  BookOpen,
  Box,
  FileCode2,
  FileQuestion,
  FileText,
  GraduationCap,
  Image,
  Layers3,
  PlaySquare,
  ScrollText,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { AccountType, CreationCategory, LearningMaterialSubtype, MaterialType, RoleId, SchoolRole } from "./types";

export type ContentCategoryId = CreationCategory;
export type LearningMaterialSubtypeId = LearningMaterialSubtype;
export type MaterialZone = "product" | "learning_material";

export interface TaxonomyNode<TId extends string = string> {
  id: TId;
  label: string;
  description: string;
  icon: LucideIcon;
  children: TaxonomyNode[];
}

export const LEARNING_MATERIAL_TYPES = [
  "quiz",
  "lesson",
  "advanced",
  "scorm",
  "document",
  "video",
  "image",
  "audio",
  "3d_vr",
] as const satisfies readonly LearningMaterialSubtype[];

export const LEARNING_MATERIAL_SUBTYPES: TaxonomyNode<LearningMaterialSubtype>[] = [
  {
    id: "quiz",
    label: "Bộ đề",
    description: "Câu hỏi, kiểm tra, luyện tập.",
    icon: FileQuestion,
    children: [],
  },
  {
    id: "lesson",
    label: "Bài giảng",
    description: "PDF, DOCX, PPTX hoặc bài học tương tác.",
    icon: ScrollText,
    children: [],
  },
  {
    id: "advanced",
    label: "Học liệu nâng cao",
    description: "Gói HTML/ZIP tương tác nâng cao.",
    icon: Layers3,
    children: [],
  },
  {
    id: "scorm",
    label: "SCORM/xAPI",
    description: "Gói SCORM để tích hợp LMS.",
    icon: Box,
    children: [],
  },
  {
    id: "document",
    label: "Tài liệu",
    description: "PDF, DOCX, TXT, XLSX.",
    icon: FileText,
    children: [],
  },
  {
    id: "video",
    label: "Video",
    description: "MP4, MOV, AVI hoặc link YouTube.",
    icon: Video,
    children: [],
  },
  {
    id: "image",
    label: "Hình ảnh",
    description: "JPG, PNG, SVG, GIF, WEBP.",
    icon: Image,
    children: [],
  },
  {
    id: "audio",
    label: "Âm thanh",
    description: "MP3, WAV, OGG, M4A.",
    icon: AudioLines,
    children: [],
  },
  {
    id: "3d_vr",
    label: "3D/VR",
    description: "GLB, GLTF, OBJ, FBX.",
    icon: PlaySquare,
    children: [],
  },
];

export const CREATION_CATEGORIES: TaxonomyNode<CreationCategory>[] = [
  {
    id: "book",
    label: "Sách",
    description: "Sách điện tử, giáo trình, tài liệu nhiều chương.",
    icon: BookOpen,
    children: [],
  },
  {
    id: "course",
    label: "Khóa học",
    description: "Lộ trình học có bài học, kiểm tra và chứng nhận.",
    icon: GraduationCap,
    children: [],
  },
  {
    id: "learning_material",
    label: "Học liệu",
    description: "9 loại học liệu nhỏ được hỗ trợ.",
    icon: Layers3,
    children: LEARNING_MATERIAL_SUBTYPES,
  },
];

export const CONTENT_TAXONOMY = CREATION_CATEGORIES;

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  book: "Sách điện tử",
  course: "Khóa học",
  quiz: "Bộ đề",
  lesson: "Bài giảng",
  advanced: "Học liệu nâng cao",
  scorm: "SCORM/xAPI",
  document: "Tài liệu",
  video: "Video",
  image: "Hình ảnh",
  audio: "Âm thanh",
  "3d_vr": "3D/VR",
};

export const MATERIAL_TYPE_ICONS: Record<MaterialType, LucideIcon> = {
  book: BookOpen,
  course: GraduationCap,
  quiz: FileQuestion,
  lesson: ScrollText,
  advanced: Layers3,
  scorm: FileCode2,
  document: FileText,
  video: Video,
  image: Image,
  audio: AudioLines,
  "3d_vr": Box,
};

export const getMaterialZone = (materialType: MaterialType): MaterialZone =>
  materialType === "book" || materialType === "course" ? "product" : "learning_material";

export const getCreationCategory = (materialType: MaterialType): CreationCategory => {
  if (materialType === "book" || materialType === "course") return materialType;
  return "learning_material";
};

export const getDefaultAppPath = (accountType: AccountType) => {
  if (accountType === "organization" || accountType === "Doanh nghiệp")
    return "/org/dashboard" as const;
  if (accountType === "admin" || accountType === "Admin") return "/admin/dashboard" as const;
  return "/creator/dashboard" as const;
};

export const getBuilderPath = (materialType: MaterialType) => {
  if (materialType === "book") return "/builder/book/$id" as const;
  if (materialType === "course") return "/builder/course/$id" as const;
  if (materialType === "quiz") return "/builder/quiz/$id" as const;
  return "/builder/material/$id" as const;
};

export const getCreationLabel = (materialType: MaterialType) => MATERIAL_TYPE_LABELS[materialType];

export const getRoleHomePath = (roleId: RoleId, schoolRole?: SchoolRole): string => {
  switch (roleId) {
    case "admin":
      return "/admin/dashboard";
    case "publisher":
      return "/org/dashboard";
    case "reviewer":
      return "/reviewer/queue";
    case "student":
      return "/student/home";
    case "school":
      return "/school/dashboard";
    case "teacher":
    case "verified_teacher":
    default:
      return "/creator/dashboard";
  }
};

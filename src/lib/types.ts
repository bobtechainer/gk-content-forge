export type RoleId = "teacher" | "verified_teacher" | "publisher" | "admin";

export interface Account {
  id: RoleId;
  name: string;
  shortName: string;
  accountType: "Cá nhân" | "Doanh nghiệp" | "Admin";
  verified: "none" | "L1" | "L2" | "admin";
  avatarColor: string;
  bio: string;
  followers: number;
}

export type ContentStatus = "draft" | "published" | "pending" | "rejected";
export type ContentType = "quiz" | "material";
export type Platform = "national" | "ebooks";

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  ownerId: RoleId;
  createdAt: string;
  views: number;
  likes: number;
  shares: number;
  thumbnailColor: string;
  subject: string;
  grade: string;
  platforms: Platform[];
  tags: string[];
  description: string;
}

export type QuestionType =
  | "multiple_choice"
  | "essay"
  | "matching"
  | "dropbox"
  | "drag_drop"
  | "ordering"
  | "video"
  | "audio"
  | "recognition"
  | "marker";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  essayAnswer?: string;
  pairs?: { id: string; left: string; right: string }[];
  duration: number;
  points: number;
  required: boolean;
}
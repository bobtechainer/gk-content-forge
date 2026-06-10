export type RoleId = "teacher" | "verified_teacher" | "publisher" | "admin";
export type AccountType =
  | "personal"
  | "organization"
  | "admin"
  | "Cá nhân"
  | "Doanh nghiệp"
  | "Admin";
export type VerificationStatus =
  | "none"
  | "pending"
  | "verified"
  | "rejected"
  | "admin"
  | "L1"
  | "L2";
export type ContentStatus = "draft" | "published" | "pending" | "rejected";
export type Platform = "national" | "ebooks";
export type OrgRole = "owner" | "manager" | "editor";

export type LearningMaterialSubtype =
  | "quiz"
  | "lesson"
  | "advanced"
  | "scorm"
  | "document"
  | "video"
  | "image"
  | "audio"
  | "3d_vr";

export type MaterialType = "book" | "course" | LearningMaterialSubtype;
export type CreationCategory = "book" | "course" | "learning_material";
export type LegacyContentType = "quiz" | "material";
export type ContentType = CreationCategory | LegacyContentType;

export interface OrgMember {
  email: string;
  name: string;
  role: OrgRole;
  joinedAt: string;
}

export interface OrgMembership {
  orgId: RoleId;
  orgName: string;
  orgShortName: string;
  orgColor: string;
  role: OrgRole;
}

export interface Account {
  id: RoleId;
  name: string;
  shortName: string;
  accountType: AccountType;
  verified: VerificationStatus;
  avatarColor: string;
  bio: string;
  followers: number;
  managers?: OrgMember[];
  businessLicense?: string;
  website?: string;
  email?: string;
  /** Organizations this personal account belongs to (with create permissions). */
  orgMemberships?: OrgMembership[];
}

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  legacyType?: LegacyContentType;
  category: CreationCategory;
  materialType?: MaterialType;
  materialSubtype?: LearningMaterialSubtype;
  status: ContentStatus;
  ownerId: RoleId;
  ownerName?: string;
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
  fileExtension?: string;
  fileName?: string;
}

export interface VerificationChecklist {
  credentials: boolean;
  minMaterials: boolean;
  minViews: boolean;
  profileComplete: boolean;
  businessLicense?: boolean;
  domainEmail?: boolean;
}

export interface VerificationRequest {
  id: string;
  applicantId: RoleId;
  accountType: AccountType;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  documents: string[];
  reason?: string;
  materialsCount: number;
  views: number;
  accountAgeDays: number;
}

export type ReportReason = "copyright" | "inappropriate" | "spam" | "inaccurate" | "other";

export interface ContentReport {
  id: string;
  contentId: string;
  contentTitle: string;
  reason: ReportReason;
  reporterName: string;
  reportedAt: string;
  status: "open" | "resolved" | "dismissed";
  note?: string;
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

# Kế hoạch triển khai — 6 vai trò & màn hình còn thiếu (gk-content-forge)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng đủ 6 vai trò (System Admin, Reviewer, Teacher, Student, School, Content Partner) cho prototype "Trường học số", bổ sung mọi màn hình còn thiếu + mã định danh nội dung + khung chương trình + lớp học/giao bài, dùng mock-data + Zustand, tuân thủ design system `/mobifone-ui`.

**Architecture:** Giữ 3 nhóm route hiện có (`admin`/`creator`/`org`) + thêm 3 nhóm mới (`reviewer`/`student`/`school`), tái dùng `ContentStudioShell` (đọc `roleId` từ session để chọn nav). Foundation (types + 4 module dữ liệu thuần + nav/route scaffold + 7 tài khoản demo) làm trước và **TDD đầy đủ** vì có logic kiểm thử được; các màn hình là thành phần trình bày dùng lại primitive shadcn + shared components, kiểm chứng bằng `tsc` + `build` + smoke (đúng như bộ test hiện tại chỉ phủ `src/lib` + `src/stores`).

**Tech Stack:** TanStack Start + React 19, Tailwind v4, shadcn/ui (Radix), Zustand (+persist), recharts, lucide-react, vitest + @testing-library/react. Gates: `npx tsc --noEmit`, `npm run test`, `npm run build`. **Dùng npm/npx (không bun). Commit tiếng Việt, không attribution. Không mass-format.**

---

## Quy ước cho mọi task

- **Design system bắt buộc:** trước khi viết JSX cho mỗi màn, theo skill `/mobifone-ui`. Không hex literal, không `bg-[#...]`, không màu Tailwind mặc định (`bg-blue-600`…) cho UI. Chỉ dùng token semantic/brand + primitive `src/components/ui/*`.
- **Copy tiếng Việt:** áp `humanized` (giọng tự nhiên, xưng "bạn", sentence case). Không "giọng AI".
- **Route file = wrapper mỏng:** `createFileRoute(...)` + import page component từ `src/components/<role>/*`. Không nhồi logic vào route file. `routeTree.gen.ts` tự sinh khi chạy `npm run dev`/`build` (plugin `@tanstack/router-plugin`) — **không sửa tay**.
- **Mức kiểm thử:** module trong `src/lib` & `src/stores` → vitest TDD đầy đủ. Component màn hình → kiểm bằng `npx tsc --noEmit` + `npm run build` + smoke `npm run dev`. Không bịa unit test cho component thuần trình bày.
- **Gate cuối mỗi Phase:** `npx tsc --noEmit` && `npm run test` && `npm run build` đều xanh trước khi sang Phase sau.

## File Structure (bản đồ tạo/sửa)

**Tạo mới — module dữ liệu (TDD):**
- `src/lib/registry-id.ts` (+`.test.ts`) — sinh/parse mã định danh `THS-<tầng>-<năm>-<môn>-<số>`.
- `src/lib/quality-label.ts` (+`.test.ts`) — bộ nhãn chất lượng + thứ tự tiến + nhãn hiển thị.
- `src/lib/curriculum.ts` (+`.test.ts`) — cây 5 cấp Lớp→Môn→Mạch→Chương→Bài + outcomes + helper tra cứu.
- `src/stores/classroom.ts` (+`.test.ts`) — store lớp/giao bài/bài nộp + seed mock.

**Sửa — foundation chung:**
- `src/lib/types.ts` — mở rộng `RoleId`, thêm `ContentTier`/`ContentLicense`/`QualityLabel`/`SchoolRole`, mở rộng `Account` + `ContentItem`.
- `src/lib/taxonomy.ts` (+`.test.ts`) — thêm `getRoleHomePath(roleId, schoolRole?)`.
- `src/lib/mock-data.ts` — thêm tài khoản reviewer/student/school + `SCHOOL_DEPT_ACCOUNT` + `DEMO_LOGINS`; thêm `registryId`/`tier`/`license`/`qualityLabel` cho SEED_CONTENT; seed curriculum-liên-quan.
- `src/stores/session.ts` — thêm `schoolRole`, `setRole(roleId, schoolRole?)`.
- `src/components/content-studio-shell.tsx` — thêm `REVIEWER_NAV`/`STUDENT_NAV`/`SCHOOL_NAV`, mở rộng `ADMIN_NAV`/`TEACHER_NAV`/`ORG_NAV`; cập nhật `getNavSections`/`getFooterNav`/`canCreate`/`shellTitle`; resolve account theo `schoolRole`.
- `src/components/role-switcher.tsx` + `src/routes/login.tsx` — iterate `DEMO_LOGINS` (7 tile), gọi `getRoleHomePath`.

**Tạo mới — route shell + route wrapper:**
- `src/routes/reviewer.tsx`, `reviewer.queue.tsx`, `reviewer.review.$id.tsx`, `reviewer.reports.tsx`
- `src/routes/student.tsx`, `student.home.tsx`, `student.explore.tsx`, `student.learn.$id.tsx`, `student.progress.tsx`
- `src/routes/school.tsx`, `school.dashboard.tsx`, `school.review.tsx`, `school.accounts.tsx`
- `src/routes/admin.curriculum.tsx`, `creator.classes.tsx`, `creator.registry.tsx`, `org.signing.tsx`, `org.analytics.tsx`

**Tạo mới — page components:**
- `src/components/reviewer/{reviewer-queue,reviewer-detail,reviewer-reports}.tsx`
- `src/components/student/{student-home,student-explore,student-learn,student-progress}.tsx`
- `src/components/school/{school-dashboard,school-review,school-accounts}.tsx`
- `src/components/admin/admin-curriculum.tsx`
- `src/components/creator/{teacher-classes,teacher-registry}.tsx`
- `src/components/partner/{partner-signing,partner-analytics}.tsx`
- `src/components/shared/quality-badge.tsx`, `src/components/shared/registry-id-chip.tsx`, `src/components/shared/curriculum-tree.tsx` (dùng lại nhiều màn).

---

# PHASE 0 — Foundation (TDD)

## Task 1: Mở rộng types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Thêm union & interface mới**

Sửa dòng 1 `RoleId` và thêm các type bên dưới (đặt ngay sau `OrgRole`):

```typescript
export type RoleId =
  | "teacher"
  | "verified_teacher"
  | "publisher"
  | "admin"
  | "reviewer"
  | "student"
  | "school";

export type ContentTier = "root" | "partner" | "community";
export type LicenseType = "exclusive" | "cc" | "commercial";
export type LicenseScope = "national" | "provincial" | "school";
export type AccessTerms = "free" | "paid";

export interface ContentLicense {
  type: LicenseType;
  scope: LicenseScope;
  rightsHolder: string;
  validUntil: string; // ISO date
  accessTerms: AccessTerms;
}

export type QualityLabel =
  | "submitted" // Mới nộp
  | "documented" // Đủ hồ sơ
  | "reviewed" // Đã thẩm định
  | "ministry_standard" // Chuẩn Bộ
  | "needs_revision" // Cần chỉnh sửa
  | "rejected" // Từ chối
  | "trusted_partner"; // Đối tác tin cậy

export interface ContentVersion {
  version: string; // "v1.2"
  date: string; // ISO
  note: string;
  authorName: string;
}

export type SchoolRole = "principal" | "manager" | "dept_head";
```

- [ ] **Step 2: Mở rộng `Account`**

Thêm vào interface `Account` (sau `orgMemberships?`):

```typescript
  /** Vai trò nội bộ trường (chỉ account nhóm school). */
  schoolRole?: SchoolRole;
  /** Môn tổ trưởng phụ trách — lọc màn duyệt nội bộ. */
  subjectScope?: string;
  /** Hội đồng thẩm định mà reviewer trực thuộc. */
  council?: string;
```

- [ ] **Step 3: Mở rộng `ContentItem`**

Thêm vào interface `ContentItem` (sau `fileName?`):

```typescript
  /** Mã định danh nội dung duy nhất, vd "THS-DT-2026-TOAN-000123". */
  registryId?: string;
  tier?: ContentTier;
  license?: ContentLicense;
  qualityLabel?: QualityLabel;
  coAuthors?: string[];
  versionHistory?: ContentVersion[];
```

- [ ] **Step 4: Kiểm type-check**

Run: `npx tsc --noEmit`
Expected: PASS (chưa nơi nào dùng field mới nên không vỡ; nếu `ACCOUNTS: Record<RoleId, Account>` báo thiếu key reviewer/student/school → để Task 5 xử lý, có thể tạm thời lỗi và sẽ hết sau Task 5. Nếu muốn xanh ngay, làm Task 5 trước rồi quay lại.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): thêm RoleId mới, mã định danh, license, nhãn chất lượng, schoolRole"
```

## Task 2: Module sinh mã định danh `registry-id.ts`

**Files:**
- Create: `src/lib/registry-id.ts`
- Test: `src/lib/registry-id.test.ts`

- [ ] **Step 1: Viết test thất bại**

```typescript
// src/lib/registry-id.test.ts
import { describe, expect, test } from "vitest";
import {
  TIER_CODE,
  subjectCode,
  generateRegistryId,
  parseRegistryId,
} from "./registry-id";

describe("registry-id", () => {
  test("mã tầng theo đúng quy ước GOC/DT/CD", () => {
    expect(TIER_CODE.root).toBe("GOC");
    expect(TIER_CODE.partner).toBe("DT");
    expect(TIER_CODE.community).toBe("CD");
  });

  test("subjectCode ánh xạ môn tiếng Việt sang mã, fallback an toàn", () => {
    expect(subjectCode("Toán")).toBe("TOAN");
    expect(subjectCode("Ngữ văn")).toBe("VAN");
    expect(subjectCode("Tiếng Anh")).toBe("ANH");
    expect(subjectCode("Môn lạ")).toBe("KHAC");
  });

  test("generateRegistryId tạo mã đúng định dạng có mã tầng", () => {
    expect(generateRegistryId("partner", "Toán", 123, 2026)).toBe(
      "THS-DT-2026-TOAN-000123",
    );
    expect(generateRegistryId("root", "Ngữ văn", 7, 2025)).toBe(
      "THS-GOC-2025-VAN-000007",
    );
  });

  test("parseRegistryId tách lại các thành phần", () => {
    expect(parseRegistryId("THS-DT-2026-TOAN-000123")).toEqual({
      tier: "partner",
      year: 2026,
      subjectCode: "TOAN",
      seq: 123,
    });
    expect(parseRegistryId("không-hợp-lệ")).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `npx vitest run src/lib/registry-id.test.ts`
Expected: FAIL ("Cannot find module './registry-id'").

- [ ] **Step 3: Cài đặt tối thiểu**

```typescript
// src/lib/registry-id.ts
import type { ContentTier } from "./types";

export const TIER_CODE: Record<ContentTier, string> = {
  root: "GOC",
  partner: "DT",
  community: "CD",
};

const TIER_BY_CODE: Record<string, ContentTier> = {
  GOC: "root",
  DT: "partner",
  CD: "community",
};

const SUBJECT_CODE: Record<string, string> = {
  Toán: "TOAN",
  "Ngữ văn": "VAN",
  "Tiếng Anh": "ANH",
  "Vật lí": "LY",
  "Hóa học": "HOA",
  "Sinh học": "SINH",
  "Lịch sử": "SU",
  "Địa lí": "DIA",
  "Tin học": "TIN",
  "Giáo dục công dân": "GDCD",
  "Công nghệ": "CN",
};

export const subjectCode = (subject: string): string => SUBJECT_CODE[subject] ?? "KHAC";

export const generateRegistryId = (
  tier: ContentTier,
  subject: string,
  seq: number,
  year: number,
): string =>
  `THS-${TIER_CODE[tier]}-${year}-${subjectCode(subject)}-${String(seq).padStart(6, "0")}`;

export interface ParsedRegistryId {
  tier: ContentTier;
  year: number;
  subjectCode: string;
  seq: number;
}

const RE = /^THS-(GOC|DT|CD)-(\d{4})-([A-Z]+)-(\d{6})$/;

export const parseRegistryId = (id: string): ParsedRegistryId | null => {
  const m = RE.exec(id);
  if (!m) return null;
  return {
    tier: TIER_BY_CODE[m[1]],
    year: Number(m[2]),
    subjectCode: m[3],
    seq: Number(m[4]),
  };
};
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `npx vitest run src/lib/registry-id.test.ts`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/registry-id.ts src/lib/registry-id.test.ts
git commit -m "feat(registry-id): module sinh/parse mã định danh nội dung có mã tầng"
```

## Task 3: Module nhãn chất lượng `quality-label.ts`

**Files:**
- Create: `src/lib/quality-label.ts`
- Test: `src/lib/quality-label.test.ts`

- [ ] **Step 1: Viết test thất bại**

```typescript
// src/lib/quality-label.test.ts
import { describe, expect, test } from "vitest";
import {
  QUALITY_LABELS,
  QUALITY_PROGRESSION,
  nextQualityLabel,
} from "./quality-label";

describe("quality-label", () => {
  test("đủ 7 nhãn với nhãn tiếng Việt", () => {
    expect(QUALITY_LABELS.submitted.label).toBe("Mới nộp");
    expect(QUALITY_LABELS.ministry_standard.label).toBe("Chuẩn Bộ");
    expect(QUALITY_LABELS.trusted_partner.label).toBe("Đối tác tin cậy");
    expect(Object.keys(QUALITY_LABELS)).toHaveLength(7);
  });

  test("luồng tiến 4 mức theo đúng thứ tự", () => {
    expect(QUALITY_PROGRESSION).toEqual([
      "submitted",
      "documented",
      "reviewed",
      "ministry_standard",
    ]);
  });

  test("nextQualityLabel trả nhãn kế tiếp, null ở cuối", () => {
    expect(nextQualityLabel("submitted")).toBe("documented");
    expect(nextQualityLabel("reviewed")).toBe("ministry_standard");
    expect(nextQualityLabel("ministry_standard")).toBeNull();
    // nhãn ngoài luồng tiến không có "kế tiếp"
    expect(nextQualityLabel("rejected")).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `npx vitest run src/lib/quality-label.test.ts`
Expected: FAIL ("Cannot find module './quality-label'").

- [ ] **Step 3: Cài đặt tối thiểu**

`tone` là tên token semantic dùng cho badge (không hex). Không hardcode màu.

```typescript
// src/lib/quality-label.ts
import type { QualityLabel } from "./types";

export type QualityTone = "neutral" | "info" | "warning" | "success" | "brand" | "destructive";

interface QualityMeta {
  label: string;
  description: string;
  tone: QualityTone;
}

export const QUALITY_LABELS: Record<QualityLabel, QualityMeta> = {
  submitted: { label: "Mới nộp", description: "Vừa gửi, chờ kiểm tra hồ sơ.", tone: "neutral" },
  documented: { label: "Đủ hồ sơ", description: "Hồ sơ hợp lệ, vào hàng đợi thẩm định.", tone: "info" },
  reviewed: { label: "Đã thẩm định", description: "Hội đồng đã thẩm định đạt.", tone: "success" },
  ministry_standard: { label: "Chuẩn Bộ", description: "Đạt chuẩn Bộ GD&ĐT.", tone: "brand" },
  needs_revision: { label: "Cần chỉnh sửa", description: "Hội đồng yêu cầu chỉnh sửa.", tone: "warning" },
  rejected: { label: "Từ chối", description: "Không đạt yêu cầu thẩm định.", tone: "destructive" },
  trusted_partner: { label: "Đối tác tin cậy", description: "Học liệu đối tác đã ký số.", tone: "brand" },
};

export const QUALITY_PROGRESSION: QualityLabel[] = [
  "submitted",
  "documented",
  "reviewed",
  "ministry_standard",
];

export const nextQualityLabel = (current: QualityLabel): QualityLabel | null => {
  const i = QUALITY_PROGRESSION.indexOf(current);
  if (i === -1 || i === QUALITY_PROGRESSION.length - 1) return null;
  return QUALITY_PROGRESSION[i + 1];
};
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `npx vitest run src/lib/quality-label.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/quality-label.ts src/lib/quality-label.test.ts
git commit -m "feat(quality-label): bộ nhãn chất lượng thẩm định + luồng tiến"
```

## Task 4: Khung chương trình `curriculum.ts`

**Files:**
- Create: `src/lib/curriculum.ts`
- Test: `src/lib/curriculum.test.ts`

- [ ] **Step 1: Viết test thất bại**

```typescript
// src/lib/curriculum.test.ts
import { describe, expect, test } from "vitest";
import {
  CURRICULUM,
  findLesson,
  flattenLessons,
  getGrade,
} from "./curriculum";

describe("curriculum framework", () => {
  test("là cây 5 cấp Lớp→Môn→Mạch→Chương→Bài", () => {
    const grade = CURRICULUM[0];
    expect(grade.subjects.length).toBeGreaterThan(0);
    const subject = grade.subjects[0];
    expect(subject.strands.length).toBeGreaterThan(0);
    const strand = subject.strands[0];
    expect(strand.chapters.length).toBeGreaterThan(0);
    const chapter = strand.chapters[0];
    expect(chapter.lessons.length).toBeGreaterThan(0);
  });

  test("mỗi Bài có ít nhất 1 chuẩn đầu ra", () => {
    for (const lesson of flattenLessons()) {
      expect(lesson.outcomes.length).toBeGreaterThan(0);
    }
  });

  test("getGrade tra theo id, findLesson tìm được bài đã seed", () => {
    expect(getGrade("lop-10")?.name).toBe("Lớp 10");
    const first = flattenLessons()[0];
    expect(findLesson(first.id)?.title).toBe(first.title);
    expect(findLesson("không-tồn-tại")).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `npx vitest run src/lib/curriculum.test.ts`
Expected: FAIL ("Cannot find module './curriculum'").

- [ ] **Step 3: Cài đặt tối thiểu (seed slice nhỏ, đa cấp)**

```typescript
// src/lib/curriculum.ts
export interface Outcome {
  id: string;
  code: string; // mã chuẩn, vd "TOAN10.DS.1"
  text: string;
}
export interface CurriculumLesson {
  id: string;
  title: string;
  outcomes: Outcome[];
}
export interface Chapter {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
}
export interface Strand {
  id: string;
  title: string; // Mạch / Chủ đề
  chapters: Chapter[];
}
export interface CurriculumSubject {
  id: string;
  name: string;
  strands: Strand[];
}
export interface Grade {
  id: string;
  name: string;
  subjects: CurriculumSubject[];
}

export const CURRICULUM: Grade[] = [
  {
    id: "lop-10",
    name: "Lớp 10",
    subjects: [
      {
        id: "lop-10-toan",
        name: "Toán",
        strands: [
          {
            id: "lop-10-toan-daiso",
            title: "Đại số",
            chapters: [
              {
                id: "lop-10-toan-daiso-menhde",
                title: "Mệnh đề – Tập hợp",
                lessons: [
                  {
                    id: "bai-menhde",
                    title: "Mệnh đề",
                    outcomes: [
                      { id: "o1", code: "TOAN10.DS.1", text: "Phát biểu được mệnh đề toán học." },
                      { id: "o2", code: "TOAN10.DS.2", text: "Xác định được tính đúng/sai của mệnh đề." },
                    ],
                  },
                  {
                    id: "bai-taphop",
                    title: "Tập hợp và các phép toán",
                    outcomes: [
                      { id: "o3", code: "TOAN10.DS.3", text: "Thực hiện được các phép toán trên tập hợp." },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "lop-10-toan-hinhhoc",
            title: "Hình học",
            chapters: [
              {
                id: "lop-10-toan-hinhhoc-vecto",
                title: "Vectơ",
                lessons: [
                  {
                    id: "bai-vecto",
                    title: "Khái niệm vectơ",
                    outcomes: [
                      { id: "o4", code: "TOAN10.HH.1", text: "Nhận biết được khái niệm vectơ, độ dài vectơ." },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "lop-10-van",
        name: "Ngữ văn",
        strands: [
          {
            id: "lop-10-van-doc",
            title: "Đọc",
            chapters: [
              {
                id: "lop-10-van-doc-thantho",
                title: "Thần thoại và sử thi",
                lessons: [
                  {
                    id: "bai-thantho",
                    title: "Đọc hiểu thần thoại",
                    outcomes: [
                      { id: "o5", code: "VAN10.D.1", text: "Phân tích được đặc trưng thể loại thần thoại." },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const getGrade = (id: string): Grade | null =>
  CURRICULUM.find((g) => g.id === id) ?? null;

export const flattenLessons = (): CurriculumLesson[] =>
  CURRICULUM.flatMap((g) =>
    g.subjects.flatMap((s) =>
      s.strands.flatMap((st) => st.chapters.flatMap((c) => c.lessons)),
    ),
  );

export const findLesson = (id: string): CurriculumLesson | null =>
  flattenLessons().find((l) => l.id === id) ?? null;
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `npx vitest run src/lib/curriculum.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/curriculum.ts src/lib/curriculum.test.ts
git commit -m "feat(curriculum): khung chương trình 5 cấp + chuẩn đầu ra + helper tra cứu"
```

## Task 5: Store lớp học & giao bài `classroom.ts`

**Files:**
- Create: `src/stores/classroom.ts`
- Test: `src/stores/classroom.test.ts`

- [ ] **Step 1: Viết test thất bại**

```typescript
// src/stores/classroom.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { useClassroom } from "./classroom";

function reset() {
  useClassroom.setState((s) => ({ ...s, _seeded: false }));
  useClassroom.getState().seed();
}

describe("classroom store", () => {
  beforeEach(reset);

  it("seed tạo lớp, bài giao và bài nộp mock", () => {
    const { classes, assignments, submissions } = useClassroom.getState();
    expect(classes.length).toBeGreaterThan(0);
    expect(assignments.length).toBeGreaterThan(0);
    expect(submissions.length).toBeGreaterThan(0);
  });

  it("assignContent thêm 1 assignment + tạo submission cho từng HS của lớp", () => {
    const cls = useClassroom.getState().classes[0];
    const before = useClassroom.getState().assignments.length;
    useClassroom.getState().assignContent(cls.id, "content-x", "Bài tập mới", "2026-07-01");
    const after = useClassroom.getState();
    expect(after.assignments.length).toBe(before + 1);
    const newA = after.assignments.find((a) => a.contentId === "content-x")!;
    const subs = after.submissions.filter((s) => s.assignmentId === newA.id);
    expect(subs).toHaveLength(cls.studentIds.length);
    expect(subs.every((s) => s.status === "not_started")).toBe(true);
  });

  it("updateSubmission cập nhật trạng thái & điểm bất biến (immutable)", () => {
    const sub = useClassroom.getState().submissions[0];
    const prevArr = useClassroom.getState().submissions;
    useClassroom.getState().updateSubmission(sub.assignmentId, sub.studentId, {
      status: "graded",
      score: 9,
      progress: 100,
    });
    const next = useClassroom.getState();
    expect(next.submissions).not.toBe(prevArr); // mảng mới
    const updated = next.submissions.find(
      (s) => s.assignmentId === sub.assignmentId && s.studentId === sub.studentId,
    )!;
    expect(updated.status).toBe("graded");
    expect(updated.score).toBe(9);
  });
});
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `npx vitest run src/stores/classroom.test.ts`
Expected: FAIL ("Cannot find module './classroom'").

- [ ] **Step 3: Cài đặt tối thiểu**

```typescript
// src/stores/classroom.ts
import { create } from "zustand";

export interface Class {
  id: string;
  schoolId: string;
  teacherId: string;
  name: string;
  grade: string;
  subject: string;
  studentIds: string[];
}
export interface Assignment {
  id: string;
  classId: string;
  contentId: string;
  title: string;
  dueDate: string;
  assignedBy: string;
}
export type SubmissionStatus = "not_started" | "in_progress" | "submitted" | "graded";
export interface Submission {
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  score?: number;
  progress: number; // 0..100
}

interface ClassroomState {
  _seeded: boolean;
  classes: Class[];
  assignments: Assignment[];
  submissions: Submission[];
  seed: () => void;
  assignContent: (classId: string, contentId: string, title: string, dueDate: string) => void;
  updateSubmission: (
    assignmentId: string,
    studentId: string,
    patch: Partial<Omit<Submission, "assignmentId" | "studentId">>,
  ) => void;
}

const STUDENTS = ["hs-01", "hs-02", "hs-03", "hs-04"];

function buildSeed() {
  const classes: Class[] = [
    {
      id: "lop-10a1",
      schoolId: "school-thpt-le-loi",
      teacherId: "teacher",
      name: "10A1",
      grade: "Lớp 10",
      subject: "Toán",
      studentIds: STUDENTS,
    },
  ];
  const assignments: Assignment[] = [
    {
      id: "as-1",
      classId: "lop-10a1",
      contentId: "seed-quiz-1",
      title: "Luyện tập Mệnh đề",
      dueDate: "2026-06-30",
      assignedBy: "teacher",
    },
  ];
  const submissions: Submission[] = STUDENTS.map((sid, i) => ({
    assignmentId: "as-1",
    studentId: sid,
    status: (["graded", "submitted", "in_progress", "not_started"] as const)[i] ?? "not_started",
    score: i === 0 ? 8.5 : undefined,
    progress: [100, 100, 45, 0][i] ?? 0,
  }));
  return { classes, assignments, submissions };
}

let idc = 0;
const nextId = (p: string) => `${p}-${++idc}`;

export const useClassroom = create<ClassroomState>((set, get) => ({
  _seeded: false,
  classes: [],
  assignments: [],
  submissions: [],
  seed: () => {
    if (get()._seeded) return;
    set({ ...buildSeed(), _seeded: true });
  },
  assignContent: (classId, contentId, title, dueDate) => {
    const cls = get().classes.find((c) => c.id === classId);
    if (!cls) return;
    const a: Assignment = { id: nextId("as"), classId, contentId, title, dueDate, assignedBy: cls.teacherId };
    const newSubs: Submission[] = cls.studentIds.map((sid) => ({
      assignmentId: a.id,
      studentId: sid,
      status: "not_started",
      progress: 0,
    }));
    set((s) => ({
      assignments: [...s.assignments, a],
      submissions: [...s.submissions, ...newSubs],
    }));
  },
  updateSubmission: (assignmentId, studentId, patch) =>
    set((s) => ({
      submissions: s.submissions.map((sub) =>
        sub.assignmentId === assignmentId && sub.studentId === studentId
          ? { ...sub, ...patch }
          : sub,
      ),
    })),
}));
```

> Lưu ý: store seed thủ công qua `seed()` (gọi 1 lần khi màn classroom mount), không dùng persist — giữ đơn giản cho prototype và để test reset dễ.

- [ ] **Step 4: Chạy test để thấy pass**

Run: `npx vitest run src/stores/classroom.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/stores/classroom.ts src/stores/classroom.test.ts
git commit -m "feat(classroom): store lớp học/giao bài/bài nộp + seed mock"
```

## Task 6: Helper định tuyến vai trò trong `taxonomy.ts`

**Files:**
- Modify: `src/lib/taxonomy.ts`
- Modify: `src/lib/taxonomy.test.ts`

- [ ] **Step 1: Thêm test (mở rộng test có sẵn)**

Thêm khối test này vào trong `describe("Content Studio v2 taxonomy", …)` của `src/lib/taxonomy.test.ts`, và thêm `getRoleHomePath` vào import ở đầu file:

```typescript
  test("getRoleHomePath đưa từng vai trò về màn mặc định", () => {
    expect(getRoleHomePath("admin")).toBe("/admin/dashboard");
    expect(getRoleHomePath("teacher")).toBe("/creator/dashboard");
    expect(getRoleHomePath("verified_teacher")).toBe("/creator/dashboard");
    expect(getRoleHomePath("publisher")).toBe("/org/dashboard");
    expect(getRoleHomePath("reviewer")).toBe("/reviewer/queue");
    expect(getRoleHomePath("student")).toBe("/student/home");
    expect(getRoleHomePath("school")).toBe("/school/dashboard");
    expect(getRoleHomePath("school", "dept_head")).toBe("/school/review");
  });
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `npx vitest run src/lib/taxonomy.test.ts`
Expected: FAIL ("getRoleHomePath is not a function").

- [ ] **Step 3: Cài đặt**

Thêm vào cuối `src/lib/taxonomy.ts` (và import type ở đầu: `import type { RoleId, SchoolRole } from "./types";` — gộp vào dòng import types đã có):

```typescript
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
      return schoolRole === "dept_head" ? "/school/review" : "/school/dashboard";
    case "teacher":
    case "verified_teacher":
    default:
      return "/creator/dashboard";
  }
};
```

> Giữ nguyên `getDefaultAppPath(accountType)` (vẫn dùng cho luồng cũ + test cũ). `getRoleHomePath` là nguồn định tuyến mới cho login/role-switcher.

- [ ] **Step 4: Chạy test để thấy pass**

Run: `npx vitest run src/lib/taxonomy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/taxonomy.ts src/lib/taxonomy.test.ts
git commit -m "feat(taxonomy): getRoleHomePath định tuyến 6 vai trò + dept_head"
```

## Task 7: Tài khoản demo + `DEMO_LOGINS` + seed mã định danh

**Files:**
- Modify: `src/lib/mock-data.ts`

> Đọc trước cấu trúc `ACCOUNTS` và một vài phần tử `SEED_CONTENT` hiện có để khớp kiểu màu/avatar (dùng token brand, không hex mới nếu có hằng màu sẵn; avatarColor hiện đang là chuỗi màu — giữ đúng pattern hiện hữu của file này).

- [ ] **Step 1: Thêm 3 account vai trò mới vào `ACCOUNTS`**

Trong object `ACCOUNTS` thêm các khóa `reviewer`, `student`, `school` (khớp `Record<RoleId, Account>`):

```typescript
  reviewer: {
    id: "reviewer",
    name: "Hội đồng thẩm định",
    shortName: "HĐ",
    accountType: "Admin",
    verified: "admin",
    avatarColor: "var(--colors-brand-700)",
    bio: "Thành viên Hội đồng chuyên môn thẩm định học liệu quốc gia.",
    followers: 0,
    council: "Hội đồng Toán THPT",
  },
  student: {
    id: "student",
    name: "Nguyễn An",
    shortName: "NA",
    accountType: "Cá nhân",
    verified: "none",
    avatarColor: "var(--success-600)",
    bio: "Học sinh lớp 10, đang học theo lộ trình cá nhân hoá.",
    followers: 0,
  },
  school: {
    id: "school",
    name: "THPT Lê Lợi",
    shortName: "LL",
    accountType: "Doanh nghiệp",
    verified: "L2",
    avatarColor: "var(--colors-brand-900)",
    bio: "Trường THPT Lê Lợi — quản lý dạy học số toàn trường.",
    followers: 0,
    schoolRole: "manager",
  },
```

> Nếu `avatarColor` trong file hiện dùng hex literal cho các account cũ, **giữ đồng bộ với cách file đang làm** (không tự ý đổi account cũ). Với account mới ưu tiên token; nếu pipeline màu avatar yêu cầu hex thì chọn hex trung tính và ghi chú — nhưng KHÔNG thêm hex vào JSX màn hình.

- [ ] **Step 2: Thêm `SCHOOL_DEPT_ACCOUNT` + `DEMO_LOGINS`**

Sau khai báo `ACCOUNTS`:

```typescript
import type { SchoolRole } from "./types"; // nếu chưa có

export const SCHOOL_DEPT_ACCOUNT: Account = {
  id: "school",
  name: "Tổ trưởng Tổ Toán",
  shortName: "TT",
  accountType: "Doanh nghiệp",
  verified: "L1",
  avatarColor: "var(--warning-600)",
  bio: "Tổ trưởng bộ môn Toán — duyệt học liệu cấp tổ trước khi trường chốt.",
  followers: 0,
  schoolRole: "dept_head",
  subjectScope: "Toán",
};

export interface DemoLogin {
  key: string; // duy nhất cho tile login
  roleId: RoleId;
  schoolRole?: SchoolRole;
  account: Account;
  tagline: string; // mô tả ngắn vai trò trên tile
}

export const DEMO_LOGINS: DemoLogin[] = [
  { key: "admin", roleId: "admin", account: ACCOUNTS.admin, tagline: "Quản trị viên Bộ GD&ĐT" },
  { key: "reviewer", roleId: "reviewer", account: ACCOUNTS.reviewer, tagline: "Hội đồng thẩm định" },
  { key: "teacher", roleId: "teacher", account: ACCOUNTS.teacher, tagline: "Giáo viên" },
  { key: "student", roleId: "student", account: ACCOUNTS.student, tagline: "Học sinh" },
  { key: "school", roleId: "school", schoolRole: "manager", account: ACCOUNTS.school, tagline: "Quản lý nhà trường" },
  { key: "school-dept", roleId: "school", schoolRole: "dept_head", account: SCHOOL_DEPT_ACCOUNT, tagline: "Tổ trưởng bộ môn" },
  { key: "publisher", roleId: "publisher", account: ACCOUNTS.publisher, tagline: "Đối tác nội dung (NXB/EdTech)" },
];

export const resolveDemoAccount = (roleId: RoleId, schoolRole?: SchoolRole): Account =>
  roleId === "school" && schoolRole === "dept_head" ? SCHOOL_DEPT_ACCOUNT : ACCOUNTS[roleId];
```

- [ ] **Step 3: Gắn mã định danh + tier + nhãn cho SEED_CONTENT**

Với mỗi phần tử `SEED_CONTENT`, thêm `tier`, `registryId`, `qualityLabel` (và `license` cho item tier partner). Dùng `generateRegistryId`. Ví dụ pattern áp dụng (đặt ở đầu file một biến đếm, rồi map):

```typescript
import { generateRegistryId } from "./registry-id";

// helper gán mã cho seed (chạy 1 lần khi định nghĩa SEED_CONTENT)
let _seq = 0;
const stamp = (tier: ContentTier, subject: string, year = 2026) =>
  generateRegistryId(tier, subject, ++_seq, year);
```

Áp cho vài item đại diện (giữ nguyên các field cũ, chỉ thêm):
- Item của `publisher` → `tier: "partner"`, `qualityLabel: "trusted_partner"`, `registryId: stamp("partner", item.subject)`, `license: { type: "commercial", scope: "national", rightsHolder: "NXB Giáo dục", validUntil: "2028-12-31", accessTerms: "paid" }`.
- Item đã published của `admin`/hệ thống → `tier: "root"`, `qualityLabel: "ministry_standard"`, `registryId: stamp("root", item.subject)`.
- Item cộng đồng (teacher) → `tier: "community"`, `qualityLabel` theo `status` (`pending`→`"documented"`, `published`→`"reviewed"`, `draft`→`"submitted"`), `registryId: stamp("community", item.subject)`.

> Nếu `SEED_CONTENT` lớn, áp tối thiểu cho ~8–10 item đủ phủ 3 tầng + đủ để các màn (reviewer queue, partner signing, admin curriculum) có dữ liệu thật. Ghi `log` (comment) các item chưa gắn để biết phần bỏ qua.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (mọi key `RoleId` của `ACCOUNTS` đã đủ; field mới hợp lệ).

- [ ] **Step 5: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "feat(mock-data): 7 tài khoản demo (DEMO_LOGINS) + mã định danh/tier/nhãn cho seed"
```

## Task 8: Session hỗ trợ `schoolRole`

**Files:**
- Modify: `src/stores/session.ts`

- [ ] **Step 1: Thêm `schoolRole` vào state + `setRole`**

```typescript
import type { RoleId, SchoolRole } from "@/lib/types";

interface SessionState {
  roleId: RoleId | null;
  schoolRole?: SchoolRole;
  workspace: Workspace;
  hasHydrated: boolean;
  setRole: (id: RoleId | null, schoolRole?: SchoolRole) => void;
  setWorkspace: (ws: Workspace) => void;
  setHasHydrated: (v: boolean) => void;
}
```

Trong `create`:
```typescript
      roleId: null,
      schoolRole: undefined,
      workspace: "personal",
      hasHydrated: false,
      setRole: (id, schoolRole) => set({ roleId: id, schoolRole, workspace: "personal" }),
```

Và mở rộng `partialize`:
```typescript
      partialize: (s) => ({ roleId: s.roleId, schoolRole: s.schoolRole, workspace: s.workspace }),
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: lỗi tại các nơi gọi `setRole(id)` không truyền schoolRole? → KHÔNG, vì tham số 2 optional. PASS.

- [ ] **Step 3: Commit**

```bash
git add src/stores/session.ts
git commit -m "feat(session): lưu schoolRole để phân biệt tài khoản nội bộ trường"
```

## Task 9: Login + Role-switcher dùng `DEMO_LOGINS` (7 tile)

**Files:**
- Modify: `src/routes/login.tsx`
- Modify: `src/components/role-switcher.tsx`

- [ ] **Step 1: Sửa login.tsx**

Thay nguồn lặp `Object.keys(ACCOUNTS)` bằng `DEMO_LOGINS`; thay `getDefaultAppPath(...)` bằng `getRoleHomePath(...)`; thêm `tagline`.

```typescript
import { DEMO_LOGINS } from "@/lib/mock-data";
import { getRoleHomePath } from "@/lib/taxonomy";
import { useSession } from "@/stores/session";
// ...
function LoginPage() {
  const setRole = useSession((s) => s.setRole);
  const navigate = useNavigate();

  const pick = (login: (typeof DEMO_LOGINS)[number]) => {
    setRole(login.roleId, login.schoolRole);
    navigate({ to: getRoleHomePath(login.roleId, login.schoolRole) });
  };
  // ...
  // grid: đổi map sang DEMO_LOGINS; key={login.key}; a = login.account;
  // hiển thị thêm login.tagline dưới tên; nút onClick={() => pick(login)}
  // đổi lg:grid-cols-4 nếu muốn 7 tile cân đối (giữ class hiện có vẫn ổn — chỉ là layout)
}
```

> Chỉ sửa phần dữ liệu/lặp; **giữ nguyên** style/animation hiện có (đúng nguyên tắc không sửa UI đã có ngoài vùng cần). `a.accountType` vẫn hiển thị; thêm dòng `tagline` bằng class muted có sẵn.

- [ ] **Step 2: Sửa role-switcher.tsx**

Tương tự: map `DEMO_LOGINS`, `setRole(login.roleId, login.schoolRole)`, `navigate({ to: getRoleHomePath(login.roleId, login.schoolRole) })`, `current === login.roleId` (so sánh thêm schoolRole nếu cần phân biệt 2 tile school: `current === login.roleId && sessionSchoolRole === login.schoolRole`). Lấy `sessionSchoolRole = useSession((s) => s.schoolRole)`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Smoke**

Run: `npm run dev` → mở `/login`. Expected: thấy **7 tile**; bấm từng tile vào đúng màn mặc định (admin→/admin/dashboard, reviewer→/reviewer/queue [trang trắng/501 route chưa có — chấp nhận ở phase này], student→/student/home, school manager→/school/dashboard, tổ trưởng→/school/review, publisher→/org/dashboard, teacher→/creator/dashboard). Đổi vai trò qua RoleSwitcher hoạt động.

> Các route reviewer/student/school chưa tồn tại sẽ 404 — bình thường, Phase 2–5 tạo. Có thể tạm bỏ qua điều hướng tới route chưa có.

- [ ] **Step 5: Commit**

```bash
git add src/routes/login.tsx src/components/role-switcher.tsx
git commit -m "feat(auth-demo): trang login + role-switcher 7 tài khoản, định tuyến theo vai trò"
```

## Task 10: Shared components — quality badge, registry chip, curriculum tree

**Files:**
- Create: `src/components/shared/quality-badge.tsx`
- Create: `src/components/shared/registry-id-chip.tsx`
- Create: `src/components/shared/curriculum-tree.tsx`

- [ ] **Step 1: QualityBadge** — bọc `Badge` primitive, map `tone` → class token (không hex).

```typescript
// src/components/shared/quality-badge.tsx
import { Badge } from "@/components/ui/badge";
import { QUALITY_LABELS, type QualityTone } from "@/lib/quality-label";
import type { QualityLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<QualityTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-accent text-accent-foreground",
  warning: "bg-warning-100 text-warning-700",
  success: "bg-success/10 text-success",
  brand: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
};

export function QualityBadge({ label, className }: { label: QualityLabel; className?: string }) {
  const meta = QUALITY_LABELS[label];
  return (
    <Badge variant="secondary" className={cn("border-0", TONE_CLASS[meta.tone], className)}>
      {meta.label}
    </Badge>
  );
}
```

> Kiểm token `warning-100/700`, `success`, `accent` tồn tại trong `src/styles.css`/untitled tokens trước khi dùng (login.tsx đã dùng `bg-warning-100 text-warning-700`, nên có sẵn).

- [ ] **Step 2: RegistryIdChip** — hiển thị mã + icon, copy nhẹ (toast).

```typescript
// src/components/shared/registry-id-chip.tsx
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export function RegistryIdChip({ id, className }: { id: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground",
        className,
      )}
      title="Mã định danh nội dung"
    >
      <Hash className="h-3 w-3" /> {id}
    </span>
  );
}
```

- [ ] **Step 3: CurriculumTree** — cây 5 cấp có thể gập, nhận `onSelectLesson`.

```typescript
// src/components/shared/curriculum-tree.tsx
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { CURRICULUM, type CurriculumLesson } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

export function CurriculumTree({
  onSelectLesson,
  selectedLessonId,
}: {
  onSelectLesson?: (lesson: CurriculumLesson) => void;
  selectedLessonId?: string;
}) {
  return (
    <div className="space-y-1 text-sm">
      {CURRICULUM.map((grade) => (
        <TreeNode key={grade.id} label={grade.name} defaultOpen>
          {grade.subjects.map((subject) => (
            <TreeNode key={subject.id} label={subject.name}>
              {subject.strands.map((strand) => (
                <TreeNode key={strand.id} label={strand.title}>
                  {strand.chapters.map((chapter) => (
                    <TreeNode key={chapter.id} label={chapter.title}>
                      {chapter.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => onSelectLesson?.(lesson)}
                          className={cn(
                            "block w-full rounded-md px-3 py-1.5 text-left hover:bg-muted",
                            selectedLessonId === lesson.id && "bg-accent text-accent-foreground",
                          )}
                        >
                          {lesson.title}
                        </button>
                      ))}
                    </TreeNode>
                  ))}
                </TreeNode>
              ))}
            </TreeNode>
          ))}
        </TreeNode>
      ))}
    </div>
  );
}

function TreeNode({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-medium text-foreground hover:bg-muted"
      >
        <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-90")} />
        {label}
      </button>
      {open && <div className="ml-4 border-l border-border pl-2">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Type-check + commit**

Run: `npx tsc --noEmit` → PASS.
```bash
git add src/components/shared/quality-badge.tsx src/components/shared/registry-id-chip.tsx src/components/shared/curriculum-tree.tsx
git commit -m "feat(shared): QualityBadge, RegistryIdChip, CurriculumTree dùng chung"
```

## Task 11: Cập nhật `ContentStudioShell` cho 3 nhóm vai trò mới

**Files:**
- Modify: `src/components/content-studio-shell.tsx`

- [ ] **Step 1: Thêm nav cho reviewer/student/school + import icon**

Thêm icon cần dùng vào import lucide (vd `ClipboardCheck`, `GraduationCap`, `BookMarked`, `LayoutGrid`, `School`, `ListChecks`, `FolderTree`, `LineChart`, `Award`, `Stamp`). Thêm 3 hằng NAV:

```typescript
const REVIEWER_NAV: NavSection[] = [
  {
    id: "reviewer",
    label: "Thẩm định",
    items: [
      { to: "/reviewer/queue", label: "Hàng đợi thẩm định", icon: ClipboardCheck },
      { to: "/reviewer/reports", label: "Rà soát & cảnh báo", icon: ShieldAlert, badge: "reports" },
    ],
  },
];

const STUDENT_NAV: NavSection[] = [
  {
    id: "student",
    label: "Học tập",
    items: [
      { to: "/student/home", label: "Trang chủ", icon: Home },
      { to: "/student/explore", label: "Khám phá", icon: FolderTree },
      { to: "/student/progress", label: "Tiến độ của tôi", icon: LineChart },
    ],
  },
];

const SCHOOL_NAV_MANAGER: NavSection[] = [
  {
    id: "school",
    label: "Nhà trường",
    items: [
      { to: "/school/dashboard", label: "Tổng quan trường", icon: BarChart3 },
      { to: "/school/review", label: "Duyệt nội bộ", icon: ClipboardCheck },
      { to: "/school/accounts", label: "Tài khoản & lớp học", icon: Users },
    ],
  },
];

const SCHOOL_NAV_DEPT: NavSection[] = [
  {
    id: "school",
    label: "Tổ bộ môn",
    items: [{ to: "/school/review", label: "Duyệt cấp tổ", icon: ClipboardCheck }],
  },
];
```

- [ ] **Step 2: Mở rộng `ADMIN_NAV`, `TEACHER_NAV`, `ORG_NAV` với màn mới**

`ADMIN_NAV` thêm sau "Quản lý người dùng":
```typescript
      { to: "/admin/curriculum", label: "Khung chương trình", icon: FolderTree },
```
`TEACHER_NAV.items` thêm:
```typescript
      { to: "/creator/classes", label: "Lớp học & giao bài", icon: GraduationCap },
      { to: "/creator/registry", label: "Hồ sơ chuyên môn", icon: Award },
```
`ORG_NAV.items` thêm:
```typescript
      { to: "/org/signing", label: "Đăng ký & ký số", icon: Stamp },
      { to: "/org/analytics", label: "Phân tích hiệu quả", icon: LineChart },
```

> Lưu ý `content-review` của admin sẽ chuyển sang Reviewer (Phase 2). Ở bước này CHƯA gỡ khỏi `ADMIN_NAV` — gỡ ở Phase 2 Task để tránh route 404 giữa chừng.

- [ ] **Step 3: Cập nhật `getNavSections` + `getFooterNav` + `canCreate` + `shellTitle` + account resolve**

```typescript
function getNavSections(roleId: RoleId, workspace: Workspace, schoolRole?: SchoolRole): NavSection[] {
  switch (roleId) {
    case "admin": return ADMIN_NAV;
    case "publisher": return ORG_NAV;
    case "reviewer": return REVIEWER_NAV;
    case "student": return STUDENT_NAV;
    case "school": return schoolRole === "dept_head" ? SCHOOL_NAV_DEPT : SCHOOL_NAV_MANAGER;
    case "teacher":
    case "verified_teacher":
    default: return workspace === "org" ? ORG_NAV : TEACHER_NAV;
  }
}
```
`canCreate`: chỉ teacher/publisher/verified_teacher được tạo:
```typescript
function canCreate(roleId: RoleId): boolean {
  return roleId === "teacher" || roleId === "verified_teacher" || roleId === "publisher";
}
```
`getFooterNav`: reviewer/student/school không có settings creator/org → trả `[]` (hoặc trỏ settings phù hợp nếu muốn; để `[]` cho gọn).
`shellTitle`: thêm nhánh:
```typescript
  const shellTitle =
    roleId === "admin" ? "Admin Console"
    : roleId === "reviewer" ? "Hội đồng thẩm định"
    : roleId === "student" ? "Không gian học tập"
    : roleId === "school" ? "Quản lý nhà trường"
    : workspace === "org" ? "Org Studio" : "Content Studio";
```
Account resolve: đọc `schoolRole` từ session + dùng `resolveDemoAccount`:
```typescript
import { resolveDemoAccount } from "@/lib/mock-data";
import type { SchoolRole } from "@/lib/types";
// trong component:
const schoolRole = useSession((s) => s.schoolRole);
const account = resolveDemoAccount(roleId, schoolRole);
const sections = getNavSections(roleId, workspace, schoolRole);
```
`HeaderSearch`: hiện chỉ render khi `roleId !== "admin"`. Đổi thành chỉ render cho các role có thư viện tìm kiếm (teacher/publisher/student): `{(roleId === "teacher" || roleId === "verified_teacher" || roleId === "publisher") && <HeaderSearch scope={scope} />}` (student dùng explore riêng, bỏ search ở header để tránh trỏ /creator/library).

- [ ] **Step 4: Type-check + smoke**

Run: `npx tsc --noEmit` → PASS.
Run: `npm run dev` → đăng nhập reviewer/student/school manager/tổ trưởng: sidebar hiện đúng nav, không có nút "Tạo mới" với reviewer/student/school, title đúng, avatar tổ trưởng khác manager.

- [ ] **Step 5: Commit**

```bash
git add src/components/content-studio-shell.tsx
git commit -m "feat(shell): nav + quyền + tiêu đề cho reviewer/student/school + màn mới admin/teacher/org"
```

## Task 12: Route shell cho 3 nhóm mới + GATE Phase 0

**Files:**
- Create: `src/routes/reviewer.tsx`, `src/routes/student.tsx`, `src/routes/school.tsx`

- [ ] **Step 1: Tạo 3 route shell (giống `creator.tsx`)**

```typescript
// src/routes/reviewer.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ContentStudioShell } from "@/components/content-studio-shell";
export const Route = createFileRoute("/reviewer")({ component: () => <ContentStudioShell /> });
```
Lặp lại cho `/student` (student.tsx) và `/school` (school.tsx) — đổi path string tương ứng.

- [ ] **Step 2: GATE Phase 0**

```bash
npx tsc --noEmit && npm run test && npm run build
```
Expected: tsc sạch; vitest pass (bao gồm test mới registry-id/quality-label/curriculum/classroom/taxonomy); build thành công (route shell mới được plugin nhận, `routeTree.gen.ts` cập nhật — có thể xuất hiện trong `git status`, commit kèm).

- [ ] **Step 3: Commit**

```bash
git add src/routes/reviewer.tsx src/routes/student.tsx src/routes/school.tsx src/routeTree.gen.ts
git commit -m "feat(routes): shell reviewer/student/school + hoàn tất foundation Phase 0"
```

---

# PHASE 1 — System Admin (MoET): Khung chương trình + mở rộng

## Task 13: Màn `admin/curriculum` (Quản lý Khung Chương trình)

**Files:**
- Create: `src/components/admin/admin-curriculum.tsx`
- Create: `src/routes/admin.curriculum.tsx`

- [ ] **Step 1: Page component** — dùng `PageFrame` + `CurriculumTree` + panel chi tiết Bài (outcomes) + nút CRUD/phiên bản (mock, toast).

Cấu trúc:
- `PageFrame title="Khung chương trình & tiêu chuẩn" description="Cây chương trình 5 cấp và chuẩn đầu ra của Bộ."`
- Layout 2 cột (`grid xl:grid-cols-[1.2fr_1fr]`): trái = `CurriculumTree` (chọn Bài → set state); phải = `Card` chi tiết Bài: tiêu đề, danh sách `outcomes` (code + text), badge "Phiên bản 2018", các nút `Button` "Thêm bài", "Sửa", "Ban hành cập nhật" (mock → `toast.success`).
- Header có `Badge` hiển thị "CT GDPT 2018 · phiên bản hiện hành" + nút "Lịch sử thay đổi" mở `Dialog` liệt kê 2–3 mốc phiên bản mock.
- Tất cả màu qua token; icon lucide; copy humanized.

- [ ] **Step 2: Route wrapper**

```typescript
// src/routes/admin.curriculum.tsx
import { createFileRoute } from "@tanstack/react-router";
import { AdminCurriculumPage } from "@/components/admin/admin-curriculum";
export const Route = createFileRoute("/admin/curriculum")({ component: AdminCurriculumPage });
```

- [ ] **Step 3: Tự kiểm `/mobifone-ui`** — diff không có `#[0-9a-fA-F]`, không `bg-[`/`text-[` màu tùy ý.

- [ ] **Step 4: Type-check + smoke**

Run: `npx tsc --noEmit` → PASS. `npm run dev` → admin → "Khung chương trình": cây gập/mở, chọn Bài hiện outcomes, nút bấm ra toast.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/admin-curriculum.tsx src/routes/admin.curriculum.tsx src/routeTree.gen.ts
git commit -m "feat(admin): màn quản lý khung chương trình & chuẩn đầu ra"
```

## Task 14: Mở rộng Admin Dashboard — widget "Tổng quan Quốc gia"

**Files:**
- Modify: `src/components/admin/admin-pages.tsx` (chỉ THÊM, không phá phần có sẵn)

- [ ] **Step 1: Thêm 1 Card "Tổng quan Quốc gia" với 4 khối số liệu**

Trong `AdminDashboardPage`, thêm một `Card` mới (đặt sau khối grid StatCard, trước "Tăng trưởng hệ thống") gồm 4 ô:
- Học liệu theo tầng (Gốc/Đối tác/Cộng đồng) — đếm từ `useContent` theo `item.tier`.
- Tỷ lệ khai thác theo vùng — 3 dòng mock (Miền Bắc/Trung/Nam) + thanh `Progress`.
- Cảnh báo rủi ro — đếm `CONTENT_REPORTS` open + `qualityLabel === "needs_revision"`.
- Hiệu quả theo loại học liệu — tái dùng `ContentDonutChart` hoặc 1 chỉ số tổng hợp.

Dùng `StatCard`/`Card`/token sẵn có. Đếm theo tier:
```typescript
const byTier = (t: ContentTier) => items.filter((i) => i.tier === t).length;
```

- [ ] **Step 2: Type-check + smoke + commit**

Run: `npx tsc --noEmit` → PASS. Smoke admin dashboard hiển thị widget mới.
```bash
git add src/components/admin/admin-pages.tsx
git commit -m "feat(admin): widget Tổng quan Quốc gia (tầng học liệu, vùng, rủi ro, hiệu quả)"
```

## Task 14B: Mở rộng nhẹ Admin — báo cáo chính sách + phê duyệt tổ chức

**Files:**
- Modify: `src/components/admin/admin-moderation.tsx` (màn `AdminReportsPage` — chỉ THÊM)
- Modify: `src/components/admin/admin-pages.tsx` (màn `AdminUsersPage` — chỉ THÊM)

> Đọc trước 2 file để khớp pattern Card/bảng hiện có; chỉ bổ sung, không phá phần cũ.

- [ ] **Step 1: `AdminReportsPage` — thêm khối "Hoạch định chính sách"**

Thêm 1 `Card` (hoặc `Tabs` "Vi phạm" / "Chính sách") gồm 2 biểu đồ mock ngang hàng:
- "Khoảng cách tiếp cận số" — bar chart theo vùng/tỉnh (recharts, `--chart-*` token).
- "Hiệu quả & chất lượng" — line/bar theo loại học liệu (đọc `useContent` đếm theo `qualityLabel`/`materialType`).
Thêm nút `Button` "Xuất báo cáo" → `toast.success("Đã xuất báo cáo chính sách (demo)")`.

- [ ] **Step 2: `AdminUsersPage` — thêm khu "Chờ phê duyệt tổ chức"**

Trên bảng người dùng, thêm 1 `Card` "Đơn phê duyệt" liệt kê mock các đơn Sở GD&ĐT / NXB / Doanh nghiệp / Hội đồng chờ duyệt (mảng mock `PENDING_ORG_APPROVALS` khai báo cục bộ trong file): mỗi dòng tên tổ chức + loại + nút "Duyệt"/"Từ chối" (→ toast). Ghi chú: Sở GD&ĐT xuất hiện ở đây (vai trò đầy đủ làm sau).

- [ ] **Step 3: tsc + smoke + commit**

Run: `npx tsc --noEmit` → PASS. Smoke admin reports + users hiển thị khối mới.
```bash
git add src/components/admin/admin-moderation.tsx src/components/admin/admin-pages.tsx
git commit -m "feat(admin): báo cáo hoạch định chính sách + khu phê duyệt tổ chức (Sở/NXB/Hội đồng)"
```

## Task 15: GATE Phase 1

- [ ] **Step 1: Gate**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: tất cả xanh.

---

# PHASE 2 — Reviewer (Hội đồng thẩm định)

> Chuyển logic duyệt nội dung từ Admin sang Reviewer. Admin giữ kiểm duyệt vi phạm/báo cáo nền tảng + cấu hình.

## Task 16: Reviewer — Hàng đợi thẩm định `reviewer/queue`

**Files:**
- Create: `src/components/reviewer/reviewer-queue.tsx`
- Create: `src/routes/reviewer.queue.tsx`

- [ ] **Step 1: Page component**

- `PageFrame title="Hàng đợi thẩm định" description="Học liệu chờ Hội đồng thẩm định, lọc theo môn/cấp/lớp và ưu tiên."`
- Lọc: thanh `Tabs`/`Select` theo môn + cấp lớp; cờ "Ưu tiên Đối tác" (lọc `tier === "partner"`).
- Danh sách dùng bảng giống `AdminContentReviewPage` (tham khảo `src/components/admin/admin-moderation.tsx`): mỗi dòng = tiêu đề + `RegistryIdChip` + môn/lớp + `QualityBadge` + tier + nút "Thẩm định" → `Link` tới `/reviewer/review/$id`.
- Nguồn dữ liệu: `useContent` lọc `status === "pending"` hoặc `qualityLabel ∈ {submitted, documented}`. Item `tier === "partner"` xếp trước (ưu tiên) + badge "Đối tác".

- [ ] **Step 2: Route wrapper** (`createFileRoute("/reviewer/queue")` → `ReviewerQueuePage`).

- [ ] **Step 3: tsc + /mobifone-ui self-check + smoke + commit**

```bash
git add src/components/reviewer/reviewer-queue.tsx src/routes/reviewer.queue.tsx src/routeTree.gen.ts
git commit -m "feat(reviewer): hàng đợi thẩm định có lọc môn/lớp + ưu tiên đối tác"
```

## Task 17: Reviewer — Chi tiết thẩm định `reviewer/review/$id`

**Files:**
- Create: `src/components/reviewer/reviewer-detail.tsx`
- Create: `src/routes/reviewer.review.$id.tsx`

- [ ] **Step 1: Page component** — 2 cột: trái xem nội dung, phải form thẩm định.

- Lấy `id` từ route params; tra `useContent` ra item. Nếu không thấy → empty state.
- Cột trái: header item (tiêu đề, `RegistryIdChip`, tier, môn/lớp, `QualityBadge`); khu "trải nghiệm học liệu" — nếu `category === "course"` nhúng Preview của course (tái dùng `page-canvas`/Preview như student learn; nếu phức tạp, hiển thị `Card` mô tả + thumbnail làm placeholder fidelity, ghi chú reuse Preview).
- Cột phải (`Card` sticky): **form thẩm định**:
  - Rubric nhiều tiêu chí: 4–5 tiêu chí (Chính xác khoa học, Bám chuẩn đầu ra, Sư phạm, Kỹ thuật/đa phương tiện, Bản quyền) — mỗi tiêu chí `RadioGroup` Đạt/Cần sửa/Không đạt hoặc thang điểm 1–5 (`Slider`/nút).
  - Checklist đối chiếu chuẩn đầu ra: liệt kê outcomes từ `curriculum` (theo môn/bài liên quan) + `Checkbox`.
  - Ô ghi chú `Textarea`.
  - Hành động: `Button` "Đạt — gắn nhãn" (chọn `QualityBadge` đích: Đã thẩm định/Chuẩn Bộ qua `Select`), "Yêu cầu chỉnh sửa" (→ `needs_revision`), "Từ chối" (→ `rejected`). Tất cả mock → `toast` + (tùy chọn) cập nhật `useContent` nếu store có action set nhãn; nếu không, chỉ toast cho prototype.
  - Hiển thị "Thẩm định bởi: {account.council}" (Hội đồng X).

- [ ] **Step 2: Route wrapper**

```typescript
// src/routes/reviewer.review.$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ReviewerDetailPage } from "@/components/reviewer/reviewer-detail";
export const Route = createFileRoute("/reviewer/review/$id")({ component: ReviewerDetailPage });
```

- [ ] **Step 3: tsc + /mobifone-ui self-check + smoke (vào từ queue) + commit**

```bash
git add src/components/reviewer/reviewer-detail.tsx src/routes/reviewer.review.$id.tsx src/routeTree.gen.ts
git commit -m "feat(reviewer): màn chi tiết thẩm định (rubric + checklist chuẩn đầu ra + nhãn)"
```

## Task 18: Reviewer — Rà soát & cảnh báo `reviewer/reports` + gỡ content-review khỏi Admin nav

**Files:**
- Create: `src/components/reviewer/reviewer-reports.tsx`
- Create: `src/routes/reviewer.reports.tsx`
- Modify: `src/components/content-studio-shell.tsx` (gỡ item `/admin/content-review` khỏi `ADMIN_NAV`)

- [ ] **Step 1: Page component** — tái dùng pattern `AdminReportsPage`/`admin-moderation`.

- `PageFrame title="Rà soát & cảnh báo" description="Tiếp nhận báo cáo sai lệch chuyên môn và tranh chấp bản quyền."`
- Bảng từ `CONTENT_REPORTS`: cột nội dung (+`RegistryIdChip`), lý do (chuyên môn/bản quyền), người báo cáo, trạng thái.
- Hành động mỗi dòng: "Xử lý", "Tạm dừng khai thác" (quyền đặc thù reviewer → toast "Đã tạm dừng khai thác {title}"), "Bỏ qua".
- Phân biệt loại tranh chấp: `Tabs` "Chuyên môn" / "Bản quyền".

- [ ] **Step 2: Route wrapper** (`/reviewer/reports` → `ReviewerReportsPage`).

- [ ] **Step 3: Gỡ `content-review` khỏi `ADMIN_NAV`**

Trong `content-studio-shell.tsx`, xóa dòng `{ to: "/admin/content-review", label: "Duyệt nội dung", icon: FileCheck2, badge: "pending" },` khỏi `ADMIN_NAV`. (Route file `admin.content-review.tsx` vẫn để lại — không xóa màn cũ; chỉ rời khỏi nav admin theo quyết định "chuyển sang Reviewer".)

> Badge `pending` giờ chỉ còn ý nghĩa cho reviewer; không cần đổi cơ chế badge.

- [ ] **Step 4: tsc + smoke + commit**

Run: `npx tsc --noEmit` → PASS. Smoke: reviewer thấy 2 mục nav (queue, reports); admin nav không còn "Duyệt nội dung".
```bash
git add src/components/reviewer/reviewer-reports.tsx src/routes/reviewer.reports.tsx src/components/content-studio-shell.tsx src/routeTree.gen.ts
git commit -m "feat(reviewer): màn rà soát & cảnh báo; chuyển duyệt nội dung khỏi nav admin"
```

## Task 19: GATE Phase 2

- [ ] Run: `npx tsc --noEmit && npm run test && npm run build` → xanh.

---

# PHASE 3 — Teacher (Creator): Lớp học & Hồ sơ chuyên môn

## Task 20: Teacher — Lớp học & giao bài `creator/classes`

**Files:**
- Create: `src/components/creator/teacher-classes.tsx`
- Create: `src/routes/creator.classes.tsx`

- [ ] **Step 1: Page component** — dùng `useClassroom` (gọi `seed()` trong `useEffect`).

- `PageFrame title="Lớp học & giao bài" description="Giao học liệu cho lớp và theo dõi tiến độ từng học sinh."`
- Cột trái: danh sách lớp (`useClassroom().classes`) — chọn lớp.
- Cột phải:
  - Nút "Giao bài" mở `Dialog`: chọn học liệu từ kho (`useContent` của teacher) + `Input` tiêu đề + `dueDate` → gọi `assignContent`.
  - Bảng bài đã giao của lớp (`assignments` lọc theo classId), mỗi bài expand bảng tiến độ HS: từ `submissions`, hiển thị trạng thái (`SubmissionStatus` → nhãn tiếng Việt: Chưa làm/Đang làm/Đã nộp/Đã chấm), `Progress` %, điểm.
- Map trạng thái → `Badge` tone token. Realtime = đọc store (đủ cho prototype).

- [ ] **Step 2: Route wrapper** (`/creator/classes` → `TeacherClassesPage`).

- [ ] **Step 3: tsc + /mobifone-ui self-check + smoke + commit**

```bash
git add src/components/creator/teacher-classes.tsx src/routes/creator.classes.tsx src/routeTree.gen.ts
git commit -m "feat(teacher): màn lớp học & giao bài + theo dõi tiến độ từng học sinh"
```

## Task 21: Teacher — Hồ sơ chuyên môn số `creator/registry`

**Files:**
- Create: `src/components/creator/teacher-registry.tsx`
- Create: `src/routes/creator.registry.tsx`

- [ ] **Step 1: Page component** — 4 khối theo quyết định.

- `PageFrame title="Hồ sơ chuyên môn số" description="Đóng góp, ghi nhận và phát triển chuyên môn của bạn."`
- 4 khối (`StatCard` + charts):
  1. Lượt tải/sử dụng: tổng `views`/`shares` học liệu của teacher (`useContent`), kèm `analytics-line-chart` mock theo tháng.
  2. Nhãn & giải thưởng: danh sách badge (Chuẩn Bộ ×N, Đối tác tin cậy…) đếm từ `qualityLabel` học liệu của họ + vài "giải thưởng" mock.
  3. Điểm thi đua đóng góp: số mock + thanh tiến trình mục tiêu.
  4. Điểm CPD (phát triển chuyên môn): số tín chỉ mock + danh sách hoạt động.

- [ ] **Step 2: Route wrapper** (`/creator/registry` → `TeacherRegistryPage`).

- [ ] **Step 3: tsc + self-check + smoke + commit**

```bash
git add src/components/creator/teacher-registry.tsx src/routes/creator.registry.tsx src/routeTree.gen.ts
git commit -m "feat(teacher): màn hồ sơ chuyên môn số (4 khối: sử dụng/nhãn/thi đua/CPD)"
```

## Task 22: Teacher — Lịch sử phiên bản + đồng tác giả vào Library

**Files:**
- Modify: `src/components/library-view.tsx` (hoặc component thẻ/diễn chi tiết item library — đọc file để xác định nơi đặt; CHỈ thêm, không phá luồng hiện có)

- [ ] **Step 1: Thêm hiển thị version history + co-authors khi xem chi tiết item**

- Nếu library có `Dialog`/panel chi tiết item: thêm mục "Lịch sử phiên bản" (đọc `item.versionHistory`) dạng timeline + mục "Đồng tác giả" (`item.coAuthors`) dạng chip. Nếu chưa có panel chi tiết, thêm nút "Chi tiết" mở `Dialog` mới chỉ cho mục này.
- Seed `versionHistory`/`coAuthors` cho 1–2 item của teacher trong `mock-data.ts` (bổ sung Task 7 nếu chưa có) để có dữ liệu hiển thị.

- [ ] **Step 2: tsc + smoke + commit**

```bash
git add src/components/library-view.tsx src/lib/mock-data.ts
git commit -m "feat(teacher): lịch sử phiên bản + đồng tác giả trong quản lý học liệu cá nhân"
```

## Task 23: GATE Phase 3

- [ ] Run: `npx tsc --noEmit && npm run test && npm run build` → xanh.

---

# PHASE 4 — Student

## Task 24: Student — Trang chủ cá nhân hoá `student/home`

**Files:**
- Create: `src/components/student/student-home.tsx`
- Create: `src/routes/student.home.tsx`

- [ ] **Step 1: Page component** — lộ trình cá nhân hoá làm trọng tâm.

- `PageFrame title="Xin chào, {account.name}" description="Tiếp tục lộ trình học của bạn."` (humanized).
- Khối 1 (trọng tâm): "Tiếp tục học" — thẻ lớn bài đang dở (mock từ `curriculum`/`classroom`), nút "Tiếp tục" → `/student/learn/$id`.
- Khối 2: "Gợi ý bổ trợ" — 2–3 thẻ học liệu gợi ý theo điểm yếu (mock).
- Khối 3: "Bài tập cần làm" — từ `useClassroom`: assignments của lớp HS + submission của `student` (status ≠ graded) → danh sách có dueDate + nút "Làm bài".
- Dùng `Card`/`StatCard`/token; phân biệt học liệu Tầng Gốc (miễn phí) vs cấp quyền bằng badge.

- [ ] **Step 2: Route wrapper** (`/student/home` → `StudentHomePage`).

- [ ] **Step 3: tsc + self-check + smoke + commit**

```bash
git add src/components/student/student-home.tsx src/routes/student.home.tsx src/routeTree.gen.ts
git commit -m "feat(student): trang chủ cá nhân hoá (tiếp tục học + gợi ý + bài tập)"
```

## Task 25: Student — Khám phá `student/explore`

**Files:**
- Create: `src/components/student/student-explore.tsx`
- Create: `src/routes/student.explore.tsx`

- [ ] **Step 1: Page component** — duyệt cây 5 cấp.

- 2 cột: trái `CurriculumTree` (mặc định mở Lớp của HS — Lớp 10); phải danh sách học liệu gắn Bài đang chọn (lọc `useContent` theo môn/bài hoặc mock map), mỗi thẻ có `QualityBadge`, badge "Tầng Gốc · miễn phí" vs "Cần cấp quyền" (theo `tier`/`license.accessTerms`), nút "Học ngay" → `/student/learn/$id`.
- Cho phép chọn Lớp khác (xem được lớp khác) qua `Select` lớp ở đầu cây.

- [ ] **Step 2: Route wrapper** (`/student/explore` → `StudentExplorePage`).

- [ ] **Step 3: tsc + self-check + smoke + commit**

```bash
git add src/components/student/student-explore.tsx src/routes/student.explore.tsx src/routeTree.gen.ts
git commit -m "feat(student): màn khám phá cây chương trình + phân biệt tầng miễn phí/cấp quyền"
```

## Task 26: Student — Trình học tập tương tác `student/learn/$id`

**Files:**
- Create: `src/components/student/student-learn.tsx`
- Create: `src/routes/student.learn.$id.tsx`

- [ ] **Step 1: Page component** — tái dùng render Preview của course/quiz.

- Lấy `id`; tra `useContent`. Layout học tập toàn màn (không sidebar studio — đây là route con của `/student`, vẫn trong shell; nếu muốn full-screen như builder, có thể để trong shell bình thường cho prototype).
- Trình tự phần (gating): danh sách phần/bài (mock 3–4 phần); phần sau khoá đến khi phần trước "hoàn thành". Lưu tiến độ vào state cục bộ (hoặc `classroom` submission progress) → "tiếp tục" lần sau.
- Render nội dung: nếu course → nhúng Preview (`page-canvas` ở chế độ xem) ; nếu quiz → render câu hỏi (tái dùng component quiz hiện có nếu khả dụng) với chấm điểm tức thì + giải thích; cho "làm lại/xem lại".
- Thanh tiến trình + nút "Đánh dấu hoàn thành phần" mở khoá phần kế.
- Phản hồi tức thì: khi nộp 1 câu → hiện đúng/sai + giải thích ngay.

> Nếu việc nhúng Preview thực sự của course-builder quá phức tạp, dùng renderer Preview hiện có ở chế độ chỉ-đọc; tối thiểu phải render được 1 loại (quiz) đầy đủ để minh hoạ luồng gating + chấm điểm. Ghi chú phần tái dùng.

- [ ] **Step 2: Route wrapper**

```typescript
// src/routes/student.learn.$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { StudentLearnPage } from "@/components/student/student-learn";
export const Route = createFileRoute("/student/learn/$id")({ component: StudentLearnPage });
```

- [ ] **Step 3: tsc + self-check + smoke (vào từ home/explore) + commit**

```bash
git add src/components/student/student-learn.tsx src/routes/student.learn.$id.tsx src/routeTree.gen.ts
git commit -m "feat(student): trình học tương tác (gating + lưu tiến độ + chấm điểm/giải thích tức thì)"
```

## Task 27: Student — Tiến độ học tập `student/progress`

**Files:**
- Create: `src/components/student/student-progress.tsx`
- Create: `src/routes/student.progress.tsx`

- [ ] **Step 1: Page component** — cả theo môn lẫn theo chuẩn năng lực.

- `Tabs` "Theo môn" / "Theo chuẩn năng lực".
  - Theo môn: bar/line chart điểm theo môn (recharts, dùng `--chart-*` token), điểm mạnh/yếu.
  - Theo chuẩn: danh sách outcomes (từ `curriculum`) với % đạt (mock) + gắn khung CT.
- Khối "Gợi ý lộ trình tiếp theo": 2–3 đề xuất bài bổ trợ dựa điểm yếu → link `/student/learn/$id`.

- [ ] **Step 2: Route wrapper** (`/student/progress` → `StudentProgressPage`).

- [ ] **Step 3: tsc + self-check + smoke + commit**

```bash
git add src/components/student/student-progress.tsx src/routes/student.progress.tsx src/routeTree.gen.ts
git commit -m "feat(student): báo cáo tiến độ theo môn + theo chuẩn năng lực + gợi ý lộ trình"
```

## Task 28: GATE Phase 4

- [ ] Run: `npx tsc --noEmit && npm run test && npm run build` → xanh.

---

# PHASE 5 — School (Nhà trường)

## Task 29: School — Dashboard `school/dashboard`

**Files:**
- Create: `src/components/school/school-dashboard.tsx`
- Create: `src/routes/school.dashboard.tsx`

- [ ] **Step 1: Page component**

- `StatCard` hàng: tỷ lệ GV tham gia, tỷ lệ HS tham gia, lượt tương tác toàn trường, tồn đọng duyệt nội bộ.
- `Card` "Thi đua đóng góp": bảng xếp hạng GV theo số học liệu/điểm đóng góp (mock).
- `Card` "Tồn đọng duyệt nội bộ": số bài chờ tổ trưởng/chờ trường chốt → link `/school/review`.
- `Card` "Tổng hợp tiến độ học tập HS toàn trường": chart mock (recharts token).

- [ ] **Step 2: Route wrapper** (`/school/dashboard` → `SchoolDashboardPage`).

- [ ] **Step 3: tsc + self-check + smoke + commit**

```bash
git add src/components/school/school-dashboard.tsx src/routes/school.dashboard.tsx src/routeTree.gen.ts
git commit -m "feat(school): dashboard nhà trường (tham gia, thi đua, tồn đọng, tiến độ HS)"
```

## Task 30: School — Duyệt nội bộ `school/review` (2 cấp: tổ trưởng → trường)

**Files:**
- Create: `src/components/school/school-review.tsx`
- Create: `src/routes/school.review.tsx`

- [ ] **Step 1: Page component** — hành vi phụ thuộc `schoolRole`.

- Đọc `schoolRole` + `subjectScope` từ session.
- Luồng 2 cấp (mock state cục bộ trên danh sách bài GV trong trường — lấy `useContent` các item của teacher thuộc trường, hoặc seed riêng `SCHOOL_SUBMISSIONS` mock với trạng thái: `cho_to_truong` → `cho_truong_chot` → `da_chuyen_hoi_dong`):
  - **dept_head**: chỉ thấy bài thuộc `subjectScope` (môn của tổ) ở trạng thái `cho_to_truong`; hành động "Duyệt cấp tổ" → chuyển `cho_truong_chot` (toast).
  - **manager/principal**: thấy mọi môn; bài `cho_truong_chot` có hành động "Chốt & chuyển Hội đồng" → `da_chuyen_hoi_dong`; cũng xem được bài đang chờ tổ.
- Bảng: tiêu đề + GV + môn + trạng thái (`Badge` token) + hành động theo quyền.
- `Tabs` theo trạng thái để rõ luồng.

> Vì 2 màn (tổ trưởng & quản lý) dùng chung route `/school/review`, component tự rẽ nhánh theo `schoolRole`. Dữ liệu bước này nên là 1 store/array mock cục bộ trong component (hoặc thêm vào `mock-data.ts` hằng `SCHOOL_REVIEW_ITEMS`).

- [ ] **Step 2: Route wrapper** (`/school/review` → `SchoolReviewPage`).

- [ ] **Step 3: tsc + self-check + smoke (đăng nhập cả 2 tài khoản school) + commit**

```bash
git add src/components/school/school-review.tsx src/routes/school.review.tsx src/routeTree.gen.ts
git commit -m "feat(school): duyệt nội bộ 2 cấp (tổ trưởng theo môn → trường chốt chuyển Hội đồng)"
```

## Task 31: School — Tài khoản & lớp học `school/accounts`

**Files:**
- Create: `src/components/school/school-accounts.tsx`
- Create: `src/routes/school.accounts.tsx`

- [ ] **Step 1: Page component** — tái dùng pattern `members-view` + `useClassroom`.

- `Tabs` "Lớp học" / "Giáo viên" / "Học sinh".
  - Lớp học: danh sách `useClassroom().classes`; nút "Tạo lớp" (`Dialog` → thêm vào store cục bộ/mock), gán GV↔lớp (`Select`), xem sĩ số.
  - Giáo viên: bảng GV của trường (mock) + nút "Thêm GV".
  - Học sinh: bảng HS (mock studentIds) + nút "Nhập danh sách" (mock toast) + phân HS vào lớp (`Select`).
- Hành động CRUD mock (toast); ưu tiên rõ luồng, không cần persist thật.

- [ ] **Step 2: Route wrapper** (`/school/accounts` → `SchoolAccountsPage`).

- [ ] **Step 3: tsc + self-check + smoke + commit**

```bash
git add src/components/school/school-accounts.tsx src/routes/school.accounts.tsx src/routeTree.gen.ts
git commit -m "feat(school): quản lý tài khoản GV/HS & lớp học (tạo lớp, gán GV, phân HS)"
```

## Task 32: GATE Phase 5

- [ ] Run: `npx tsc --noEmit && npm run test && npm run build` → xanh.

---

# PHASE 6 — Content Partner (NXB / EdTech)

## Task 33: Partner — Đăng ký & ký số `org/signing`

**Files:**
- Create: `src/components/partner/partner-signing.tsx`
- Create: `src/routes/org.signing.tsx`

- [ ] **Step 1: Page component** — tự sinh mã định danh + khối bản quyền đầy đủ.

- `PageFrame title="Đăng ký & ký số học liệu" description="Cấp mã định danh và cấu hình bản quyền cho học liệu đối tác."`
- Trái: danh sách học liệu đối tác (org) chưa ký (lọc `useContent` theo org + `registryId` rỗng) → chọn item.
- Phải (`Card` form ký số):
  - Hiển thị mã sẽ cấp = preview `generateRegistryId("partner", item.subject, nextSeq, 2026)` (read-only, badge "Hệ thống tự sinh").
  - Khối bản quyền đầy đủ 5 trường: `Select` loại giấy phép (Độc quyền/CC/Thương mại), `Select` phạm vi (Toàn quốc/Theo tỉnh/Theo trường), `Input` chủ sở hữu, `Input type=date` thời hạn, `Select` điều khoản truy cập (Miễn phí/Trả phí).
  - Nút "Ký số & gửi thẩm định" → mock: gán `registryId` + `license` + `qualityLabel: "trusted_partner"` (nếu store cho phép cập nhật; nếu không, toast + hiển thị kết quả) + thông báo "Đã ký lúc {dấu thời gian}" và "Đã vào hàng đợi Hội đồng (ưu tiên Đối tác)".
- Sau khi ký: hiển thị `RegistryIdChip` + `QualityBadge` "Đối tác tin cậy" + dấu thời gian.

> Dấu thời gian: dùng giá trị mock cố định hoặc `new Date().toLocaleString("vi-VN")` tại thời điểm bấm (client event — chấp nhận trong prototype; KHÔNG dùng trong logic test).

- [ ] **Step 2: Route wrapper** (`/org/signing` → `PartnerSigningPage`).

- [ ] **Step 3: tsc + self-check + smoke + commit**

```bash
git add src/components/partner/partner-signing.tsx src/routes/org.signing.tsx src/routeTree.gen.ts
git commit -m "feat(partner): đăng ký & ký số học liệu (tự sinh mã định danh + bản quyền đầy đủ)"
```

## Task 34: Partner — Phân tích hiệu quả `org/analytics`

**Files:**
- Create: `src/components/partner/partner-analytics.tsx`
- Create: `src/routes/org.analytics.tsx`

- [ ] **Step 1: Page component** — 1 dashboard, 3 khối qua `Tabs`.

- `Tabs`: "Độ phủ & khai thác" / "Doanh thu & cấp phép" / "Phản hồi & chất lượng".
  - Độ phủ: `StatCard` số cơ sở GD/tỉnh dùng, lượt mở; `analytics-line-chart` theo thời gian; bảng top học liệu được dùng nhiều (mock).
  - Doanh thu: bảng lượt cấp quyền theo trường, gói license hiệu lực/sắp hết hạn (đọc `license.validUntil` của item org), tổng giá trị mock.
  - Phản hồi: điểm đánh giá GV trung bình, tỷ lệ HS hoàn thành, biểu đồ phân bố sao (mock).
- Charts dùng `--chart-*` token; không hex.

- [ ] **Step 2: Route wrapper** (`/org/analytics` → `PartnerAnalyticsPage`).

- [ ] **Step 3: tsc + self-check + smoke + commit**

```bash
git add src/components/partner/partner-analytics.tsx src/routes/org.analytics.tsx src/routeTree.gen.ts
git commit -m "feat(partner): dashboard phân tích hiệu quả 3 khối (độ phủ/doanh thu/phản hồi)"
```

## Task 35: GATE Phase 6

- [ ] Run: `npx tsc --noEmit && npm run test && npm run build` → xanh.

---

# PHASE 7 — Kiểm thử đầu–cuối & chốt

## Task 36: Smoke 7 tài khoản + tự kiểm design system

- [ ] **Step 1: Gate tổng**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: tsc sạch; vitest pass toàn bộ (gồm registry-id, quality-label, curriculum, classroom, taxonomy); build OK.

- [ ] **Step 2: Smoke đủ 7 vai trò**

Run: `npm run dev`. Đăng nhập lần lượt 7 tile, đi hết màn mới của từng vai trò:
- Admin: dashboard (widget Quốc gia), **curriculum**, users, reports.
- Reviewer: queue → review/$id (rubric+checklist) → reports (tạm dừng khai thác).
- Teacher: classes (giao bài + tiến độ), registry; library (version + đồng tác giả).
- Student: home → learn/$id (gating+chấm điểm) ; explore ; progress.
- School manager: dashboard, review (chốt chuyển Hội đồng), accounts.
- School tổ trưởng: chỉ review cấp tổ lọc đúng môn.
- Partner: signing (sinh mã + bản quyền), analytics (3 tab).
Xác nhận điều hướng/role-switch đúng, không lỗi console nghiêm trọng.

- [ ] **Step 3: Tự kiểm `/mobifone-ui` toàn bộ vùng code mới**

Dùng Grep (không phụ thuộc số commit) trên các thư mục mới — tìm hex literal và arbitrary color:
- pattern `#[0-9a-fA-F]{3,6}` trong `src/components/reviewer`, `src/components/student`, `src/components/school`, `src/components/partner`, và các file `admin-curriculum.tsx`, `teacher-classes.tsx`, `teacher-registry.tsx`, `quality-badge.tsx`, `registry-id-chip.tsx`, `curriculum-tree.tsx`.
- pattern `(bg|text|border|ring)-\[` (arbitrary color) trong cùng phạm vi.
Expected: không khớp. Nếu khớp → thay bằng token semantic/brand và commit sửa.

- [ ] **Step 4: Commit chốt (nếu có chỉnh nhỏ)**

```bash
git add -A
git commit -m "chore: hoàn tất 6 vai trò + màn còn thiếu, qua gate tsc/test/build + smoke"
```

---

## Phụ lục — danh sách tên định danh (giữ nhất quán xuyên suốt)

- Types: `RoleId(+reviewer|student|school)`, `ContentTier`, `LicenseType`, `LicenseScope`, `AccessTerms`, `ContentLicense`, `QualityLabel`, `ContentVersion`, `SchoolRole`.
- `registry-id.ts`: `TIER_CODE`, `subjectCode`, `generateRegistryId`, `parseRegistryId`, `ParsedRegistryId`.
- `quality-label.ts`: `QUALITY_LABELS`, `QualityTone`, `QUALITY_PROGRESSION`, `nextQualityLabel`.
- `curriculum.ts`: `CURRICULUM`, `Grade`, `CurriculumSubject`, `Strand`, `Chapter`, `CurriculumLesson`, `Outcome`, `getGrade`, `flattenLessons`, `findLesson`.
- `classroom.ts`: `useClassroom`, `Class`, `Assignment`, `Submission`, `SubmissionStatus`, `seed`, `assignContent`, `updateSubmission`.
- `taxonomy.ts`: `getRoleHomePath(roleId, schoolRole?)`.
- `mock-data.ts`: `ACCOUNTS(+reviewer|student|school)`, `SCHOOL_DEPT_ACCOUNT`, `DEMO_LOGINS`, `DemoLogin`, `resolveDemoAccount`.
- `session.ts`: `schoolRole`, `setRole(roleId, schoolRole?)`.
- Shared: `QualityBadge`, `RegistryIdChip`, `CurriculumTree`.

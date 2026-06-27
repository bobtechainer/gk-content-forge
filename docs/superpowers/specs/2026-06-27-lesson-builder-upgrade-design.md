# Nâng cấp Lesson Builder lên đẳng cấp TalentCraft — Tài liệu thiết kế

- **Ngày:** 2026-06-27
- **Trạng thái:** Design — chờ review trước khi `/writing-plans`
- **Nguồn đối chiếu:** NotebookLM "TalentLMS 2026 Pricing Plans and LMS Platform Comparison" (41 nguồn) + chấm vào code thật của repo (workflow 5 agent).
- **Lăng kính:** công cụ **soạn học liệu K-12 tiếng Việt**, **client-first** (Zustand + localStorage, **không backend**), **bắt buộc MobiFone Untitled UI**.
- **Artifact trình bày:** https://claude.ai/code/artifact/b1b8f544-81a8-4066-93d8-3b0f5737c5df

---

## 0. Quyết định đã chốt (định hình toàn bộ spec)

| # | Quyết định | Lựa chọn đã chốt | Hệ quả |
|---|---|---|---|
| 1 | Thứ tự ưu tiên | **Publish-loop + builder trước**, AI sau | Phase 0→1 (nền tảng + màn học thật) đứng trước AI & theming nâng cao |
| 2 | AI | **CHỈ mock-data, KHÔNG dùng API** | **Bỏ hẳn** AI server function / API key / BYO-key. Toàn bộ vẫn client-first. Vẫn thiết kế interface `AiClient` để sau cắm backend, nhưng chỉ ship `mockAiClient` |
| 3 | Theming per-course | **Tách đôi** | Lớp token + theme Default vào Phase 0.5 (net DS win); gallery + custom editor để Phase 3 |
| 4 | Chấm điểm | MC-family auto trước; free-text để sau | `gradeQuestion` pure-function ở Phase 1 |
| 5 | Phạm vi spec | **Đầy đủ cả 4 phase** | Tài liệu này phủ Phase 0→3 + ghi chú Phase 4 (khi có backend thật) |

> **Tác động lớn nhất của quyết định #2:** vì AI chỉ là mock-data, **không có mảnh backend nào** trong cả 4 phase — mọi thứ chạy client-side. Trụ cột C trở thành "xây *trải nghiệm* storyboard-first thật, dữ liệu do `mockAiClient` sinh ra (phong phú, có cấu trúc, theo template môn/lớp)", và để sẵn đường cắm `serverAiClient` về sau mà không phải viết lại UI.

---

## 1. Năm sự thật nền tảng (đã xác minh trong source)

1. **Vòng tác giả ↔ người học bị đứt.** Builder ghi `CourseBlock[]` thật vào `useCourse` (`src/stores/course.ts`), nhưng màn học `src/components/student/student-learn.tsx` render hằng số **`SECTIONS` hardcode** (đề "Mệnh đề") — không đọc `courseData`. `publish()` chỉ đổi `ContentItem.status`, **không snapshot blocks**. → Cổng chặn lớn nhất.
2. **Hai block-model song song, không chung renderer.** `CourseBlock` (12 type) và `Question` (10 type, `src/lib/types.ts`) là hai store/builder tách rời; màn học còn tự bịa model MC thứ ba (`LearnQuestion`).
3. **Persist đang phá dữ liệu.** `useQuiz` **không persist** (mất mỗi reload). `useCourse`/`useContent` có `migrate: () => ({...rỗng})` → **xóa sạch dữ liệu mỗi lần bump version** (`course.ts` ~503, `content.ts` ~132). Biến thể nguy hiểm của persist-stale-seed đã biết.
4. **Khung "thin backend" đã có** (`src/lib/api/example.functions.ts` dùng `createServerFn`; `src/lib/config.server.ts`) — **không dùng trong các phase này** (AI mock-only), nhưng ghi nhận là đường cắm tương lai.
5. **Design-system drift đã hiện diện.** `course-ai-panel.tsx`, `block-card.tsx`, `page-canvas.tsx`, callout map dùng màu Tailwind thô (`bg-blue-50`, `text-emerald-700`, `bg-[#1e1e2e]`…) — vi phạm CLAUDE.md. Mọi pass nâng cấp phải tokenize.

**Hệ quả định hướng:** trước khi "đẹp như TalentCraft", phải **nối vòng tác giả→người học** (#1) và **chống mất dữ liệu** (#3).

---

## 2. So sánh TalentLMS vs chúng ta

Mức: **P0** = lõi/chặn việc khác · **P1** = giá trị parity cao · **P2** = nice-to-have.

| # | Năng lực | TalentLMS | Mình | Mức | Quyết định |
|---|---|---|---|---|---|
| 1 | Publish → màn học thật | Unit Draft→Publish, khóa tuần tự/skip | Builder ghi blocks; màn học hardcode | **P0** | **BUILD** |
| 2 | WYSIWYG inline (format) | Highlight-to-format toolbar | TipTap có cấu hình, **không có UI** | **P0** | **BUILD** (BubbleMenu) |
| 3 | Block tương tác mới | flashcards, process, hotspot, tabs, charts, Q-in-video | 12 type cơ bản | P1 | **BUILD chọn lọc** |
| 4 | Câu hỏi + chấm điểm | MC, fill-gap, ordering, match, free-text scoring | 10 type khai báo, **không engine chấm** | **P0** | **BUILD** |
| 5 | AI soạn bài | Course creator, Doc import, Content Companion | 100% mock | **P0** | **BUILD (mock phong phú)** |
| 6 | Preview đa thiết bị | desktop/tablet/mobile | 1 preview | P1 | **BUILD (rẻ)** |
| 7 | Draft/Published từng unit | Badge unpublished-changes | Chỉ status cấp course | P1 | **BUILD per-lesson** |
| 8 | Theming/cá nhân hóa | Theme portal + per-branch, white-label | 1 bộ token, không dark | P1 | **BUILD per-course** |
| 9 | Clone nội dung | Clone unit | `cloneBlockDeep`/`duplicate*` | — | **ĐÃ CÓ** |
| 10 | Link/master-propagation | Sửa master lan mọi bản | `embedMaterialId` không lan | P1 | **BUILD (Phase 3)** |
| 11 | Question Library | Bank tự index | Không | P1 | **BUILD (Phase 3)** |
| 12 | PDF/Doc Modern Viewer | Inline | `embed` chip sơ sài | P1 | **BUILD (rẻ)** |
| 13 | Export PDF / in | Có | Không | P1 | **BUILD (lite)** |
| 14 | Analytics | Báo cáo, widget | mock tĩnh | P1 | **PARTIAL** |
| 15 | Learning paths / prereq | Visual paths | section-gating | P2 | **SKIP** |
| 16 | Certificates | Template | Không | P2 | **BUILD lite (sau)** |
| 17 | SCORM/xAPI/LTI/Dispatch | Đầy đủ | nhãn `scorm` | P2 | **SKIP** |
| 18 | Branches-tenant / enrollment | Sub-portal | OrgNode + roles | P2 | **SKIP** |
| 19 | Marketplace/ILT/Zoom/i18n/gamification/offline | Có | Không | P2 | **SKIP** |

---

## 3. Ba trụ cột nâng cấp

> Nguyên tắc xuyên suốt: tái dùng primitive `src/components/ui/` · **không hex / không màu Tailwind thô** · state persist mới phải **optional + additive + migrate không hủy** · mỗi block type mới phải wiring đủ **6 chỗ** (`CourseBlockType`, `BLOCK_TYPES`, `BLOCK_META`, `defaultBlock`, editor branch trong `BlockCard`, render branch trong renderer dùng chung).

### Trụ cột A — Visual / UX Builder

**Hướng chọn:** giữ shell 4-panel nhưng **hạ Palette & AI xuống overlay theo yêu cầu**; biến `/` + floating selection toolbar thành **cử chỉ soạn thảo chính** (mô hình Notion/TalentCraft). Canvas là nhân vật chính.

**Mô hình tương tác đích:** gõ `/` (hoặc hover-`+`) → command palette để chèn; bôi đen → bubble toolbar format + (sau này) AI; click block → chọn, ⚙ mở Inspector phải cho cấu hình sâu.

1. **Canvas là hero** — `PageCanvas` ở giữa, full-width khi 2 panel thu.
2. **`/` → command palette thật** — nâng `SlashMenu` (hiện là `<input>` thủ công) lên dựng trên `src/components/ui/command.tsx` (cmdk): nhóm "Cơ bản / Phương tiện / Tương tác / Học liệu / AI", fuzzy search, keyboard nav. Nút hover-`+` mở **cùng** palette.
3. **TipTap `BubbleMenu` (= Content Companion)** — *đòn bẩy cao nhất của trụ cột này.* TipTap hiện **không phơi UI format nào**. BubbleMenu khi bôi đen: B / I / U / link / H2 / H3 / list / inline-code. (Cụm AI actions ghép vào ở Phase 2 — gọi `aiClient`, ban đầu là mock.)
4. **Hạ Palette & AI thành overlay** — rail icon 48px luôn hiện, panel mặc định thu; `CourseAiPanel` → `Sheet` mở từ nút "AI". Giữ nguyên đường drag-from-materials (`source: "material"` trong `course-builder.tsx`).
5. **Inspector phải (mới, `Sheet`)** — chuyển layout dropdown + animation `<select>` (phần xấu nhất builder) vào Inspector. Floating toolbar chỉ còn 4 verb: drag, duplicate, delete, ⚙.
6. **Giữ `LessonStrip`** (đổi lesson nhanh, hợp K-12), cho collapse + nhớ trạng thái.

**Block mới (ưu tiên):**

| Block | Mức | TalentCraft nguồn | Tái dùng |
|---|---|---|---|
| `accordion` | MUST | Collapsible tabs | `ui/accordion`, pattern child columns |
| `process` (step-by-step) | MUST | Step-by-step process | dnd-kit sort |
| `flashcards` (flip) | MUST | Flip flashcards | `ui/carousel`, CSS 3D |
| PDF Modern Viewer (mở rộng `embed`) | MUST | Modern Viewer | model `embed` sẵn |
| `audio` | SHOULD | Audio | media field |
| `webembed` | SHOULD | Web content / iFrame | sandbox `html-embed` |
| `chart` | SHOULD | Numerical charts | Recharts + token `--chart-1..5` |
| `hotspots` | COULD | Labeled graphics | `ui/popover` |
| Questions-in-video | DEFER | beta cả ở upstream | inline quiz |

**Phác data-model** (thêm vào `CourseBlock`, tất cả optional → migrate không hủy):
```ts
accordionItems?: { id: string; title: string; children: CourseBlock[] }[];
accordionMode?: "single" | "multiple";
processSteps?: { id: string; title: string; body: string; media?: MediaRef }[];
processIntro?: string; processSummary?: string; processStyle?: "numbered" | "timeline" | "carousel";
flashcards?: { id: string; front: string; back: string; frontMedia?: MediaRef; backMedia?: MediaRef }[];
flashcardLayout?: "grid" | "stack";
audioTitle?: string; audioTranscript?: string;            // audio dùng `content` cho src
embedUrl?: string; embedAspect?: "16:9" | "4:3" | "auto"; embedViewer?: "chip" | "inline" | "modal";
chartType?: "bar" | "line" | "pie" | "area"; chartData?: { label: string; value: number }[];
```

**Preview đa thiết bị:** segmented control (Monitor/Tablet/Smartphone) cạnh toggle Edit/Preview, **chỉ hiện khi preview**. Thuần CSS: desktop full-width, tablet `max-w-[768px]`, mobile `max-w-[390px]` + bezel. State **ephemeral, không persist**.

**Draft/Published per-LESSON** (không per-block — tránh over-engineer model phẳng):
```ts
// thêm vào CourseLesson (optional → an toàn migrate)
publishedAt?: number; publishedHash?: string;   // dirty = publishedAt!=null && hash(blocks)!==publishedHash
```
Method store: `publishLesson(courseId, lessonId)` / `getLessonPublishState(): "never"|"published"|"dirty"`. Badge trong `LessonStrip`/`StructureDrawer`: xám=never, `bg-success`=clean, `bg-warning`=dirty. Header thêm nút "Xuất bản thay đổi".

**Cảnh báo cross-cutting:** `cloneBlockDeep` + mọi renderer phải **đệ quy vào MỌI container block mới** (accordion.children, process, columns) — nếu không, bản nhân đôi chia sẻ mảng mutable.

### Trụ cột B — Theming / cá nhân hóa kiểu Claude-design

**Hướng chọn:** theming **per-course**, scope vào một root `data-course-theme` bọc canvas/preview/màn-học — **không bao giờ chạm chrome app**. Lưu **authored-intent** (seed màu + font-pair + radius/density), **không** lưu CSS vars; ramp/contrast/dark **derive khi đọc**.

**Seam kỹ thuật:** mọi thứ đã chạy qua CSS var 3 lớp (primitive→semantic→`@theme inline`). Re-bind một tập nhỏ var trong một scope tự re-skin mọi `bg-primary` con — không đụng component. App chrome nằm ngoài scope → luôn MobiFone.

**Kiến trúc token (mở rộng, không thay):**
```
L0 primitive (fig-tokens.css)  — giữ nguyên, global
L1 semantic  (colors/styles)   — giữ nguyên (mặc định = MobiFone)
   + MỚI: token "course-*": --course-accent/-soft/-fg, --course-surface(-2),
          --course-ink(-muted), --callout-{info,tip,warn,danger}-{bg,fg,border},
          --course-radius, --course-density, --course-shadow, --course-heading/body-font
L2 course override (data-course-theme, inline style 1 root) — MỚI, scoped
L3 component — đọc course-* token; KHÔNG thấy hex
```
Mọi `--course-*` **fallback về token global** → ship lớp token là *net win* cho DS ngay cả khi chưa ai chọn theme (đồng thời dọn vi phạm callout/code/`thumbnailColor` hex).

**6 system theme:** MobiFone Default · Toán/STEM · Văn/Humanities · Mầm non playful · Trung học clean · Bản tối (Dark). Mỗi theme = 1 accent seed + font-pair (allow-list) + radius/density/callout-flavor; ramp sinh từ seed bằng OKLCH.

**Picker kiểu Claude-Artifacts:** tab "Giao diện" trong panel phải; grid `Card`, mỗi card là **mini-render LIVE nội dung thật của tác giả** ở `scale(0.4)` trong scope theme. Hover = preview full debounced; click "Áp dụng"; "Tùy chỉnh" mở editor.

**Custom editor + guardrails:**
- Accent: chọn 1 seed → ramp 11 bước OKLCH → `--course-accent`=600, soft=50, `accent-fg` auto trắng/ink đạt ≥4.5:1.
- **Body-ink khóa cứng** đạt AA; accent auto-nudge + badge AA/AAA live.
- Font: **chỉ allow-list** self-hosted đủ dấu tiếng Việt (CSP chặn remote font).
- Radius/density/shadow: **snap vào scale token**; semantic trạng thái cố định (danger luôn họ đỏ).

**Data-model (store riêng, versioned, non-destructive migrate):**
```ts
interface CourseTheme {
  schemaVersion: 1; base: SystemThemeId | "custom";
  accentSeed: string; fontPairId: FontPairId; radiusStep: number; density: "compact"|"cozy"|"spacious";
  shadow: number; hero?: string; headingScale?: number;
  mode: "light"|"dark"|"auto"; callouts?: Partial<CalloutOverrides>;
}
interface CourseThemeState {
  themes: Record<string /*courseId*/, CourseTheme>;   // applied (persist)
  drafts: Record<string, CourseTheme>;                // editor working copy (KHÔNG persist)
  getResolved(courseId: string, mode?: "light"|"dark"): CourseThemeVars;  // pure: intent → CSS var map + contrast + dark
}
```
Persist `"gk-course-theme"` version 1, **default `{}`**, `partialize` chỉ `themes`, `migrate` *transform tiến* (không trả `{}`). Clone course → copy theme. Dark variant **derive** (không tái dùng `.dark` global non-MobiFone).

**Một theme, ba bề mặt:** editor-preview = màn-học = thumbnail/cert, qua `getResolved` là nguồn duy nhất. `thumbnailColor` hex hiện tại → derive từ `theme.accent`.

### Trụ cột C — AI workflow storyboard-first (mock-data, client-side)

**Hướng chọn:** xây *trải nghiệm* **storyboard-first agentic multi-block fill** thật, nhưng **dữ liệu do `mockAiClient` sinh ra** (không gọi API). Đây vẫn là điểm khác biệt UX so với TalentLMS (họ không có plan review được), và để sẵn đường cắm AI thật về sau.

**Pipeline 5 stage (UX giữ nguyên, backend = mock):**
1. **Intake** — môn/lớp/chủ đề/mục tiêu/thời lượng (form). *(Document import PDF/DOCX = DEFER — cần parsing nặng; có thể mock "dán văn bản" thay cho upload.)*
2. **Storyboard** — `mockAiClient` trả **plan có cấu trúc** từ template theo môn/lớp: section → item (intent + blockType + learningGoal). Sửa/kéo-thả/regenerate-1-item được.
3. **Approve/edit** — tác giả sửa intent, reorder, đổi loại, xóa, thêm → approve mở khóa stage 4.
4. **Agentic fill tuần tự (stream giả lập vào canvas)** — orchestrator duyệt storyboard, mỗi item `addBlock(...)` lấy `blockId` → `updateBlock` với nội dung mock (template theo blockType + chủ đề). Có thể giả lập streaming bằng cập nhật từng phần (`setTimeout`) để UX mượt.
5. **Refine & finish** — Content Companion (BubbleMenu, mock transforms: rút gọn/mở rộng/đổi giọng = biến đổi chuỗi đơn giản), quiz-from-content (mock sinh `Question[]`), publish analysis (thay điểm giả 92% bằng **rubric tính toán thật từ nội dung**: đếm block, độ dài, có quiz chưa…).

**Data-model (store riêng, ephemeral draft):**
```ts
// src/stores/storyboard.ts — version 1, name "gk-storyboard"
interface StoryboardItem { id: string; blockType: CourseBlockType; intent: string; learningGoal: string;
  status: "planned"|"filling"|"filled"|"edited"|"skipped"; blockId?: string; calloutVariant?: string; codeLanguage?: string }
interface StoryboardSection { id: string; title: string; items: StoryboardItem[] }
interface Storyboard { lessonId: string; status: "draft"|"approved"|"filling"|"done"; sections: StoryboardSection[]; meta: IntakeMeta }
```

**`AiClient` interface (giữ để future-proof; Phase này CHỈ có `mockAiClient`):**
```ts
interface AiClient {
  generateStoryboard(req): Promise<Storyboard> | AsyncIterable<StoryboardEvent>;
  fillBlock(req): Promise<Partial<CourseBlock>> | AsyncIterable<FillEvent>;
  regenerateItem(req): Promise<StoryboardItem>;
  companionEdit(req): Promise<{ content: string }>;
  quizFromContent(req): Promise<Question[]>;
  analyzeForPublish(req): Promise<PublishAnalysis>;
  suggestTheme(req): Promise<Partial<CourseTheme>>;
}
// impl Phase 2: mockAiClient (deterministic + template theo môn/lớp/blockType).
// Tương lai (ngoài scope 4 phase): serverAiClient qua createServerFn.
```

**Chất lượng mock:** mock vẫn validate-shape bằng Zod (đảm bảo block hợp lệ), `blockType` enum = đúng 12 type của mình, map đúng field `defaultBlock()`. Mock **không bịa URL ảnh/video** → trả caption + placeholder; `embed` trả `embedQuery` để mở kho học liệu đã lọc. Mọi nội dung mock gắn nhãn **"AI-generated (demo) — cần giáo viên kiểm duyệt"** → vào hàng review `pending` (giữ pattern an toàn K-12 + forward-compat khi có AI thật).

**Re-skin các panel mock đang vi phạm DS** (`course-ai-panel`, `quiz/ai-panel`, `publish-sheet`) sang token trong cùng đợt.

---

## 4. Kiến trúc & ranh giới module

Mục tiêu: **UI phụ thuộc interface, không phụ thuộc Zustand/localStorage** → backend slot vào sau bằng đổi adapter (Repository pattern).

```ts
// 1) Repository — đổi localStorage → API = 1 adapter
interface CourseRepository { get(id); save(id, data); listLessons(courseId); publishLesson(...); ... }
interface ContentRepository { findAll(filter); findById(id); create; update; delete; }
interface AttemptRepository { record(attempt); listByLesson(lessonId); }   // cho chấm điểm
interface ThemeRepository { get(courseId); save; delete; listSystemThemes(); }

// 2) AiClient — ẩn transport; UI chỉ import cái này (Phase này = mockAiClient)
//    (xem định nghĩa ở Trụ cột C)

// 3) Block registry — 1 nguồn cho 6 chỗ wiring + 1 shared renderer
interface BlockDef { type; meta; defaultBlock(); EditView; PreviewView; cloneDeep(block); }
// <BlockRenderer mode="edit"|"preview"|"learn"> dùng chung builder + preview + màn học
```

**Shared `<BlockRenderer>` là khớp nối quan trọng nhất:** nối vòng publish→learner (§1.1), gom màu về một chỗ token-bound (chống DS drift), mở khóa export PDF/cert.

**Không có mảnh backend nào trong 4 phase** (do AI mock-only). Khung `createServerFn` được ghi nhận cho tương lai (AI thật / đồng bộ đa thiết bị), không dùng bây giờ.

---

## 5. Lộ trình 4 phase

**Gate mỗi phase (CLAUDE.md):** `npx tsc --noEmit` · `npm run test` (vitest) · `npm run build` · self-check diff UI: không `#[0-9a-fA-F]`, không `bg-[`/`text-[` màu thô.

### Phase 0 — Nền tảng & quick win
- **0.1 (S)** Persist `useQuiz`; thay `migrate→wipe` ở `course.ts`/`content.ts` bằng migrate field-level **không hủy**. *Prereq tin được mọi persist.*
- **0.2 (S)** De-hardcode DS drift (callout/code/AI-panel/block-card) → token; thêm `--color-code-surface`.
- **0.3 (S–M)** Repository interface + wrap store hiện có (không đổi hành vi).
- **0.4 (S)** Preview đa thiết bị (CSS-only viewport toggle).
- **0.5 (S)** Lớp token `--course-*` + bọc `PageCanvas` trong `data-course-theme`, ship **MobiFone Default** (net DS win).

### Phase 1 — Builder hoàn chỉnh + màn học thật
- **1.1 (M)** **Shared `<BlockRenderer mode>`** + Block registry. *Depends 0.2/0.3.*
- **1.2 (M)** **Publish→learner pipeline**: snapshot blocks khi publish; màn học render `courseData` thật (xóa `SECTIONS` hardcode). *Depends 1.1.* — **P0 trung tâm.**
- **1.3 (M)** **WYSIWYG**: TipTap BubbleMenu (format). *Depends 0.2.*
- **1.4 (M)** Engine chấm điểm `gradeQuestion` (MC-family) + store `useAttempts` (persist); nối `quiz-settings` passScore/retry. *Depends 0.1/1.1.*
- **1.5 (M)** Block tương tác: accordion, process, flashcards, PDF viewer. *Depends 1.1.*
- **1.6 (S)** Per-lesson publish badge + "Xuất bản thay đổi". *Depends 1.2.*
- **1.7 (S)** Export PDF/in qua print-stylesheet của shared renderer. *Depends 1.1.*

### Phase 2 — AI storyboard-first (mock-data, client-side)
- **2.1 (S–M)** `AiClient` interface + `mockAiClient` (template theo môn/lớp/blockType, Zod-validate shape).
- **2.2 (M)** Rebuild `CourseAiPanel` thành surface storyboard (token-clean) + `useStoryboard` store. *Depends 0.2.*
- **2.3 (M)** Agentic fill nối `addBlock`/`updateBlock` (stream giả lập); nhãn "AI demo — cần kiểm duyệt" → review `pending`; BubbleMenu AI actions (mock transforms, nối 1.3). *Depends 2.1/2.2/1.3.*
- **2.4 (M)** Quiz-from-content (mock) + Quick-Insert; thay mock `quiz/ai-panel` + `publish-sheet` (điểm giả → rubric tính thật). *Depends 2.1/1.4.*
- **2.5 (S)** SHOULD: "dán văn bản → storyboard" (mock) thay cho document import.

### Phase 3 — Theming tùy biến + reuse + assessment depth
- **3.1 (M)** System gallery + picker "Giao diện" (preview live nội dung thật) + `useCourseTheme` store + `ThemeRepository`. *Depends 0.5.*
- **3.2 (M)** Custom theme editor (OKLCH ramp + contrast guardrails, font allow-list, slider radius/density) + dark/reduced-motion derive. *Depends 3.1.*
- **3.3 (M)** Question Library; Link/master-propagation (`linkedMaterialId` resolve-live); formalize Files repo. *Depends 1.4/1.1/0.3.*
- **3.4 (M)** Thumbnail/cert pipeline off `getResolved`. *Depends 3.1.*
- **3.5 (S–M)** Capture learning-event local → thay mock `org/analytics`. *Depends 1.2/1.4.*

### Phase 4 — Chỉ khi có backend + người dùng thật (ngoài scope hiện tại)
AI thật (`serverAiClient` qua `createServerFn` + API key server-side), đồng bộ đa thiết bị, analytics dashboard thật, manual grading, free-text/essay scoring, collaboration. Gated trên backend + auth thật.

**Xương sống phụ thuộc:** `0.1/0.3/0.5 → 1.1 → {1.2,1.3,1.4,1.5} → {2.1→2.2→2.3,2.4} → {3.1→3.2, 3.3, 3.4, 3.5}`.

---

## 6. YAGNI — cố tình bỏ qua từ TalentLMS

| Bỏ qua | Lý do (K-12 VN) | Đã phủ bởi |
|---|---|---|
| SCORM/xAPI/cmi5/LTI, Dispatch | Interop doanh nghiệp | nhãn `scorm` giữ nguyên |
| ILT / Zoom-Teams / webinar | Công cụ soạn async | — |
| Marketplace / Course Store / OpenSesame | Giáo dục công, không thương mại | `AccessTerms` giữ là nhãn |
| White-label / per-branch theme / custom domain / branded app | **Xung đột** MobiFone Untitled UI bắt buộc | theming **per-course** đủ cá nhân hóa |
| Branches-tenant / enrollment / auto-enroll / learning paths | K-12 chương trình cố định | OrgNode + capability roles + section-gating |
| i18n UI 30+ / dịch 40+ ngôn ngữ | Đối tượng tiếng Việt | giữ vi↔en |
| AI thật / image-gen / video-avatar / TTS | Quyết định #2: mock-only | mock template; thumbnail brand-color |
| Learner-side AI (Coach, Playground, Pathfinder) | Công cụ soạn, không phải runtime; chat LLM với trẻ rủi ro | hoãn |
| Assignments + Grading Hub đầy đủ / Surveys / countdown | Assessment-ops | chấm MC tự động local đủ 80% |
| PPT→video / auto-convert tài liệu | Bất khả thi client-side | PDF Modern Viewer + "dán văn bản" |

---

## 7. Rủi ro & cách giảm thiểu

1. **Persist-stale-seed / mất dữ liệu (cao nhất, đang sống).** Phase 0.1 — migrate field-level *bảo toàn* `courseData`/item, chỉ rewrite hàng seed; gate seed sau cờ "is-user-created?"; default store theme/storyboard **rỗng**. Mọi field mới optional + additive.
2. **localStorage → backend.** Phase 0.3 repository interface (UI phụ thuộc `*Repository`) → cutover = 1 adapter; làm export/import JSON làm lối thoát sớm.
3. **Design-system drift.** self-check CLAUDE.md (no hex, no `bg-[`/`bg-blue-*`); chạy `/mobifone-ui` trước mọi UI; shared `<BlockRenderer>` gom màu về một chỗ; lớp `--course-*` (0.5) tự dọn vi phạm.
4. **Nested-block recursion bug.** Logic clone đặt trong `BlockDef.cloneDeep` (một nguồn); test đệ quy bắt buộc cho mỗi container block.
5. **Mock "giả mà giống thật".** Vì AI là mock, phải gắn nhãn rõ "AI demo" để không nhầm là sinh từ LLM thật; rubric publish phải tính từ nội dung thật (không hard-code 92%) để số liệu không sai lệch.

---

## 8. Tổng hợp field/model mới (checklist wiring)

- `CourseBlock`: + `accordion*`, `process*`, `flashcards*`, `audio*`, `embedUrl/embedAspect/embedViewer`, `chart*` (mục 3A). Mỗi type mới wiring đủ 6 chỗ + `cloneDeep` đệ quy.
- `CourseLesson`: + `publishedAt`, `publishedHash` (per-lesson publish).
- Store mới: `useAttempts` (persist), `useCourseTheme` (persist `themes`, draft không persist), `useStoryboard` (ephemeral).
- `useQuiz`: thêm persist (Phase 0.1).
- `migrate` của `useCourse`/`useContent`: viết lại field-level không hủy (Phase 0.1).
- Token: `--course-*` family + `--color-code-surface` + `--chart-1..5`.
- Interfaces: `CourseRepository`/`ContentRepository`/`AttemptRepository`/`ThemeRepository`, `AiClient` (+ `mockAiClient`), `BlockDef` registry, `<BlockRenderer mode>`.

---

## 9. Chiến lược test (đáp ứng gate vitest)

- **Pure functions** (ưu tiên TDD): `gradeQuestion` (mọi dạng MC-family), `hash(blocks)` cho dirty-state, `getResolved` theme (intent→vars + contrast AA), OKLCH ramp generator, `cloneDeep` đệ quy container.
- **Store migrate**: test migrate **không** mất dữ liệu khi bump version (regression cho rủi ro #1).
- **mockAiClient**: test shape hợp lệ (Zod) + blockType ∈ 12 type.
- **Renderer**: snapshot 3-mode cho mỗi block type (đảm bảo builder/preview/learn nhất quán).

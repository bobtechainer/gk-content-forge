# SRS — GK Content Studio (gk-content-forge)

**Tài liệu Đặc tả Yêu cầu Phần mềm (Software Requirements Specification)**

| | |
|---|---|
| **Sản phẩm** | GK Content Studio — Studio tạo & quản lý học liệu cho hệ sinh thái "Trường học số" |
| **Repo / Codebase** | `gk-content-forge` (package: `tanstack_start_ts`) |
| **Phiên bản tài liệu** | 1.0 — tổng hợp toàn bộ tính năng đã triển khai |
| **Ngày** | 2026-06-11 |
| **Trạng thái** | Prototype/Demo (frontend, dữ liệu mock — chưa có backend thật) |
| **Nguồn tổng hợp** | Mã nguồn `src/*` + 3 spec thiết kế trong `docs/superpowers/specs/` + bộ nhớ kiến trúc dự án |

> **Ghi chú phạm vi:** Đây là bản dựng **frontend SPA/SSR** với toàn bộ dữ liệu là **mock/in-memory** (Zustand + `persist` vào `localStorage`). Các phần "AI", "upload file", "preview", "thông báo" hiện ở mức **demo (toast/giả lập)**. SRS này mô tả cả yêu cầu sản phẩm (intended) và hiện trạng triển khai (xem §12 Ma trận hiện trạng).

---

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu này đặc tả đầy đủ yêu cầu chức năng và phi chức năng của **GK Content Studio** — một nền tảng (studio) cho phép giáo viên cá nhân, tổ chức/nhà xuất bản và quản trị viên **tạo, soạn thảo, quản lý, xuất bản và kiểm duyệt học liệu số** (sách, khóa học, bộ đề, và 9 loại học liệu tương tác/tệp đính kèm) phục vụ hệ sinh thái "Trường học số".

### 1.2. Phạm vi sản phẩm

GK Content Studio cung cấp:

- **Một giao diện Studio hợp nhất (unified shell)** phục vụ 3 nhóm đối tượng qua 3 không gian làm việc (workspace): **Cá nhân (Creator)**, **Tổ chức (Organization)**, **Quản trị (Admin)**.
- **Quy trình sáng tạo nội dung** end-to-end: Chọn loại → Builder/Upload → Lưu nháp → Xem trước → Xuất bản.
- **Thư viện nội dung** đa tầng lọc với chế độ bảng/lưới.
- **Trang Kênh công khai** (giống YouTube channel) kèm chế độ chỉnh sửa.
- **Quy trình xin tích xanh (verification)** theo checklist tiêu chí.
- **Bảng điều khiển quản trị** để duyệt nội dung, duyệt xác minh, xử lý báo cáo, quản lý người dùng và cấu hình hệ thống.
- **Quản lý thành viên tổ chức** với phân quyền Owner/Manager/Editor.

### 1.3. Định nghĩa & thuật ngữ

| Thuật ngữ | Ý nghĩa |
|---|---|
| **Shell** | Khung giao diện (sidebar + header + bottom nav) bao quanh trang nội dung. Toàn hệ thống dùng **một** `ContentStudioShell` tham số hóa. |
| **Workspace** | Không gian làm việc hiện hành: `personal` (cá nhân) hoặc `org` (tổ chức). |
| **Scope** | Phạm vi dữ liệu của một trang: `creator` \| `org` \| `admin`. |
| **Builder** | Trình soạn thảo chuyên dụng (Quiz Builder, Book Builder, Course Builder). |
| **Học liệu (learning material)** | Nhóm 9 loại nội dung nhỏ (quiz, bài giảng, nâng cao, SCORM, tài liệu, video, hình ảnh, âm thanh, 3D/VR). |
| **Tích xanh (verified)** | Trạng thái tài khoản đã được xác minh uy tín. |
| **Role / RoleId** | Vai trò tài khoản demo: `teacher`, `verified_teacher`, `publisher`, `admin`. |
| **Org membership** | Tư cách thành viên của tài khoản cá nhân trong một tổ chức (kèm vai trò). |

### 1.4. Tài liệu tham chiếu

- `docs/superpowers/specs/2026-06-10-content-studio-v2-design.md` — Thiết kế kiến trúc toàn diện v2.
- `docs/superpowers/specs/2026-06-10-unified-studio-ui-design.md` — Hợp nhất 3 shell, thư viện dạng bảng, channel 2 tab.
- `docs/superpowers/specs/2026-06-11-content-studio-v2-fixes-design.md` — Kho học liệu trong Quiz, định danh org workspace.
- `docs/research_platform_studio_report.md` — Báo cáo nghiên cứu nền tảng studio.

### 1.5. Tổng quan tài liệu

§2 mô tả tổng thể & actor; §3 kiến trúc; §4 yêu cầu chức năng (phần chính); §5 mô hình dữ liệu; §6 yêu cầu giao diện; §7 phi chức năng; §8 ma trận phân quyền; §9 quy tắc nghiệp vụ; §10 phụ lục taxonomy/route; §11 dữ liệu seed; §12 ma trận hiện trạng triển khai.

---

## 2. Mô tả tổng thể

### 2.1. Bối cảnh sản phẩm

GK Content Studio là một ứng dụng web độc lập (frontend) dùng để **sản xuất nội dung** đầu vào cho các nền tảng phân phối: "Trường học số quốc gia" (`national`) và "GK Ebooks" (`ebooks`). Sản phẩm lấy cảm hứng giao diện từ YouTube Studio (creator), Google Workspace Admin (org) và Admin Panel (admin).

### 2.2. Nhóm chức năng chính

1. Xác thực & chuyển đổi vai trò/không gian làm việc (demo).
2. Điều hướng theo vai trò (sidebar/bottom-nav/header thích ứng).
3. Dashboard phân tích (cá nhân / tổ chức / hệ thống).
4. Thư viện nội dung (lọc theo loại, loại con, trạng thái, tìm kiếm; bảng/lưới).
5. Tạo nội dung (Modal Hub) → Builder hoặc Form Upload.
6. Quiz Builder (10 loại câu hỏi, AI panel, OCR, đính kèm học liệu).
7. Xuất bản nội dung (AI phân tích chất lượng + chọn nền tảng).
8. Trang Kênh công khai + chỉnh sửa kênh.
9. Quy trình xin tích xanh (checklist tiêu chí + trạng thái đã xác minh).
10. Quản lý thành viên tổ chức (mời/đổi vai trò/gỡ).
11. Cài đặt tài khoản (hồ sơ, bảo mật, giao diện, thông báo, phân phối, quyền riêng tư).
12. Quản trị: duyệt nội dung, duyệt xác minh, xử lý báo cáo, quản lý người dùng, cấu hình hệ thống.

### 2.3. Actor & đặc điểm người dùng

| Actor | RoleId | accountType | Tích xanh | Đặc điểm & quyền |
|---|---|---|---|---|
| **Giáo viên cá nhân (chưa xác minh)** | `teacher` | Cá nhân | `none` | Tạo/quản lý học liệu của mình; có membership trong 1 tổ chức (vai trò editor) ⇒ có thể chuyển sang workspace tổ chức. |
| **Giáo viên đã xác minh** | `verified_teacher` | Cá nhân | `L2` | Như trên + nội dung **tự động xuất bản** (không qua duyệt). Membership vai trò manager. |
| **Tổ chức / NXB** | `publisher` | Doanh nghiệp | `L2` | Làm việc trực tiếp ở workspace tổ chức; multi-manager; quản lý thành viên; nội dung tự xuất bản. |
| **Quản trị viên** | `admin` | Admin | `admin` | Toàn quyền: duyệt nội dung/xác minh, xử lý báo cáo, khóa tài khoản, cấu hình hệ thống. Không tạo nội dung. |

**Điểm khác biệt cốt lõi Cá nhân ↔ Doanh nghiệp:** Doanh nghiệp hỗ trợ **multi-manager** (nhiều người cùng quản trị kênh với phân quyền Owner/Manager/Editor); Cá nhân chỉ một chủ sở hữu.

### 2.4. Môi trường vận hành & công nghệ

| Hạng mục | Lựa chọn |
|---|---|
| Framework | **React 19** + **TanStack Start** (SSR) + **TanStack Router** (file-based) |
| Server runtime | Nitro (SSR/serverless build) |
| Build/dev | **Vite 7**; `npm run dev` (dev server, cổng dev mặc định 8080), `npm run build`, `npm run preview` |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) + `tw-animate-css` |
| UI components | **shadcn/ui** trên nền **Radix UI** (accordion, dialog, dropdown, select, tabs, sheet, drawer, …) |
| Biểu đồ | **Recharts** (line/donut/pie/bar) — render sau khi mounted để tránh lỗi SSR/hydration |
| Animation | **framer-motion** |
| Kéo–thả | **@dnd-kit/core, sortable, utilities** |
| Rich text | **TipTap** (`@tiptap/react` + starter-kit, underline, placeholder) |
| State | **Zustand** (+ `persist` middleware) |
| Form & validation | **react-hook-form** + **zod** + `@hookform/resolvers` |
| Toast | **sonner** (richColors, top-right) |
| Icon | **lucide-react** + bộ FileIcon SVG (`public/book/*.svg`) |
| Khác | date-fns, embla-carousel, cmdk, vaul, input-otp, react-day-picker, react-resizable-panels |
| Test | **Vitest** + Testing Library + jsdom; lint ESLint; format Prettier |

### 2.5. Ràng buộc

- **RB-1:** Toàn bộ dữ liệu là **mock** (`src/lib/mock-data.ts`); không có API backend thật.
- **RB-2:** Lưu trữ qua `localStorage` (key `gk-session` cho session/ui, `gk-content` cho nội dung). Store quiz là **in-memory** (không persist).
- **RB-3:** Giao diện và nội dung mặc định bằng **tiếng Việt**.
- **RB-4:** Biểu đồ chỉ render phía client (sau cờ `mounted`) để an toàn SSR.
- **RB-5 (kiến trúc — không được "sửa ngược"):**
  - Route dùng tiền tố **`creator.*` / `org.*` / `admin.*`** (non-pathless) để tạo URL đúng `/creator/*`, `/org/*`, `/admin/*`.
  - Chỉ **một** `content-studio-shell.tsx` tham số hóa (theo `roleId` + `workspace`), không tách 3 shell riêng.
  - Route builder (`*/builder/*`) **tự thu gọn** shell, render `<Outlet/>` full-screen.

### 2.6. Giả định & phụ thuộc

- Người dùng truy cập bằng trình duyệt hiện đại hỗ trợ ES2020+.
- Đăng nhập là cơ chế demo (chọn tài khoản mẫu), không có mật khẩu thật.
- Mock data có **1 tổ chức** ⇒ tài khoản cá nhân dùng `orgMemberships[0]` khi vào workspace org.

---

## 3. Kiến trúc hệ thống

### 3.1. Shell hợp nhất theo vai trò

- **AR-1:** Một component `ContentStudioShell` dựng sidebar + header + bottom-nav, **tự cấu hình theo `roleId` và `workspace`** từ store session.
- **AR-2:** Sidebar chia **mục theo vai trò/không gian** (`getNavSections`):
  - **Cá nhân** (`teacher`/`verified_teacher`, workspace=personal): Trang chủ, Thư viện của tôi, Kênh của tôi, Xác minh tài khoản.
  - **Tổ chức** (`publisher`, hoặc cá nhân khi workspace=org): Trang chủ, Thư viện tổ chức, Kênh tổ chức, Quản lý thành viên, Xác minh tổ chức.
  - **Quản trị** (`admin`): Tổng quan, Quản lý người dùng, Duyệt nội dung (badge), Duyệt xác minh (badge), Báo cáo vi phạm (badge), Cấu hình hệ thống.
  - **Footer:** Cài đặt (`/creator/settings` hoặc `/org/settings`; admin không có footer).
- **AR-3:** Header gồm: logo "Trường học số", tiêu đề shell động (Content Studio / Org Studio / Admin Console), thanh tìm kiếm (ẩn với admin), Role Switcher, nút **Tạo mới** (ẩn với admin), chuông thông báo (badge chấm đỏ), avatar người đang đăng nhập + tích xanh.
- **AR-4:** **Workspace Switcher** (trong sidebar) chỉ hiện cho **tài khoản cá nhân có org membership**: chuyển giữa "Kênh cá nhân" và tổ chức; chuyển workspace điều hướng tới `/creator/dashboard` hoặc `/org/dashboard`.
- **AR-5:** Avatar góc phải header **luôn là người đăng nhập** (`ACCOUNTS[roleId]`), kể cả khi đang ở workspace org (quyết định sản phẩm).

### 3.2. Cấu trúc Route

- **AR-6:** Route file-based; layout route `creator.tsx`/`org.tsx`/`admin.tsx` đều render `<ContentStudioShell/>`. `index.tsx` redirect `/` → `/creator/dashboard`.
- **AR-7:** Builder routes render full-screen (shell phát hiện `pathname.includes("/builder/")`).
- **AR-8:** Trang body là **view chia sẻ theo scope** trong `src/components/shared/*`, được map qua **barrel** `src/components/studio-pages.tsx` (DashboardPage, LibraryPage, ChannelPage, …) — route truyền `scope`.

Bảng route đầy đủ: xem **§10.3**.

### 3.3. Quản lý trạng thái (Zustand stores)

| Store | File | Trạng thái & hành vi | Persist |
|---|---|---|---|
| **session** | `stores/session.ts` | `roleId`, `workspace`; `setRole` (đặt role + reset workspace=personal), `setWorkspace`. | `gk-session` |
| **content** | `stores/content.ts` | `items: ContentItem[]` (seed); `createDraft`, `updateItem`, `deleteItem`, `duplicateItem`, `setStatus`, `publish`. | `gk-content` |
| **quiz** | `stores/quiz.ts` | `questionsByQuiz`, `blankIds`; `init`, `addQuestion`, `addBlank`, `replaceQuestion`, `updateQuestion`, `deleteQuestion`, `reorder`. | **Không** (in-memory) |
| **ui** | `stores/ui.ts` | `librarySearch`, `libraryViewMode ("table"\|"grid")` + setters. | có |

### 3.4. Phân vùng dữ liệu theo scope (`use-scoped-content.ts`)

- **AR-9:** `useScopedContent(scope)`:
  - `admin` (hoặc role admin) → trả **toàn bộ** items.
  - `org` → chỉ items có `ownerId === resolveActiveOrgId(roleId)` (không lẫn nội dung cá nhân).
  - `creator` → chỉ items có `ownerId === roleId`.
- **AR-10:** `resolveActiveOrgId(roleId)`: `publisher` → chính nó; cá nhân → `orgMemberships[0].orgId` (mặc định `publisher`).
- **AR-11:** `useActiveAccount(scope)` (`use-active-account.ts`): ở scope `org` (không phải admin) trả về **tài khoản tổ chức**; ngược lại trả tài khoản đang đăng nhập. Các view org-scope (Channel, ChannelEdit, Dashboard, Settings, Verification) dùng hàm này để hiển thị danh tính tổ chức.
- **AR-12:** Nội dung tạo trong workspace org có `ownerId` = org (shell truyền `createOwnerId = resolveActiveOrgId(roleId)`).

---

## 4. Yêu cầu chức năng

> Quy ước ID: `FR-<MODULE>-<n>`. "Demo" = hành vi giả lập (toast/animation, chưa nối backend).

### 4.1. FR-AUTH — Đăng nhập & chuyển vai trò/workspace

- **FR-AUTH-1:** Trang `/login` hiển thị 4 thẻ tài khoản demo (logo + badge "Demo Mode"); mỗi thẻ: avatar màu, tên + tích xanh, loại tài khoản, mô tả, link "Vào dashboard".
- **FR-AUTH-2:** Chọn thẻ → `setRole(id)` → điều hướng theo `getDefaultAppPath(accountType)`: personal → `/creator/dashboard`, organization → `/org/dashboard`, admin → `/admin/dashboard`.
- **FR-AUTH-3:** Shell tự redirect về `/login` nếu `roleId` rỗng.
- **FR-AUTH-4:** **Role Switcher** (header): popover liệt kê 4 vai trò; chọn → `setRole` + điều hướng dashboard tương ứng; vai trò hiện hành được highlight.
- **FR-AUTH-5:** **Workspace Switcher** (sidebar, chỉ cá nhân có membership): chọn "Kênh cá nhân" hoặc tổ chức → `setWorkspace` + điều hướng dashboard tương ứng; hiển thị vai trò trong tổ chức (Chủ sở hữu/Quản lý/Biên tập viên).

### 4.2. FR-NAV — Điều hướng & shell thích ứng

- **FR-NAV-1:** Sidebar desktop (≥1024px) cố định, rộng 72; chia mục có tiêu đề; mục active được tô nền.
- **FR-NAV-2:** Tablet/mobile: sidebar thành **drawer** (Sheet) mở từ nút hamburger.
- **FR-NAV-3:** **Bottom nav** mobile (<1024px) cho creator/org: 2 mục trái + nút **Tạo mới** tròn nổi ở giữa + 2 mục phải + menu **"Thêm"** (overflow) cho các mục còn lại.
- **FR-NAV-4:** Badge số đếm trên mục Admin: Duyệt nội dung = số `pending`, Duyệt xác minh = số đơn `pending`, Báo cáo = số report `open`.
- **FR-NAV-5:** Thanh tìm kiếm header: desktop inline, mobile mở overlay full-width; Enter → lưu `librarySearch` + điều hướng tới thư viện theo scope.

### 4.3. FR-DASH — Dashboard

**Creator/Org (`dashboard-view.tsx`, scope creator|org):**
- **FR-DASH-1:** **AI Assistant Card** đầu trang: nền gradient, icon sparkle, hiệu ứng gõ chữ (typing), tip xoay vòng (5s), nội dung tip khác nhau theo scope.
- **FR-DASH-2:** **4 Stat Card**: Tổng lượt xem (đếm động), Tổng lượt thích, Đã xuất bản, Người theo dõi — kèm chỉ số xu hướng (vd "+12% so với kỳ trước").
- **FR-DASH-3:** **Biểu đồ đường** "Lượt xem theo thời gian" với toggle 7/30/90 ngày.
- **FR-DASH-4:** **Biểu đồ donut** "Phân bổ nội dung" theo loại học liệu + chú giải đếm.
- **FR-DASH-5:** **Top nội dung nổi bật**: xếp hạng 5 item theo lượt xem, mũi tên xu hướng; click → mở builder tương ứng.
- **FR-DASH-6:** **Hoạt động gần đây**: timeline 5 hành động (đã xuất bản/đã tạo nháp) kèm thời gian.
- **FR-DASH-7 (Org bổ sung):** Biểu đồ cột "Đóng góp theo thành viên" + lưới thẻ thành viên đang hoạt động (vai trò + số bài).

**Admin (`admin-pages.tsx` → AdminDashboardPage):**
- **FR-DASH-8:** 4 stat: Tổng người dùng, Nội dung chờ duyệt, Đơn xác minh, Báo cáo vi phạm.
- **FR-DASH-9:** Biểu đồ "Tăng trưởng hệ thống" (người dùng & nội dung theo thời gian).
- **FR-DASH-10:** Biểu đồ tròn "Phân bổ tài khoản" (Cá nhân/Doanh nghiệp/Đã xác minh).
- **FR-DASH-11:** "Hàng đợi xử lý": tối đa 4 nội dung pending mới nhất + CTA "Duyệt ngay".

### 4.4. FR-LIB — Thư viện nội dung

(`library-view.tsx` + `material-tabs.tsx` + `content-table.tsx` + `content-card.tsx`; scope creator|org|admin)

- **FR-LIB-1:** Tiêu đề theo scope: "Thư viện của tôi" / "Thư viện tổ chức".
- **FR-LIB-2:** **4 tab ngang** (kiểu YouTube Studio): **Bộ sách** (`book`) · **Khóa học** (`course`) · **Học liệu tương tác** (`quiz, lesson, advanced, scorm`) · **Tệp đính kèm** (`document, video, image, audio, 3d_vr`).
- **FR-LIB-3:** **Chip lọc loại con** (xuất hiện ở tab tương tác/đính kèm): "Tất cả" + các loại có trong tab; đổi tab reset loại con.
- **FR-LIB-4:** **Chip lọc trạng thái** (đơn chọn, bật/tắt): Nháp · Chờ duyệt · Đã xuất bản · Bị từ chối.
- **FR-LIB-5:** **Toggle Bảng/Lưới** (mặc định **bảng**); lưu trong `ui.libraryViewMode`.
- **FR-LIB-6:** Tìm kiếm (từ header) lọc theo tiêu đề / môn / tags (không phân biệt hoa thường).
- **FR-LIB-7 (Bảng):** cột Tiêu đề (+thumbnail/icon), Loại, Trạng thái (badge màu), Ngày tạo, Lượt xem; **org thêm cột "Tác giả"**; cột Hành động: Xem trước / Sửa / Xóa.
- **FR-LIB-8 (Lưới):** thẻ với icon, tiêu đề (2 dòng), meta (loại•môn•lớp), badge trạng thái, ngày, lượt xem/likes, **menu ⋮**: Sửa, Xem trước (demo), Nhân bản (toast "Đã nhân bản…"), Xóa.
- **FR-LIB-9:** Dialog **Xem trước** item: icon+tiêu đề, trạng thái/lượt xem/likes/ngày/shares, mô tả, tags, nền tảng (badge "Trường học số"/"GK Ebooks"), tên file; nút "Chỉnh sửa" → builder (admin chỉ có "Đóng").
- **FR-LIB-10:** Admin: **không** có Sửa/Nhân bản; chỉ Xem trước + Xóa.
- **FR-LIB-11:** Trạng thái rỗng: "Chưa có nội dung phù hợp."

### 4.5. FR-CREATE — Tạo nội dung (Modal Hub)

(`material-type-picker.tsx`, `studio-view.tsx`, `use-create-content.ts`)

- **FR-CREATE-1:** Nút "Tạo mới" (sidebar/header/bottom-nav) mở **MaterialTypePicker** (dialog "Tạo nội dung mới").
- **FR-CREATE-2:** Modal chia **3 khu vực**:
  - **Sản phẩm xuất bản**: nút lớn "Tạo Sách", "Tạo Khóa học".
  - **Học liệu tương tác**: Bộ đề, Bài giảng, Học liệu nâng cao, SCORM/xAPI.
  - **Tệp đính kèm**: Tài liệu, Video, Hình ảnh, Âm thanh, 3D/VR.
- **FR-CREATE-3:** Chọn loại → `createDraft(type, ownerId, {category, materialSubtype})` tạo bản nháp rồi điều hướng builder:
  - `book` → `/<scope>/builder/book/$id`; `course` → `/<scope>/builder/course/$id`; `quiz` → `/<scope>/builder/quiz/$id`; loại học liệu khác → `/<scope>/builder/material/$id`.
- **FR-CREATE-4:** `ownerId` của bản nháp = role hiện tại (creator) hoặc org (khi workspace=org).
- **FR-CREATE-5:** Trang **Studio** (`studio-view.tsx`) hiển thị lại MaterialTypePicker grid + danh sách "Bản nháp đang dựng (N)" (lưới thẻ) để tiếp tục.

### 4.6. FR-QUIZ — Quiz Builder

(`components/quiz/quiz-builder.tsx` dùng chung; route `creator.builder.quiz.$id.tsx` & `org.builder.quiz.$id.tsx` là wrapper mỏng. Store `useQuiz` in-memory.)

- **FR-QUIZ-1:** Bố cục 3 cột (desktop): **Palette trái** (rail) · **Canvas giữa** · **AI Panel phải** (280px). Mobile: chuyển tab giữa các panel.
- **FR-QUIZ-2:** **Action bar header**: nút Quay lại (→ dashboard scope), input tiêu đề (lưu khi blur), "Xem trước" (demo), "Thiết lập" (mở dialog), "Xuất bản" (mở PublishSheet).
- **FR-QUIZ-3:** **10 loại câu hỏi**: Trắc nghiệm, Tự luận, Ghép đôi, Hộp thả, Kéo thả, Sắp xếp, Trả lời video, Trả lời ghi âm, Nhận dạng, Điểm đánh dấu.
- **FR-QUIZ-4 (Rail Tab 1 — "Câu hỏi"):** lưới 10 loại; mỗi loại **kéo vào canvas** hoặc **click để thêm**. Gợi ý: "✦ Kéo loại câu hỏi vào canvas".
- **FR-QUIZ-5 (Rail Tab 2 — "Học liệu"):** **kho học liệu thật**: ô tìm kiếm (tiêu đề/môn/tags) + chip lọc loại con ("Tất cả" + loại hiện có). Nguồn = nội dung **của tôi + đã xuất bản** (lọc `category==="learning_material"`, loại trừ sách/khóa học). Mỗi dòng kéo–thả (`id: material-<itemId>`) hoặc click → **đính kèm vào câu hỏi đang chọn**. Gợi ý: "✦ Kéo học liệu vào đề bài".
- **FR-QUIZ-6 (Rail Tab 3 — "AI OCR"):** *(Demo)* toast "AI OCR — Quét tài liệu và tạo câu hỏi tự động (demo)".
- **FR-QUIZ-7 (Canvas):** trạng thái rỗng hướng dẫn "+ Thêm"; trang trống hiển thị "Trang N" + gợi ý kéo loại câu hỏi; câu hỏi active animate vào/ra; điều hướng "Câu trước"/"Câu sau".
- **FR-QUIZ-8 (Question Card):** drag handle (sắp xếp lại), số thứ tự + badge loại, nút xóa; ô nội dung; vùng **đính kèm học liệu**: rỗng = "Kéo thả học liệu vào đây" (icon Paperclip); có đính kèm = lưới thumbnail ~84px (icon+tiêu đề, nút ✕ gỡ) + ô "+ Thêm". Một câu hỏi giữ **nhiều** học liệu (append + dedupe theo `materialId`).
- **FR-QUIZ-9 (Editor theo loại):** Trắc nghiệm = danh sách đáp án + chọn đáp án đúng (radio, tô xanh); Tự luận = textarea; Kéo thả/Ghép đôi = 2 cột "Các mục (kéo)" / "Vị trí (thả)".
- **FR-QUIZ-10 (Điều khiển dưới mỗi câu):** Thời gian (s), Điểm, công tắc "Bắt buộc".
- **FR-QUIZ-11 (Question Strip dưới):** dải ngang các thẻ câu hỏi (Câu N / "Trống"), chấm xanh đánh dấu active, kéo sắp xếp, nút "+ Thêm" tạo slot trống ở cuối.
- **FR-QUIZ-12 (Kéo–thả):** Palette→Canvas tạo/thay câu hỏi (dialog xác nhận thay loại: "Thay đổi loại câu hỏi?"); Học liệu→Canvas đính kèm câu đang chọn (chặn trùng); Strip→Strip sắp xếp lại; DragOverlay hiển thị tiêu đề khi kéo.
- **FR-QUIZ-13 (AI Panel — Demo):** "Tạo câu hỏi bằng AI"; ô mô tả nội dung; gửi → hiển thị "Đang tạo…" rồi phản hồi giả lập ("Tôi đã tạo 3 câu hỏi…"); giao diện hội thoại bong bóng.
- **FR-QUIZ-14 (Dialog "Thiết lập bộ đề"):** Thời gian làm bài (phút, 0=không giới hạn), Điểm đạt (%), Độ khó (Dễ/Trung bình/Khó), Trộn câu hỏi ngẫu nhiên, Hiển thị kết quả sau khi nộp, Cho phép làm lại (+ số lần tối đa). Lưu → toast "Đã lưu thiết lập bộ đề".
- **FR-QUIZ-15:** Rich editor (TipTap) hỗ trợ In đậm/In nghiêng/Gạch chân/Gạch ngang + nút "Thêm công thức toán học" *(thành phần sẵn có)*.

### 4.7. FR-BUILDER — Book / Course / Material

- **FR-BUILDER-1 (Material Upload — `material-upload-form.tsx`, đầy đủ):** Header (Quay lại → thư viện, icon+tiêu đề, "Lưu nháp"/"Xem trước"/"Xuất bản"). Cột trái: hiển thị loại + **dropdown định dạng** lọc theo loại con (vd lesson: PDF/DOCX/PPTX) + **vùng kéo–thả tệp** ("Kéo & thả tệp vào đây" / "Chọn tệp", hiện tên tệp + nút xóa). Cột phải (metadata): Mô tả, Môn học (8 lựa chọn), Lớp (1–12), Tags (thêm/xóa). "Lưu nháp" → `updateItem` + toast; "Xuất bản" → mở PublishSheet.
- **FR-BUILDER-2 (Book Builder — scaffold):** Header (tiêu đề mặc định "Sách điện tử chưa đặt tên", Xem trước, Xuất bản) + 3 khối placeholder gạch đứt: "Thông tin chung", "Cấu trúc nội dung", "Phân phối". Tích hợp PublishSheet. *(Chưa soạn thảo chương/bài thực tế.)*
- **FR-BUILDER-3 (Course Builder — scaffold):** Tương tự Book ("Khóa học chưa đặt tên"). *(Chưa lắp ráp khóa học thực tế.)*
- **FR-BUILDER-4:** Route builder (`creator|org` × `book|course|quiz|material`) đều render full-screen (shell thu gọn).

### 4.8. FR-PUBLISH — Xuất bản nội dung

(`publish-sheet.tsx`)

- **FR-PUBLISH-1:** Sheet bên phải "Xuất bản nội dung" mở từ builder/form.
- **FR-PUBLISH-2:** Trạng thái phân tích (≈2s, demo): spinner "AI đang phân tích nội dung…" + skeleton.
- **FR-PUBLISH-3:** Kết quả: **vòng tròn chất lượng /100**, thẻ "Chất lượng AI", Tags (thêm/xóa), Mô tả (textarea gợi ý sửa được).
- **FR-PUBLISH-4:** **Chọn nền tảng đích**: "Trường học số quốc gia" (`national`), "GK Ebooks" (`ebooks`) — checkbox.
- **FR-PUBLISH-5:** Dropdown metadata: Môn học, Lớp, Ngôn ngữ.
- **FR-PUBLISH-6:** "Xuất bản" → `publish(id, args)`: nếu **chủ sở hữu đã xác minh** → status `published` (toast "Đã xuất bản thành công!"); ngược lại → `pending` (toast "Đã gửi nội dung — chờ duyệt từ admin"). "Lưu nháp" giữ nháp.

### 4.9. FR-CHANNEL — Kênh công khai & chỉnh sửa

(`channel-view.tsx`: ChannelView + ChannelEditView; scope creator|org, dùng `useActiveAccount`)

- **FR-CHANNEL-1 (Xem):** Banner gradient full-width + avatar tròn phủ lên; tên kênh + tích xanh + badge loại tài khoản; bio + link website (icon Globe); số follower + số nội dung; nút "Theo dõi"/"Đang theo dõi" (toggle); link "Chỉnh sửa kênh".
- **FR-CHANNEL-2 (Tabs):** **"Nội dung (count)"** + **"Giới thiệu"**. Tab Nội dung: chip lọc loại động (chỉ loại có nội dung đã xuất bản) + lưới thẻ. Tab Giới thiệu: lưới thông tin (Giới thiệu/Loại tài khoản/Website/Email/Số nội dung/Người theo dõi).
- **FR-CHANNEL-3 (Sửa):** "Chỉnh sửa kênh" 2 cột: trái = "Hình ảnh & thông tin" (upload banner, đổi avatar, Tên hiển thị, Giới thiệu, Website; org có hộp link sang "/org/members"); phải = "Nội dung ghim" (chọn học liệu đã xuất bản để ghim đầu trang). Nút Hủy / Xem trước / Lưu thay đổi.
- **FR-CHANNEL-4:** Org-scope hiển thị **danh tính tổ chức** (không phải cá nhân) nhờ `useActiveAccount("org")`.

### 4.10. FR-VERIFY — Xin tích xanh

(`verification-view.tsx`; scope creator|org)

- **FR-VERIFY-1 (Chưa xác minh):** thẻ "Tiến độ xác minh": progress bar (đạt/tổng), checklist mỗi tiêu chí (icon ✅/❌, nhãn, ngưỡng hiện tại, gợi ý AI sparkle, nút CTA); nút "Gửi đơn xin xác minh" (disabled tới khi đủ tiêu chí).
- **FR-VERIFY-2 (Tiêu chí Cá nhân):** Chứng chỉ nghề nghiệp (≥1 file) · Số học liệu xuất bản (≥5) · Lượt xem thực tế (≥500) · Hoàn thiện hồ sơ (Avatar+Bio+Email).
- **FR-VERIFY-3 (Tiêu chí Tổ chức):** Giấy phép hoạt động (≥1 file) · Email tên miền tổ chức (trùng WHOIS) · Số học liệu xuất bản (≥10) · Lượt xem thực tế (≥2000).
- **FR-VERIFY-4 (Đã xác minh):** trạng thái thành công: huy hiệu ✓ + cấp (L1/L2/Admin) + ngày, hộp xanh thông báo, nút "Xem kênh của tôi" + "Chính sách duy trì xác minh"; thẻ "Quyền lợi đang hưởng": Tự động xuất bản, Ưu tiên hiển thị, Huy hiệu tích xanh, Bảo vệ nâng cao.

### 4.11. FR-MEMBER — Quản lý thành viên tổ chức

(`members-view.tsx`; route `/org/members`)

- **FR-MEMBER-1:** Khu mời: input email + select vai trò (chỉ **Manager/Editor**), nút "Mời"; validate email hợp lệ & chống trùng; toast "Đã mời {email} làm {role}".
- **FR-MEMBER-2:** Bảng "Danh sách thành viên (N)": cột Thành viên (avatar+tên/email), Vai trò (badge màu theo Owner/Manager/Editor), Tham gia (ngày), Hành động.
- **FR-MEMBER-3:** Đổi vai trò inline (Owner không đổi được); toast "Đã cập nhật vai trò".
- **FR-MEMBER-4:** Gỡ thành viên (không áp dụng Owner): dialog xác nhận "Gỡ thành viên?"; toast "Đã gỡ thành viên".

### 4.12. FR-SETTINGS — Cài đặt

(`settings-view.tsx`; scope creator|org)

- **FR-SETTINGS-1 (Hồ sơ):** Creator = Họ tên/Giới thiệu/Website; Org = Tên tổ chức/Mô tả/Website + upload "Giấy phép / quyết định thành lập".
- **FR-SETTINGS-2 (Bảo mật):** nút "Đổi mật khẩu" + công tắc "Xác minh 2 lớp (2FA)".
- **FR-SETTINGS-3 (Giao diện):** Ngôn ngữ (Tiếng Việt/English), Theme (Sáng/Tối/Theo hệ thống).
- **FR-SETTINGS-4 (Thông báo):** công tắc "Email thông báo" + "Push notification".
- **FR-SETTINGS-5 (Org — Nền tảng phân phối):** công tắc "Trường học số quốc gia" + "GK Ebooks".
- **FR-SETTINGS-6 (Creator — Quyền riêng tư):** "Ẩn kênh khỏi tìm kiếm công khai" + "Cho phép trích dẫn học liệu".
- **FR-SETTINGS-7:** Khối "Tiến độ xác minh" link nhanh sang trang Xác minh; nút "Lưu thay đổi".

### 4.13. FR-ADMIN — Quản trị

(`admin-pages.tsx` + `admin-moderation.tsx`)

- **FR-ADMIN-1 (Quản lý người dùng `/admin/users`):** bảng tất cả tài khoản (Người dùng + tích xanh, Loại, Xác minh, Trạng thái Hoạt động/Đã khóa, Hành động). Hành động: "Chi tiết" (dialog: email/website/follower/bio…), Khóa/Mở khóa (toast "Đã khóa/Đã mở khóa {name}").
- **FR-ADMIN-2 (Duyệt nội dung `/admin/content-review`):** danh sách nội dung `pending` (tiêu đề, chủ sở hữu, môn, ngày, mô tả, tags), ô "Lý do từ chối (nếu có)". Hành động: "Phê duyệt" (→ published, toast) / "Từ chối" (→ rejected, toast). Rỗng: "Không có nội dung chờ duyệt."
- **FR-ADMIN-3 (Duyệt xác minh `/admin/verification-requests`):** thẻ đơn (người nộp, loại tài khoản, ngày, trạng thái). Chi tiết mở rộng: số học liệu, lượt xem, tuổi tài khoản (ngày), "Giấy tờ đã tải" (file badge). Hành động (đơn pending): "Phê duyệt" / "Từ chối" (toast tương ứng).
- **FR-ADMIN-4 (Báo cáo vi phạm `/admin/reports`):** thẻ báo cáo (tiêu đề nội dung, lý do — copyright/inappropriate/spam/inaccurate/other, người báo cáo, ngày, ghi chú). Hành động (báo cáo open): "Cảnh báo", "Bỏ qua" (→ dismissed), "Gỡ nội dung" (→ xóa nội dung + resolved). Toast tương ứng.
- **FR-ADMIN-5 (Cấu hình hệ thống `/admin/settings`):**
  - **Ngưỡng xác minh**: 4 input số — Cá nhân (học liệu ≥5, lượt xem ≥500), Doanh nghiệp (học liệu ≥10, lượt xem ≥2000).
  - **Danh mục môn học**: danh sách (Toán, Vật lý, Hóa học, Sinh học, Ngữ văn, Tiếng Anh, Lịch sử, Địa lý) + thêm/xóa.
  - **Từ khóa bị cấm (AI filter)**: thêm/xóa từ khóa (badge đỏ); "Nội dung chứa các từ này sẽ bị chặn tự động."
  - Nút "Lưu cấu hình" (toast).

---

## 5. Mô hình dữ liệu (`src/lib/types.ts`)

### 5.1. Kiểu liệt kê (enums / union types)

| Kiểu | Giá trị |
|---|---|
| `RoleId` | `teacher` \| `verified_teacher` \| `publisher` \| `admin` |
| `AccountType` | `personal`/`Cá nhân` \| `organization`/`Doanh nghiệp` \| `admin`/`Admin` |
| `VerificationStatus` | `none` \| `pending` \| `verified` \| `rejected` \| `admin` \| `L1` \| `L2` |
| `ContentStatus` | `draft` \| `published` \| `pending` \| `rejected` |
| `Platform` | `national` \| `ebooks` |
| `OrgRole` | `owner` \| `manager` \| `editor` |
| `LearningMaterialSubtype` | `quiz` \| `lesson` \| `advanced` \| `scorm` \| `document` \| `video` \| `image` \| `audio` \| `3d_vr` |
| `MaterialType` | `book` \| `course` \| *LearningMaterialSubtype* |
| `CreationCategory` | `book` \| `course` \| `learning_material` |
| `QuestionType` | `multiple_choice` \| `essay` \| `matching` \| `dropbox` \| `drag_drop` \| `ordering` \| `video` \| `audio` \| `recognition` \| `marker` |
| `ReportReason` | `copyright` \| `inappropriate` \| `spam` \| `inaccurate` \| `other` |

### 5.2. Thực thể chính

- **Account**: `id, name, shortName, accountType, verified, avatarColor, bio, followers, managers?[OrgMember], businessLicense?, website?, email?, orgMemberships?[OrgMembership]`.
- **OrgMember**: `email, name, role (OrgRole), joinedAt`.
- **OrgMembership**: `orgId, orgName, orgShortName, orgColor, role`.
- **ContentItem**: `id, title, type (ContentType), legacyType?, category, materialType?, materialSubtype?, status, ownerId, ownerName?, createdAt, views, likes, shares, thumbnailColor, subject, grade, platforms[], tags[], description, fileExtension?, fileName?`.
- **Question**: `id, type, prompt, options?[{id,text}], correctOptionId?, essayAnswer?, pairs?[{id,left,right}], duration, points, required, attachments?[QuestionAttachment]`.
- **QuestionAttachment**: `materialId, title, type, thumbnailColor, fileExtension?`.
- **VerificationChecklist**: `credentials, minMaterials, minViews, profileComplete, businessLicense?, domainEmail?`.
- **VerificationRequest**: `id, applicantId, accountType, status (pending|approved|rejected), submittedAt, reviewedAt?, documents[], reason?, materialsCount, views, accountAgeDays`.
- **ContentReport**: `id, contentId, contentTitle, reason, reporterName, reportedAt, status (open|resolved|dismissed), note?`.

### 5.3. Quy tắc dẫn xuất

- `getMaterialZone`: book/course → `product`; còn lại → `learning_material`.
- `getCreationCategory`, `getBuilderPath`, `getDefaultAppPath`, `getCreationLabel` (taxonomy.ts).
- `createDraft` sinh `id = c_<timestamp>`, status `draft`, mặc định subject "Toán", grade "Lớp 8", màu `#2563EB`.
- `duplicateItem` tạo bản sao "… (bản sao)" status draft, reset views/likes/shares/platforms.
- `publish` đặt status theo `ownerVerified` (published nếu verified, ngược lại pending).

---

## 6. Yêu cầu giao diện (UI/UX)

- **UI-1 (Responsive):** Mobile <768px (bottom nav, sidebar ẩn, 1 cột); Tablet 768–1024px (drawer, 2 cột); Desktop >1024px (sidebar cố định collapsible, multi-cột). Quiz Builder desktop 3 panel → mobile tab-switch. Tab thư viện scroll ngang + fade ở mép trên mobile.
- **UI-2 (Skeleton):** mọi trang có skeleton loading; logo "Trường học số" pulse rồi card/table/chart fade in (`logo-loader.tsx`, `page-skeleton.tsx`, `use-page-loading.ts`).
- **UI-3 (Icon):** bộ FileIcon SVG (`public/book/*.svg`) fallback `empty.svg`; mỗi loại học liệu có icon riêng (`material-type-icon.tsx`, `MATERIAL_TYPE_ICONS`).
- **UI-4 (Branding):** logo `/assets/logo/Logomark.svg`; màu chủ đạo `#2563EB` (primary), `#20447E` (national), trạng thái: xanh=published, vàng=pending, xám=draft, đỏ=rejected.
- **UI-5 (Badge tích xanh):** `verified-badge.tsx`, `status-badge.tsx` hiển thị nhất quán toàn hệ thống.
- **UI-6 (Toast):** sonner top-right, richColors cho mọi hành động (lưu/xóa/nhân bản/duyệt/…).
- **UI-7 (Font):** Inter (400–800) từ Google Fonts.

---

## 7. Yêu cầu phi chức năng

- **NFR-PERF-1:** SSR + hydrate; biểu đồ gate sau `mounted` để tránh nhấp nháy/hydration mismatch; animation đếm số & typing mượt.
- **NFR-MAINT-1:** Quy ước "nhiều file nhỏ", view chia sẻ theo scope + barrel; component dùng chung (1 Quiz Builder, 1 shell tham số hóa) tránh trùng lặp.
- **NFR-MAINT-2:** TypeScript strict cho API public; immutable update trong store; verify bằng `npx tsc --noEmit`, `npm test`, `npm run build`.
- **NFR-I18N-1:** Mặc định tiếng Việt; có lựa chọn ngôn ngữ trong Settings (Tiếng Việt/English) — *(demo, chưa nối i18n thật)*.
- **NFR-A11Y-1:** Dùng Radix primitives (focus/keyboard/ARIA), `aria-label` cho nút icon (menu, tìm kiếm, thông báo).
- **NFR-SEC-1:** *(Hiện trạng)* không có xác thực/ủy quyền backend; mọi phân quyền là client-side. Khi tích hợp thật cần: xác thực thực, kiểm soát truy cập theo vai trò ở server, validate đầu vào (đã có zod sẵn), chống XSS với rich text.
- **NFR-COMPAT-1:** Trình duyệt hiện đại (Chromium/Firefox/Safari) bản mới.
- **NFR-TEST-1:** Có unit test (`route-helpers.test.ts`, `taxonomy.test.ts`, `use-active-account.test.ts`) chạy bằng Vitest.

---

## 8. Ma trận phân quyền (điều hướng & hành động)

| Khả năng | teacher | verified_teacher | publisher (org) | admin |
|---|:---:|:---:|:---:|:---:|
| Workspace Cá nhân | ✓ | ✓ | — | — |
| Workspace Tổ chức (qua membership) | ✓ | ✓ | ✓ (gốc) | — |
| Tạo nội dung / Builder | ✓ | ✓ | ✓ | — |
| Xuất bản → trạng thái | pending | **published** | **published** | n/a |
| Quản lý thành viên tổ chức | (theo vai trò org) | (theo vai trò org) | ✓ | — |
| Xin tích xanh | ✓ | (đã verified) | (đã verified) | — |
| Duyệt nội dung / xác minh / báo cáo | — | — | — | ✓ |
| Quản lý người dùng, khóa tài khoản | — | — | — | ✓ |
| Cấu hình hệ thống | — | — | — | ✓ |

---

## 9. Quy tắc nghiệp vụ then chốt

- **BR-1:** Chủ sở hữu **đã xác minh** ⇒ nội dung **tự động published**; chưa xác minh ⇒ vào hàng đợi **pending** để admin duyệt.
- **BR-2:** Workspace org chỉ hiển thị nội dung thuộc **org** (`ownerId === orgId`); nội dung tạo trong org thuộc về org.
- **BR-3:** Tài khoản cá nhân không có org membership ⇒ không thấy Workspace Switcher.
- **BR-4:** Owner của tổ chức **không thể** bị đổi vai trò hoặc bị gỡ; lời mời chỉ ở mức Manager/Editor.
- **BR-5:** Đủ **4/4 tiêu chí** mới bật nút gửi đơn xác minh.
- **BR-6:** Một câu hỏi có thể đính kèm **nhiều** học liệu (dedupe theo `materialId`).
- **BR-7:** Kho học liệu trong Quiz chỉ gồm **của tôi + đã xuất bản**, loại trừ sách/khóa học.
- **BR-8:** Admin không tạo nội dung và không có bottom-nav (dùng hamburger drawer).

---

## 10. Phụ lục

### 10.1. Taxonomy 11 loại (`taxonomy.ts`)

| Nhóm | Key | Nhãn | Luồng tạo | Định dạng chấp nhận |
|---|---|---|---|---|
| Sản phẩm | `course` | Khóa học | Course Builder *(scaffold)* | N/A (lắp ráp) |
| Sản phẩm | `book` | Sách điện tử | Book Builder *(scaffold)* | N/A (soạn + kéo thả) |
| Tương tác | `quiz` | Bộ đề | **Quiz Builder** | N/A (soạn trực tiếp) |
| Tương tác | `lesson` | Bài giảng | Form upload | PDF, DOCX, PPTX |
| Tương tác | `advanced` | Học liệu nâng cao | Form upload | ZIP (HTML tương tác) |
| Tương tác | `scorm` | SCORM/xAPI | Form upload | ZIP (gói SCORM) |
| Đính kèm | `document` | Tài liệu | Form upload | PDF, DOCX, TXT, XLSX |
| Đính kèm | `video` | Video | Form upload | MP4, MOV, AVI, link YouTube |
| Đính kèm | `image` | Hình ảnh | Form upload | JPG, PNG, SVG, GIF, WEBP |
| Đính kèm | `audio` | Âm thanh | Form upload | MP3, WAV, OGG, M4A |
| Đính kèm | `3d_vr` | 3D/VR | Form upload | GLB, GLTF, OBJ, FBX |

### 10.2. 10 loại câu hỏi

Trắc nghiệm · Tự luận · Ghép đôi · Hộp thả · Kéo thả · Sắp xếp · Trả lời video · Trả lời ghi âm · Nhận dạng · Điểm đánh dấu.

### 10.3. Bảng route đầy đủ

| Route | Trang | Scope |
|---|---|---|
| `/` | Redirect → `/creator/dashboard` | — |
| `/login` | Đăng nhập demo | — |
| `/creator/dashboard` | Trang chủ cá nhân | creator |
| `/creator/library` | Thư viện của tôi | creator |
| `/creator/studio` · `/creator/studio/new` | Tạo mới / Studio | creator |
| `/creator/channel` · `/creator/channel/edit` | Kênh (xem/sửa) | creator |
| `/creator/verification` | Xác minh tài khoản | creator |
| `/creator/settings` | Cài đặt | creator |
| `/creator/builder/quiz/$id` | Quiz Builder | creator |
| `/creator/builder/material/$id` | Form upload | creator |
| `/creator/builder/book/$id` | Book Builder *(scaffold)* | creator |
| `/creator/builder/course/$id` | Course Builder *(scaffold)* | creator |
| `/org/dashboard` | Trang chủ tổ chức | org |
| `/org/library` | Thư viện tổ chức | org |
| `/org/studio` · `/org/studio/new` | Tạo mới | org |
| `/org/channel` · `/org/channel/edit` | Kênh tổ chức | org |
| `/org/members` | Quản lý thành viên | org |
| `/org/verification` | Xác minh tổ chức | org |
| `/org/settings` | Cài đặt tổ chức | org |
| `/org/builder/{quiz,material,book,course}/$id` | Builders | org |
| `/admin/dashboard` | Tổng quan hệ thống | admin |
| `/admin/users` | Quản lý người dùng | admin |
| `/admin/content-review` | Duyệt nội dung | admin |
| `/admin/verification-requests` | Duyệt xác minh | admin |
| `/admin/reports` | Báo cáo vi phạm | admin |
| `/admin/settings` | Cấu hình hệ thống | admin |
| `/admin/{library,channel,studio,verification}` | View admin-scope (kế thừa) | admin |

---

## 11. Dữ liệu Seed (`mock-data.ts`)

- **4 tài khoản** (`ACCOUNTS`): Nguyễn Văn A (teacher, Cá nhân, none, 124 follower), TS. Trần Thị B (verified_teacher, Cá nhân, L2, 8.420), NXB Giáo dục VN (publisher, Doanh nghiệp, L2, 25.340, 4 manager), Admin Hệ thống (admin).
- **28 nội dung** (`SEED_CONTENT`, `c1`–`c28`): đủ loại (book/course/9 subtype) × trạng thái (draft/pending/published/rejected) × chủ sở hữu, kèm môn/lớp/lượt xem/likes/shares thực tế.
- **2 đơn xác minh** (`VERIFICATION_REQUESTS`): teacher (Cá nhân, pending), publisher (Doanh nghiệp, pending).
- **3 báo cáo** (`CONTENT_REPORTS`): inaccurate (c7), copyright (c12), spam (c11) — đều `open`.
- **3 câu hỏi mẫu** (`SAMPLE_QUESTIONS`): multiple_choice, drag_drop, essay (Quiz Builder seed).
- **Chuỗi analytics**: `ANALYTICS_7D/30D/90D` (dữ liệu lượt xem giả lập cho biểu đồ).

---

## 12. Ma trận hiện trạng triển khai

| Module | Hiện trạng | Ghi chú |
|---|---|---|
| Shell hợp nhất, điều hướng, workspace switch | ✅ Đầy đủ | Theo role + workspace |
| Login / Role Switcher (demo) | ✅ Đầy đủ | 4 tài khoản mẫu |
| Dashboard (creator/org/admin) | ✅ Đầy đủ | Biểu đồ + AI card animation |
| Thư viện (tab/lọc/bảng-lưới/tìm kiếm/preview) | ✅ Đầy đủ | CRUD nội dung qua store |
| Modal Hub tạo mới | ✅ Đầy đủ | 3 khu vực, 11 loại |
| **Quiz Builder** | ✅ Đầy đủ | 10 loại câu hỏi, kho học liệu, đính kèm, settings, strip, kéo–thả |
| Material Upload Form | ✅ Đầy đủ (demo file) | Upload là giả lập |
| **Book / Course Builder** | 🟡 Scaffold | Chỉ header + placeholder; chưa soạn chương/bài |
| Publish Sheet | ✅ Đầy đủ (AI demo) | Phân tích chất lượng giả lập |
| Channel (view/edit) | ✅ Đầy đủ | Banner/avatar/ghim |
| Verification | ✅ Đầy đủ | Checklist + trạng thái verified |
| Quản lý thành viên org | ✅ Đầy đủ | Mời/đổi vai trò/gỡ |
| Settings | ✅ Đầy đủ (UI) | Lưu giả lập |
| Admin (users/review/verify/reports/settings) | ✅ Đầy đủ | Hành động cập nhật store/toast |
| **AI Panel / AI OCR / Notifications** | 🟡 Demo | Toast/giả lập, chưa nối dịch vụ thật |
| Backend / xác thực thật / lưu trữ file | ❌ Chưa có | Toàn bộ mock + localStorage |
| i18n (English) | 🟡 Lựa chọn UI | Chưa dịch nội dung |

**Chú thích:** ✅ hoàn chỉnh · 🟡 một phần/demo · ❌ chưa có.

---

> **Định hướng hoàn thiện (gợi ý):** (1) Tích hợp backend + xác thực thật + lưu trữ file; (2) Hoàn thiện Book/Course Builder (soạn chương/bài, lắp ráp khóa học từ học liệu); (3) Nối dịch vụ AI thật cho gợi ý dashboard, sinh câu hỏi, OCR, chấm chất lượng; (4) Hệ thống thông báo thật; (5) i18n đầy đủ; (6) Kiểm thử E2E (Playwright) cho luồng tạo–duyệt–xuất bản.

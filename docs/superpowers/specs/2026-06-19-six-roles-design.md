# Design Spec — 6 vai trò & bổ sung màn hình còn thiếu

**Ngày:** 2026-06-19 · **Dự án:** gk-content-forge (Trường học số) · **Trạng thái:** chờ user duyệt

## Context

App hiện là prototype mock-data cho nền tảng "Trường học số": creator soạn học liệu/khóa học qua studio
dạng block. Hiện có **4 RoleId** (`teacher`, `verified_teacher`, `publisher`, `admin`) chạy trên **3 nhóm
route**: `creator/*`, `org/*`, `admin/*`, với các shared view scope-hóa (Dashboard/Studio/Library/Channel/
Settings/Verification) + cụm admin (users, content-review, verification-requests, reports).

Yêu cầu: dựng đủ **6 vai trò** đúng mô tả nghiệp vụ (mỗi vai trò 1 tài khoản demo) và **bổ sung mọi màn
hình còn thiếu**. Màn đã có/tương tự thì **giữ nguyên, chỉ thêm màn mới**. Bổ sung thêm: **mã định danh nội
dung** (ID học liệu duy nhất). Mức độ: **prototype có mock-data** (bấm được, không backend), nhất quán với app
hiện tại và **tuân thủ design system `/mobifone-ui`**. Copy tiếng Việt trong màn sẽ áp dụng kỹ năng
`humanized` (không "giọng AI").

## Quyết định kiến trúc (đã chốt với user)

- **Giữ 3 nhóm route hiện có + thêm 3 nhóm mới.** Tái dùng tối đa shared view, chỉ thêm màn mới.
- Làm **tất cả** màn thiếu của cả 6 vai trò trong đợt này.
- Cấu trúc dữ liệu mới = **mock-data + Zustand store**.

### Map 6 vai trò → nhóm route + tài khoản demo

| # | Vai trò | RoleId | Nhóm route | Tài khoản demo |
|---|---|---|---|---|
| 1 | Quản trị viên Hệ thống (MoET / System Admin) | `admin` *(có)* | `admin/*` *(có)* | Quản trị Bộ GD&ĐT |
| 2 | Hội đồng Chuyên môn / Thẩm định (Reviewer) | `reviewer` **(mới)** | `reviewer/*` **(mới)** | Hội đồng thẩm định *(mới)* |
| 3 | Giáo viên (Teacher / Creator) | `teacher` / `verified_teacher` *(có)* | `creator/*` *(có)* | Giáo viên |
| 4 | Học sinh (Student) | `student` **(mới)** | `student/*` **(mới)** | Học sinh *(mới)* |
| 5 | Nhà trường / Cơ sở GD (School Admin) | `school` **(mới)** | `school/*` **(mới)** | Quản lý nhà trường *(mới)* |
| 6 | Đối tác Nội dung (NXB / EdTech) | `publisher` *(có)* | `org/*` *(có)* | Đối tác nội dung |

→ **7 tài khoản demo** trên trang login (thêm 4: reviewer, student, **2 tài khoản nhóm school** = Quản lý nhà trường + Tổ trưởng bộ môn). Nhóm `school` giữ **1 RoleId** nhưng có field con `schoolRole` (`principal`/`manager`/`dept_head`) để tách quyền — không tăng số RoleId.

## Inventory màn hình theo vai trò — *giữ* (có) vs **MỚI**

### 1. System Admin (MoET) — `admin/*`
- *Giữ:* Dashboard, Quản trị Tài khoản (`admin/users`), Báo cáo (`admin/reports`), content-review, verification-requests, settings, library/studio/channel.
- **MỚI: Quản lý Khung Chương trình & Tiêu chuẩn** — `admin/curriculum`: cây 5 cấp Lớp→Môn→Mạch→Chương→Bài + mục tiêu/chuẩn đầu ra của Bộ; CRUD đầy đủ + quản lý phiên bản (ban hành đợt cập nhật, lịch sử thay đổi chuẩn).
- *Mở rộng nhẹ (cùng màn đã có):* Dashboard thêm widget **Tổng quan Quốc gia** (học liệu theo tầng Gốc/Đối tác/Cộng đồng, người dùng hoạt động, tỷ lệ khai thác theo vùng, cảnh báo rủi ro); `admin/users` thêm mục **phê duyệt** Sở/NXB/Doanh nghiệp/Hội đồng + phân quyền; `admin/reports` thêm biểu đồ **hoạch định chính sách** (khoảng cách tiếp cận số, hiệu quả theo loại học liệu).

### 2. Reviewer (Hội đồng thẩm định) — `reviewer/*` **(nhóm mới)**
- **MỚI: Danh sách Học liệu Chờ duyệt** — `reviewer/queue`: lọc theo môn/cấp/lớp + mức ưu tiên phân phối. *(tái dùng content-table + logic content-review)*
- **MỚI: Chi tiết Thẩm định** — `reviewer/review/$id`: xem/trải nghiệm trực tiếp học liệu đa phương tiện + form đánh giá chuyên môn + tích nhãn chất lượng ("Chuẩn Bộ"/"Đã thẩm định") + gửi yêu cầu sửa. *(tái dùng Preview của course-builder/page-canvas + panel đánh giá)*
- **MỚI: Quản lý Rà soát & Cảnh báo** — `reviewer/reports`: tiếp nhận/xử lý báo cáo sai lệch & tranh chấp bản quyền từ cộng đồng. *(tái dùng admin-moderation + CONTENT_REPORTS)*

### 3. Teacher (Creator) — `creator/*`
- *Giữ:* Studio + builders (course/quiz/book/material), Quản lý Học liệu Cá nhân (`creator/library`), channel, verification, settings.
- **MỚI: Quản lý Lớp học & Giao bài** — `creator/classes`: chọn học liệu từ kho, giao cho nhóm/lớp, theo dõi tiến độ làm bài realtime. *(domain mới: lớp/giao bài/tiến độ)*
- **MỚI: Registry — Hồ sơ Chuyên môn Số** — `creator/registry`: biểu đồ lượt tải/sử dụng, giải thưởng/nhãn đạt được, điểm tích lũy đóng góp. *(tái dùng stat-card + charts)*

### 4. Student — `student/*` **(nhóm mới)**
- **MỚI: Trang chủ Cá nhân hóa** — `student/home`: gợi ý bài bổ trợ theo tiến độ + "Bài tập cần làm" (do GV giao).
- **MỚI: Tìm kiếm & Khám phá** — `student/explore`: duyệt cây chương trình 5 cấp Lớp→Môn→Mạch→Chương→Bài; mặc định lớp của HS, xem được lớp khác; phân biệt Tầng Gốc miễn phí vs cấp quyền. *(dùng curriculum framework)*
- **MỚI: Trình Học tập Tương tác** — `student/learn/$id`: xem video bài giảng, làm bài tập trực quan, phản hồi tức thì. *(tái dùng render Preview của course/page-canvas + quiz)*
- **MỚI: Báo cáo Tiến độ Học tập** — `student/progress`: trực quan hóa điểm mạnh/yếu + gợi ý lộ trình. *(tái dùng charts)*

### 5. School Admin (Nhà trường) — `school/*` **(nhóm mới)**
- **MỚI: Dashboard Nhà trường** — `school/dashboard`: tỷ lệ GV/HS tham gia học tập số, số lượt tương tác của trường. *(tái dùng stat-card + charts)*
- **MỚI: Trang Duyệt Nội bộ** — `school/review`: tiếp nhận bài giảng của GV trong trường, duyệt chuyển tiếp lên Platform quốc gia. *(tái dùng content-table + action duyệt)*
- **MỚI: Quản lý Tài khoản & Lớp học** — `school/accounts`: quản lý định danh GV/HS thuộc trường + phân lớp. *(tái dùng pattern members-view + class mgmt)*

### 6. Content Partner (NXB / EdTech) — `org/*`
- *Giữ:* Dashboard, Library, Channel, Members, Settings, Verification, builders.
- **MỚI: Đăng ký & Ký số Học liệu** — `org/signing`: chọn học liệu từ kho đối tác → **hệ thống tự sinh mã định danh duy nhất** (`THS-DT-…`) + **dấu thời gian ký**; cấu hình **khối bản quyền đầy đủ** (loại giấy phép, phạm vi cấp phép, chủ sở hữu, thời hạn hiệu lực, điều khoản truy cập). Ký số xong → học liệu vào **hàng đợi Hội đồng với cờ "Đối tác" ưu tiên**. *(tích hợp content-ID vào luồng publish)*
- **MỚI: Thống kê & Phân tích Hiệu quả** — `org/analytics`: **1 dashboard 3 khối** — Độ phủ & khai thác (số cơ sở GD/tỉnh dùng, lượt mở theo thời gian, bản đồ vùng, top học liệu) · Doanh thu & cấp phép (lượt cấp quyền theo trường, gói license hiệu lực/sắp hết hạn) · Phản hồi & chất lượng (đánh giá GV, tỷ lệ HS hoàn thành). *(tái dùng charts, biến thể partner)*

**Tổng: ~15 màn MỚI** (3 admin? — 1 mới + mở rộng; reviewer 3; teacher 2; student 4; school 3; partner 2) + các mở rộng nhẹ trên màn đã có.

## Cấu trúc dữ liệu mới (mock-data + store)

1. **Mã định danh nội dung** — thêm field vào `ContentItem`: `registryId` **có mã tầng** (vd `THS-DT-2026-TOAN-000123` = THS · mã tầng · năm · mã môn · số tuần tự 6 chữ số), `tier` (`root`→`GOC`, `partner`→`DT`, `community`→`CD`), và khối bản quyền `license?: { type, scope, rightsHolder, validUntil, accessTerms }`. Hiển thị ở partner signing, reviewer detail, admin content mgmt. → `src/lib/types.ts`, `src/lib/mock-data.ts`, hàm sinh mã ở `src/lib/registry-id.ts` (mới).
2. **Nhãn chất lượng thẩm định** — `src/lib/quality-label.ts` (mới): 4 mức tiến **Mới nộp → Đủ hồ sơ → Đã thẩm định → Chuẩn Bộ** + 2 nhãn xử lý **Cần chỉnh sửa**, **Từ chối** + nhãn riêng **Đối tác tin cậy** (cho Tầng Đối tác đã ký số). Là chiều nhãn riêng, độc lập với `status` xuất bản hiện có. → taxonomy + status-badge (biến thể quality-badge).
3. **Khung chương trình (curriculum)** — `src/lib/curriculum.ts` (mới): **Lớp → Môn → Mạch/Chủ đề → Chương → Bài** (5 cấp, bám CT GDPT 2018) + `outcomes[]` (chuẩn đầu ra/năng lực) gắn ở Bài. Dùng cho admin curriculum + student explore + checklist chuẩn đầu ra của Reviewer.
4. **Lớp học & giao bài** — `src/stores/classroom.ts` (mới): `Class { id, schoolId, teacherId, name, studentIds[] }`, `Assignment { id, classId, contentId, dueDate }`, `Submission { assignmentId, studentId, status, score, progress }`. Dùng cho teacher classes, school accounts, student home/progress.
5. **Tài khoản 6 vai trò (7 tài khoản demo)** — thêm `reviewer`, `student`, `school` vào `RoleId` + `ACCOUNTS`; nhóm `school` có **2 tài khoản** (Quản lý nhà trường + Tổ trưởng bộ môn) phân biệt bằng field con `schoolRole` (`principal`/`manager`/`dept_head`) + `subjectScope?` (môn tổ trưởng phụ trách, để lọc màn duyệt nội bộ).

## Thay đổi điều hướng/định tuyến (điểm đụng tới)

- `src/lib/types.ts` — mở rộng `RoleId` (+reviewer, +student, +school).
- `src/lib/taxonomy.ts` — `getDefaultAppPath()` / `getBuilderPath()` map role mới → path.
- `src/components/content-studio-shell.tsx` — thêm `REVIEWER_NAV`, `STUDENT_NAV`, `SCHOOL_NAV`; mở rộng `ADMIN_NAV`/`CREATOR_NAV`/`ORG_NAV` (curriculum, classes+registry, signing+analytics); cập nhật `getNavSections()` + quyền.
- `src/components/role-switcher.tsx` + `src/routes/login.tsx` — 7 tài khoản demo; nhóm `school` điều hướng theo `schoolRole` (tổ trưởng chỉ vào `school/review` lọc môn; quản lý/hiệu trưởng vào đủ `school/*`).
- `src/routes/` — thêm shell + route mới cho `reviewer/*`, `student/*`, `school/*`, và route mới `admin/curriculum`, `creator/classes`, `creator/registry`, `org/signing`, `org/analytics`, `reviewer/*`, `student/*`, `school/*`. (Sinh lại `routeTree.gen.ts`.)

## Nguyên tắc tái sử dụng & những gì GIỮ NGUYÊN
- Tái dùng: `dashboard-view`, `content-table`, `content-card`, `library-view`, `stat-card`, charts, `material-type-picker`, `status-badge`, course `page-canvas`/Preview (cho student learn & reviewer detail), `members-view` (cho school accounts), `admin-moderation` (cho reviewer reports).
- **Không** sửa các màn creator/org/admin đã có (chỉ mở rộng nơi nêu rõ ở trên). Không đổi luồng builder hiện có.
- Mọi màn mới **bắt buộc theo design system** (skill `/mobifone-ui`, token, không hardcode màu).

## Verification (prototype)
- Gate: `npx tsc --noEmit`, `npm run test` (vitest), `npm run build` đều xanh sau mỗi nhóm màn.
- Smoke: `npm run dev`, đăng nhập lần lượt 6 tài khoản, đi hết các màn mới + xác nhận điều hướng/role-switch đúng; học liệu/lớp/giao bài hiển thị mock-data.

## Quyết định brainstorm chi tiết theo vai trò (chốt với user)

**1. System Admin (MoET):**
- Khung CT: **CRUD đầy đủ + quản lý phiên bản** (ban hành đợt cập nhật, lịch sử thay đổi chuẩn).
- Dashboard Quốc gia: đủ **4 khối** — học liệu theo tầng (Gốc/Đối tác/Cộng đồng), khai thác theo vùng miền, cảnh báo rủi ro, hiệu quả theo loại học liệu.
- **Sở GD&ĐT = vai trò đầy đủ nhưng THÊM SAU**; đợt này chỉ xuất hiện trong danh sách tài khoản MoET duyệt (Bộ→Sở→Trường để ngỏ).
- Báo cáo chính sách: **cả** khoảng cách tiếp cận số **và** hiệu quả/chất lượng (mức ngang nhau), có xuất báo cáo.

**2. Reviewer (Hội đồng):**
- **1 reviewer/học liệu** (ghi rõ "thuộc Hội đồng X"), không biểu quyết hội đồng.
- Form thẩm định: **rubric nhiều tiêu chí + checklist đối chiếu chuẩn đầu ra** (liên kết khung CT).
- Luồng: **Hội đồng + Admin tách vai** — màn `content-review` của admin **chuyển sang Reviewer**; Admin giữ kiểm duyệt vi phạm/báo cáo nền tảng riêng + cấu hình.
- Màn Rà soát: tranh chấp **chuyên môn + bản quyền**, reviewer có quyền **tạm dừng khai thác**.

**3. Teacher (Creator):**
- Lớp & HS do **Nhà trường tạo**, GV **được gán** dạy & giao bài.
- Giao bài: **mọi loại học liệu** (kho dùng chung + của mình), **theo dõi từng HS realtime** (chưa làm/đang làm/đã nộp/điểm).
- Registry: **cả 4** — lượt tải/sử dụng, nhãn & giải thưởng, điểm thi đua đóng góp, điểm CPD.
- **Thêm lịch sử phiên bản + đồng tác giả** vào trang Quản lý Học liệu Cá nhân.

**4. Student:**
- Trang chủ: **lộ trình cá nhân hóa làm trọng tâm** (tiếp tục bài đang học), bài tập được giao là một phần.
- Khám phá: **mặc định lớp của HS**, xem được lớp khác; phân biệt **Tầng Gốc miễn phí** vs cấp quyền.
- Trình học: **gating theo phần + lưu tiến độ/tiếp tục + chấm điểm & giải thích tức thì + làm lại/xem lại**.
- Tiến độ: **cả theo môn lẫn theo chuẩn năng lực** (gắn khung CT) + gợi ý lộ trình.

**5. School Admin (Nhà trường):**
- Duyệt nội bộ: có **tổ trưởng bộ môn** duyệt theo môn trước, rồi trường chốt chuyển tiếp lên Hội đồng → cần **phân quyền nội bộ trường** (owner/quản lý/tổ trưởng).
- Quản lý TK & Lớp: **đầy đủ** — tạo/sửa lớp, gán GV↔lớp, quản lý HS (thêm/nhập danh sách), phân HS vào lớp.
- Dashboard: tỷ lệ tham gia GV/HS + thi đua đóng góp + **tồn đọng duyệt nội bộ** + **tổng hợp tiến độ học tập HS toàn trường**.

**6. Content Partner (NXB/EdTech):**
- Mã định danh: **hệ thống tự sinh khi ký số** (không để partner/admin tự nhập), kèm dấu thời gian ký.
- Khối bản quyền: **đầy đủ 5 trường** — loại giấy phép, phạm vi cấp phép, chủ sở hữu, thời hạn hiệu lực, điều khoản truy cập. (Không mô phỏng hash/chữ ký số riêng — "ký số" = hành vi đăng ký + dấu thời gian.)
- Luồng duyệt: học liệu đối tác **vẫn qua Hội đồng** nhưng có **cờ "Đối tác" ưu tiên** trong hàng đợi; gắn nhãn chất lượng sau thẩm định.
- Màn phân tích: **1 dashboard gộp 3 khối** — Độ phủ & khai thác · Doanh thu & cấp phép · Phản hồi & chất lượng.

### Cross-cutting (đã chốt)
- **Định dạng mã định danh:** `THS-<tầng>-<năm>-<mã môn>-<số 6 chữ số>`, vd `THS-DT-2026-TOAN-000123`. Mã tầng: `GOC` (gốc/Bộ), `DT` (đối tác), `CD` (cộng đồng).
- **Bộ nhãn chất lượng:** 4 mức tiến (Mới nộp → Đủ hồ sơ → Đã thẩm định → Chuẩn Bộ) + 2 nhãn xử lý (Cần chỉnh sửa, Từ chối) + nhãn riêng **Đối tác tin cậy** cho Tầng Đối tác đã ký số.
- **Khung chương trình:** 5 cấp **Lớp → Môn → Mạch/Chủ đề → Chương → Bài**, chuẩn đầu ra (`outcomes[]`) gắn ở Bài.
- **Phân quyền nội bộ trường:** 3 mức `principal`/`manager`/`dept_head` (field `schoolRole` trên account nhóm `school`); thêm **1 tài khoản demo Tổ trưởng bộ môn** riêng (tổng **7 tài khoản demo**). Màn `school/review` lọc theo `subjectScope` của tổ trưởng cho bước duyệt cấp tổ trước khi trường chốt.

## Phạm vi loại trừ (YAGNI)
- Không backend/API thật, không auth thật (vẫn role-switch demo).
- Không xây editor mới cho student (chỉ render/Preview lại nội dung có sẵn).
- Không SCORM/LMS tích hợp thật; chỉ thể hiện metadata.

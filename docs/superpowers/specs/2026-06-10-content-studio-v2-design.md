# GK Content Studio v2 — Thiết kế Kiến trúc Toàn diện

_Spec được brainstorm từ research report platform studio + 11 câu hỏi làm rõ yêu cầu._

---

## 1. Tổng quan Kiến trúc

### 1.1. Ba App Shell riêng biệt

Hệ thống chia thành 3 layout hoàn toàn độc lập, mỗi loại tài khoản có sidebar, navigation, dashboard, và bộ trang riêng. Không tái sử dụng sidebar giữa các loại.

| App Shell        | Đối tượng                                                | Phong cách             | Sidebar desktop          | Mobile nav                |
| ---------------- | -------------------------------------------------------- | ---------------------- | ------------------------ | ------------------------- |
| **Creator**      | Cá nhân (giáo viên, tác giả)                             | YouTube Studio         | Sidebar trái collapsible | Bottom nav 5 item         |
| **Organization** | Doanh nghiệp/Tổ chức (NXB, trường học, Sở GD, trung tâm) | Google Workspace Admin | Sidebar trái collapsible | Bottom nav 5 item         |
| **Admin**        | Quản trị viên hệ thống                                   | Admin Panel            | Sidebar trái cố định     | Responsive sidebar drawer |

Điểm khác biệt cốt lõi giữa Cá nhân và Doanh nghiệp: **multi-manager** — Doanh nghiệp cho phép nhiều người cùng quản trị kênh với phân quyền Owner/Manager/Editor, Cá nhân chỉ có 1 người duy nhất.

### 1.2. Hệ thống phân loại tài khoản

```
AccountType = "personal" | "organization" | "admin"
VerificationStatus = "none" | "pending" | "verified" | "rejected"
```

Ma trận tài khoản (4 trạng thái thực tế):

| Loại                    | Tích xanh     | Mô tả                              | Ví dụ              |
| ----------------------- | ------------- | ---------------------------------- | ------------------ |
| Cá nhân + none          | Chưa xác minh | Giáo viên mới đăng ký              | Nguyễn Văn A       |
| Cá nhân + verified      | Đã xác minh   | Giáo viên uy tín đạt đủ tiêu chuẩn | TS. Trần Thị B ✓   |
| Doanh nghiệp + none     | Chưa xác minh | Tổ chức mới đăng ký                | Trung tâm Toán ABC |
| Doanh nghiệp + verified | Đã xác minh   | Tổ chức uy tín đạt đủ tiêu chuẩn   | NXB Giáo dục VN ✓  |

---

## 2. Route Structure

### 2.1. Creator Routes (`/creator/*`)

| Route                           | Trang              | Mô tả                                       |
| ------------------------------- | ------------------ | ------------------------------------------- |
| `/creator/dashboard`            | Trang chủ          | AI card + thống kê + biểu đồ + top nội dung |
| `/creator/library`              | Thư viện của tôi   | 9 tab loại học liệu + filter trạng thái     |
| `/creator/studio/new`           | Tạo mới            | Chọn loại → quiz builder hoặc form upload   |
| `/creator/channel`              | Kênh của tôi (xem) | Mode xem công khai giống YouTube channel    |
| `/creator/channel/edit`         | Kênh của tôi (sửa) | Form sửa banner, avatar, bio, link          |
| `/creator/verification`         | Xác minh tài khoản | Checklist tiến độ + CTA + AI gợi ý          |
| `/creator/settings`             | Cài đặt            | Hồ sơ, bảo mật, thông báo, quyền riêng tư   |
| `/creator/builder/quiz/:id`     | Quiz Builder       | Soạn bộ đề (sidebar auto thu gọn)           |
| `/creator/builder/material/:id` | Form upload        | Soạn học liệu khác (sidebar auto thu gọn)   |

### 2.2. Organization Routes (`/org/*`)

| Route                       | Trang              | Mô tả                                              |
| --------------------------- | ------------------ | -------------------------------------------------- |
| `/org/dashboard`            | Trang chủ          | AI card + thống kê tổ chức + stats theo thành viên |
| `/org/library`              | Thư viện tổ chức   | 9 tab + filter (hiển thị owner column)             |
| `/org/studio/new`           | Tạo mới            | Tương tự creator                                   |
| `/org/channel`              | Kênh tổ chức (xem) | Mode xem công khai                                 |
| `/org/channel/edit`         | Kênh tổ chức (sửa) | Form sửa + quản lý thành viên                      |
| `/org/members`              | Quản lý thành viên | Mời/xóa/phân quyền Owner, Manager, Editor          |
| `/org/verification`         | Xác minh tổ chức   | Checklist tổ chức + CTA                            |
| `/org/settings`             | Cài đặt            | Hồ sơ tổ chức, giấy phép, nền tảng phân phối       |
| `/org/builder/quiz/:id`     | Quiz Builder       | Tương tự creator                                   |
| `/org/builder/material/:id` | Form upload        | Tương tự creator                                   |

### 2.3. Admin Routes (`/admin/*`)

| Route                          | Trang               | Mô tả                                  |
| ------------------------------ | ------------------- | -------------------------------------- |
| `/admin/dashboard`             | Tổng quan           | Thống kê hệ thống, biểu đồ tăng trưởng |
| `/admin/users`                 | Quản lý người dùng  | Danh sách user, khóa/mở tài khoản      |
| `/admin/content-review`        | Duyệt nội dung      | Hàng đợi nội dung pending              |
| `/admin/verification-requests` | Duyệt xác minh      | Danh sách đơn xin tích xanh            |
| `/admin/reports`               | Nội dung bị báo cáo | Xử lý vi phạm                          |
| `/admin/settings`              | Cấu hình hệ thống   | Ngưỡng xác minh, danh mục môn/lớp/tags |

---

## 3. Sidebar Navigation

### 3.1. Creator Sidebar

```
Logo Trường học số
─────────────────
🏠 Trang chủ
📚 Thư viện của tôi
➕ Tạo mới           ← Nút nổi bật (primary color, rounded)
📺 Kênh của tôi
✅ Xác minh tài khoản
─────────────────
⚙️ Cài đặt
```

### 3.2. Organization Sidebar

```
Logo Trường học số
─────────────────
🏠 Trang chủ
📚 Thư viện tổ chức
➕ Tạo mới
📺 Kênh tổ chức
👥 Quản lý thành viên
✅ Xác minh tổ chức
─────────────────
⚙️ Cài đặt
```

### 3.3. Admin Sidebar

```
Logo Trường học số
─────────────────
📊 Tổng quan
👥 Quản lý người dùng
📋 Duyệt nội dung      ← Badge đếm số pending
🏅 Duyệt xác minh      ← Badge đếm số đơn mới
🚨 Báo cáo vi phạm     ← Badge đếm số report
─────────────────
⚙️ Cấu hình hệ thống
```

### 3.4. Mobile Bottom Nav

Creator và Organization dùng bottom nav 5 item (icon + label):

- Trang chủ | Thư viện | Tạo mới (icon lớn giữa) | Kênh | Thêm (menu dropdown: Xác minh, Cài đặt)

Admin không có bottom nav — dùng hamburger drawer.

---

## 4. Hệ thống Học liệu (11 loại)

### 4.1. Danh sách loại học liệu

Hệ thống được chia làm 3 nhóm chính: Sản phẩm xuất bản, Học liệu tương tác, và Tệp đính kèm thô.

| Nhóm             | Key        | Tên hiển thị      | Icon SVG      | Luồng tạo          | Định dạng file chấp nhận       |
| ---------------- | ---------- | ----------------- | ------------- | ------------------ | ------------------------------ |
| **Sản phẩm**     | `course`   | Khóa học          | course icon   | **Course Builder** | N/A (Lắp ráp từ học liệu khác) |
| **Sản phẩm**     | `book`     | Sách điện tử      | book icon     | **Book Builder**   | N/A (Soạn thảo + kéo thả)      |
| **Tương tác**    | `quiz`     | Bộ đề             | exam icon     | **Quiz Builder**   | N/A (Soạn trực tiếp)           |
| **Tương tác**    | `lesson`   | Bài giảng         | doc icon      | Form upload        | PDF, DOCX, PPTX                |
| **Tương tác**    | `advanced` | Học liệu nâng cao | html icon     | Form upload        | ZIP (chứa HTML tương tác)      |
| **Tương tác**    | `scorm`    | SCORM/xAPI        | code icon     | Form upload        | ZIP (gói SCORM)                |
| **Tệp đính kèm** | `document` | Tài liệu          | document icon | Form upload        | PDF, DOCX, TXT, XLSX           |
| **Tệp đính kèm** | `video`    | Video             | mp4 icon      | Form upload        | MP4, MOV, AVI, link YouTube    |
| **Tệp đính kèm** | `image`    | Hình ảnh          | image icon    | Form upload        | JPG, PNG, SVG, GIF, WEBP       |
| **Tệp đính kèm** | `audio`    | Âm thanh          | audio icon    | Form upload        | MP3, WAV, OGG, M4A             |
| **Tệp đính kèm** | `3d_vr`    | 3D/VR             | 3d icon       | Form upload        | GLB, GLTF, OBJ, FBX            |

### 4.2. Luồng tạo mới (Modal Hub)

1. Bấm "Tạo mới" trên sidebar/bottom nav
2. Hiện Modal/Sheet tổng hợp chia làm 3 cột/khu vực rõ ràng:
   - **Sản phẩm xuất bản**: `[📚 Tạo Sách]` `[🎓 Tạo Khóa học]` (nút to, nổi bật)
   - **Học liệu tương tác**: `[📝 Tạo Bộ đề]` `[📽️ Tạo Bài giảng]`...
   - **Tệp đính kèm**: Video, Hình ảnh, Âm thanh...
3. Chọn Sách/Khóa học/Bộ đề → Redirect sang các Builder tương ứng (Book Builder, Course Builder, Quiz Builder) với giao diện đồng nhất: Action bar trên cùng, sidebar auto thu gọn.
4. Chọn loại khác (Form Upload) → Redirect sang trang Upload:
   - **Dropdown chọn định dạng** (liệt kê file type phù hợp với loại đã chọn)
   - **Khu vực kéo thả file** (drag & drop hoặc click browse)
   - **Metadata form**: Tiêu đề, Mô tả (rich text), Môn học (dropdown), Lớp (dropdown), Tags (multi-select)
   - **Action bar**: `[Lưu nháp]` `[Xem trước ↗]` `[Xuất bản]`
   - Sidebar cũng auto thu gọn khi ở form

### 4.3. Nút Preview

- Vị trí: Bên cạnh nút "Lưu nháp" trong action bar
- Hành vi: Mở tab trình duyệt mới hiển thị trang xem công khai của học liệu đó
- Có ở cả lúc tạo mới, sửa, và xem chi tiết

---

## 5. Thư viện của tôi

### 5.1. Cấu trúc 3 khu vực (Tab Groups)

Thư viện được chia thành 3 khu vực rõ rệt (sử dụng segmented control hoặc sub-tabs để chuyển đổi giữa 3 khu vực này, sau đó mới đến các tab chi tiết của từng loại):

1. **Sản phẩm xuất bản**: `Sách` | `Khóa học`
2. **Học liệu tương tác**: `Bộ đề` | `Bài giảng` | `Học liệu nâng cao` | `SCORM`
3. **Tệp đính kèm**: `Tài liệu` | `Video` | `Hình ảnh` | `Âm thanh` | `3D/VR`

Tab mặc định khi vào: Tab khu vực 1 (Sản phẩm xuất bản). Không có tab "Tất cả".

### 5.2. Filter trạng thái

Bên dưới tab bar, dạng chip/toggle group:

`Nháp` | `Chờ duyệt` | `Đã xuất bản` | `Bị từ chối`

- Mặc định: không chọn chip nào → hiện tất cả trạng thái trong tab đó
- Click chip → lọc nhanh theo trạng thái
- Có thể bỏ chọn để quay lại hiện tất cả

### 5.3. Content card

Mỗi item hiển thị dạng card hoặc list row:

- Icon SVG theo loại file (từ bộ gkebook FileIcon)
- Tiêu đề
- Status badge (màu sắc khác nhau: xanh = published, vàng = pending, xám = draft, đỏ = rejected)
- Ngày tạo, Lượt xem, Likes
- Menu actions (⋮): Sửa, Xem trước, Xóa, Nhân bản

### 5.4. Khác biệt Thư viện giữa Creator và Organization

- **Creator**: Chỉ hiện học liệu của chính mình
- **Organization**: Hiện học liệu của toàn bộ thành viên, có thêm cột "Người tạo" để phân biệt

---

## 6. Dashboard

### 6.1. Dashboard Creator

Thứ tự từ trên xuống:

1. **AI Assistant Card** (vị trí đầu trang, nổi bật gradient + icon sparkle):
   - Gợi ý cá nhân hóa: "Bạn có 2 bài nháp chưa hoàn thành"
   - Đề xuất nội dung: "Học liệu X đang trending, bạn nên tạo bài tương tự"
   - Phân tích chất lượng: "Đề thi Y có tỷ lệ hoàn thành thấp, cân nhắc điều chỉnh"
   - Có animation typing effect khi hiện gợi ý

2. **Stat Cards** (grid 4 cột desktop, 2x2 mobile):
   - Tổng lượt xem (animated counter)
   - Tổng likes
   - Số học liệu đã xuất bản
   - Số người theo dõi

3. **Biểu đồ lượt xem** (line chart, toggle 7/30/90 ngày, có motion khi chuyển)

4. **Phân bổ nội dung** (donut chart theo 9 loại học liệu)

5. **Top nội dung nổi bật** (bảng xếp hạng 5 item, trend arrows)

6. **Hoạt động gần đây** (timeline: "Bạn đã xuất bản...", "Học liệu X đạt 1000 lượt xem")

### 6.2. Dashboard Organization

Tương tự Creator, bổ sung thêm:

- **Thống kê theo thành viên** (bar chart: ai đóng góp nhiều nhất)
- **Danh sách thành viên đang hoạt động** (avatar + tên + số bài đăng tuần này)

### 6.3. Dashboard Admin

Hoàn toàn khác:

- **Stat Cards**: Tổng user, Nội dung chờ duyệt (badge), Đơn xin tích xanh (badge), Nội dung bị báo cáo (badge)
- **Biểu đồ tăng trưởng hệ thống** (user mới, nội dung mới theo thời gian)
- **Biểu đồ phân bổ loại tài khoản** (pie: cá nhân vs tổ chức vs verified)
- **Hàng đợi xử lý** (nội dung pending + đơn xác minh mới nhất, có CTA "Duyệt ngay")

---

## 7. Kênh (Channel)

### 7.1. Mode xem công khai (Preview)

Layout giống YouTube channel page:

- **Banner** lớn full-width (ảnh bìa tổ chức/cá nhân)
- **Avatar** tròn phủ lên banner
- **Tên kênh** + Tích xanh (nếu có) + Loại tài khoản badge
- **Bio** + Website link
- **Số follower** + Nút "Theo dõi"
- **Tab bar**: `Học liệu` | `Bộ đề` | `Giới thiệu`
- Mỗi tab hiện grid card học liệu đã xuất bản

### 7.2. Mode chỉnh sửa (Edit)

Form tùy chỉnh kênh:

- **Upload/crop ảnh bìa** (banner) — hỗ trợ kéo thả, preview real-time
- **Upload/crop avatar** — crop tròn, preview
- **Tên hiển thị kênh** (input text)
- **Bio/Giới thiệu** (textarea)
- **Link website** (input URL)
- **Chọn học liệu ghim đầu trang** (multi-select từ thư viện)
- **Nút**: `[Hủy]` `[Xem trước ↗]` `[Lưu thay đổi]`

### 7.3. Bổ sung cho Organization

Mode chỉnh sửa của Organization có thêm tab/section:

- **Quản lý thành viên**: Mời qua email, phân vai trò (Owner/Manager/Editor), thu hồi quyền
- Liên kết sang trang `/org/members` cho quản lý chi tiết

---

## 8. Quy trình Xin Tích xanh

### 8.1. Tích xanh Cá nhân

Giao diện: progress bar + checklist, mỗi tiêu chí có icon trạng thái (✅/❌) và nút CTA:

| Tiêu chí              | Ngưỡng                   | CTA khi chưa đạt                   | AI gợi ý                                        |
| --------------------- | ------------------------ | ---------------------------------- | ----------------------------------------------- |
| Chứng chỉ nghề nghiệp | Upload ≥ 1 file          | "Tải lên giấy tờ" → mở form upload | —                                               |
| Số học liệu xuất bản  | ≥ 5                      | "Tạo học liệu mới" → mở Studio     | —                                               |
| Lượt xem thực tế      | ≥ 500                    | —                                  | "Chia sẻ bài giảng X lên nhóm để tăng lượt xem" |
| Hoàn thiện hồ sơ      | Avatar + Bio + Email edu | "Cập nhật hồ sơ" → mở Settings     | "Hồ sơ của bạn thiếu ảnh đại diện"              |

Khi 4/4 đạt → nút "Gửi đơn xin xác minh" sáng lên → Submit → Admin duyệt.

### 8.2. Tích xanh Doanh nghiệp

| Tiêu chí               | Ngưỡng          | CTA khi chưa đạt    |
| ---------------------- | --------------- | ------------------- |
| Giấy phép hoạt động    | Upload ≥ 1 file | "Tải lên giấy tờ"   |
| Email tên miền tổ chức | Trùng WHOIS     | "Cập nhật email"    |
| Số học liệu xuất bản   | ≥ 10            | "Tạo học liệu mới"  |
| Lượt xem thực tế       | ≥ 2000          | AI gợi ý chiến lược |

### 8.3. Admin — Duyệt đơn

Trang `/admin/verification-requests`:

- Danh sách đơn pending (tên, loại tài khoản, ngày gửi)
- Click vào → chi tiết: xem giấy tờ đã upload, thống kê tài khoản, lịch sử hoạt động
- Nút: `[Phê duyệt]` `[Từ chối + Lý do]`

---

## 9. Cài đặt (Settings)

### 9.1. Điểm chung (cả 3 loại)

- **Bảo mật**: Đổi mật khẩu, Xác minh 2 lớp
- **Giao diện**: Ngôn ngữ, Theme sáng/tối
- **Thông báo**: Bật/tắt email, push notification

### 9.2. Riêng Creator

- **Hồ sơ cá nhân**: Tên, bio, avatar, ảnh bìa, link website/mạng xã hội
- **Quyền riêng tư**: Ẩn/hiện kênh, cho phép trích dẫn học liệu
- **Tiến độ xác minh**: Link nhanh đến trang Xác minh

### 9.3. Riêng Organization

- **Hồ sơ tổ chức**: Tên tổ chức, logo, mô tả, giấy phép/quyết định thành lập
- **Quản lý thành viên**: Link nhanh đến trang Quản lý thành viên
- **Nền tảng phân phối**: Chọn nền tảng xuất bản mặc định (Trường học số quốc gia, eBooks)
- **Tiến độ xác minh**: Link nhanh đến trang Xác minh

### 9.4. Riêng Admin

- **Quản lý người dùng**: Link nhanh
- **Cấu hình hệ thống**: Ngưỡng xác minh (số học liệu, lượt xem), Danh mục môn học, Danh mục lớp, Tags cho phép
- **Kiểm duyệt**: Cấu hình từ khóa bị cấm, quy tắc AI filter

---

## 10. Responsive Design

### 10.1. Breakpoints

| Breakpoint | Kích thước     | Layout                                      |
| ---------- | -------------- | ------------------------------------------- |
| Mobile     | < 768px        | Bottom nav, sidebar ẩn, 1 cột, cards stack  |
| Tablet     | 768px - 1024px | Sidebar drawer (toggle), 2 cột grid         |
| Desktop    | > 1024px       | Sidebar cố định collapsible, multi-cột grid |

### 10.2. Quy tắc responsive

- **Sidebar**: Desktop = cố định collapsible, Tablet = drawer overlay, Mobile = ẩn hoàn toàn
- **Bottom Nav**: Chỉ hiện trên mobile (< 768px) cho Creator và Organization
- **Admin**: Không có bottom nav, dùng hamburger menu drawer trên mobile/tablet
- **Content grid**: Desktop 3-4 cột → Tablet 2 cột → Mobile 1 cột
- **Form upload**: Desktop = 2 cột (file + metadata cạnh nhau) → Mobile = 1 cột stack
- **Quiz Builder**: Desktop = 3 panel (palette + editor + AI) → Mobile = tab switch giữa các panel
- **Header search**: Desktop = inline search bar, Mobile = icon search mở full-width overlay
- **Tab bar thư viện**: Scroll ngang trên mobile với fade indicator ở edge

### 10.3. Skeleton Loading

- Mọi trang đều có skeleton loading state
- Skeleton hiện logo Trường học số với pulse animation ở giữa (logo loader)
- Sau logo animation → skeleton các card/table/chart fade in dần

---

## 11. Icons & Thumbnails

### 11.1. Nguồn

Copy trực tiếp từ `gkebook-school-frontend/public/book/*.svg` sang `gk-content-forge/public/book/`.

### 11.2. Component FileIcon

Tái sử dụng logic component `FileIcon` từ `gkebook-school-frontend/src/components/FileIcon/index.tsx`:

- Input: tên file (có extension)
- Output: render icon SVG tương ứng
- Fallback: icon `empty.svg` nếu không nhận diện được

### 11.3. Material Type Icons

Mỗi loại học liệu trong modal "Tạo mới" và tab thư viện sử dụng icon SVG mapping:

- Bộ đề → icon exam/quiz
- Bài giảng → icon doc
- Tài liệu → icon document
- Video → icon mp4
- Hình ảnh → icon image
- Âm thanh → icon audio
- 3D/VR → icon 3d file
- SCORM → icon code/zip
- Học liệu nâng cao → icon html

---

## 12. Login & Chuyển đổi tài khoản

### 12.1. Trang Login

Trang đăng nhập chung cho cả 3 loại. Sau khi xác thực, hệ thống xác định `accountType` và redirect:

- `personal` → `/creator/dashboard`
- `organization` → `/org/dashboard`
- `admin` → `/admin/dashboard`

### 12.2. Role Switcher (Demo)

Trong môi trường demo/dev, giữ lại role switcher ở header để chuyển nhanh giữa các tài khoản mẫu:

- Nguyễn Văn A (Cá nhân, chưa tích xanh)
- TS. Trần Thị B (Cá nhân, có tích xanh)
- NXB Giáo dục VN (Doanh nghiệp, có tích xanh)
- Admin Hệ thống (Admin)

Khi chuyển role → redirect sang app shell tương ứng.

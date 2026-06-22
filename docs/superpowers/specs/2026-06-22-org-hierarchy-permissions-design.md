# Design Spec — Tổ chức phân cấp & phân quyền theo năng lực (gk-content-forge)

**Ngày:** 2026-06-22 · **Trạng thái:** đã chốt tư duy thiết kế với user, đang chuyển sang plan

## Context

Hiện tại role là một enum phẳng `RoleId` (teacher/verified_teacher/publisher/admin/reviewer/student/school) trộn lẫn 3 khái niệm: **danh tính + loại tài khoản + cấp quyền**. Có `OrgMembership` thô (role owner/manager/editor) + `workspace` personal/org. Quyền hardcode theo RoleId trong shell.

User muốn **hệ thống tổ chức phân cấp, mở rộng được**, tư duy như **folder Google Drive** (lồng nhau, kế thừa quyền) + đăng nhập kiểu **Netflix** (1 email → chọn hồ sơ, có PIN). Doanh nghiệp có thể chứa doanh nghiệp con và cá nhân; cá nhân có thể độc lập hoặc làm CTV cho doanh nghiệp khác (nội dung thuộc doanh nghiệp đó). Chủ sở hữu doanh nghiệp nắm toàn quyền cây con; **Admin Trường học số Quốc gia** + **Hội đồng thẩm định Trường học số Quốc gia** ở trên cùng, quản tất cả.

## Quyết định đã chốt (qua brainstorming)

1. **Cây tổ chức lồng nhiều cấp không giới hạn** (demo cap mềm ~3–4 cấp). Mọi thứ là một *node*.
2. **Phân quyền hybrid:** vai trò = gói **capability**; capability là danh sách mở rộng được.
3. **Kế thừa xuống + override (additive):** quyền ở node cha áp cho toàn cây con; membership ở node con cấp thêm.
4. **Hồ sơ kiểu Netflix:** 1 login (email) → màn **Chọn hồ sơ** + **PIN** + switcher trên header. Hồ sơ = membership.
5. **6 vai trò org** (gồm vai trò "Phát hành/Ký số" riêng).
6. **Phạm vi:** tái cấu trúc mô hình, **mock hoạt động được**; giữ Admin & Hội đồng trên cùng (đổi tên); **giữ vai trò Nhà trường như hiện tại** đợt này; học sinh vẫn ẩn.
7. **Demo = data thật**, giữ tên đang có + dùng 3 tên user cấp (Đoàn Thuận Anh Thư, Nguyễn Minh Hồng, Phạm Quốc Đạt), tự tạo thêm tên thật khi cần.

## Mô hình dữ liệu (4 lớp + vai trò hệ thống)

### Capability (danh sách mở rộng)
`content.view`, `content.create`, `content.edit_any`, `content.submit`, `content.publish_sign`, `analytics.view`, `members.manage`, `suborg.manage`, `org.settings`, `org.transfer`.

### Vai trò org → gói năng lực (`ROLE_CAPABILITIES`)
| Capability | Chủ sở hữu `owner` | Quản trị `admin` | Quản lý `manager` | Biên tập/CTV `editor` | Phát hành/Ký số `publisher` | Người xem `viewer` |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| content.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| content.create | ✓ | ✓ | ✓ | ✓ (của mình) | – | – |
| content.edit_any | ✓ | ✓ | ✓ | – | – | – |
| content.submit | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| content.publish_sign | ✓ | ✓ | – | – | ✓ | – |
| analytics.view | ✓ | ✓ | ✓ | – | – | – |
| members.manage | ✓ | ✓ | – | – | – | – |
| suborg.manage | ✓ | ✓ | – | – | – | – |
| org.settings | ✓ | ✓ | – | – | – | – |
| org.transfer | ✓ | – | – | – | – | – |

"Phát hành/Ký số" = vai trò chuyên biệt hẹp (ký số + gửi duyệt + xem). Capability tách rời → thêm vai trò mới = thêm 1 entry vào `ROLE_CAPABILITIES`.

### Thực thể
- **Login** `{ id, email, name, shortName, avatarColor, systemRole?: "admin" | "reviewer" }` — 1 email đăng nhập. `systemRole` (nếu có) đặt login lên trên mọi cây org.
- **OrgNode** `{ id, name, shortName, type: "business" | "personal", parentId: string | null, avatarColor, businessLicense? }` — node cây. `parentId = null` = gốc. Cá nhân = node `personal` gốc (cây 1 node).
- **Membership** `{ id, loginId, nodeId, role: OrgRoleId, extraCapabilities?: Capability[], lockedByPin: boolean, pin?: string }` — = một **hồ sơ**. 1 login có nhiều membership.
- `OrgRoleId = "owner" | "admin" | "manager" | "editor" | "publisher" | "viewer"` + nhãn tiếng Việt.

### Kế thừa (engine)
`effectiveCapabilities(loginId, nodeId)` = hợp của capability từ mọi membership của login tại `nodeId` **và tất cả node tổ tiên** của nó (role bundle ∪ extraCapabilities). → Chủ sở hữu ở gốc tự đủ quyền toàn cây con. `can(profile, capability)` dùng cho gate UI.

## Luồng Hồ sơ (Netflix) + PIN
- Đăng nhập (chọn login/email) → nếu login có `systemRole` hoặc chỉ 1 hồ sơ → vào thẳng; nếu nhiều hồ sơ → **màn "Chọn hồ sơ"** liệt kê các membership (tên node + vai trò + avatar). Hồ sơ `lockedByPin` → nhập **PIN** mới vào.
- **Hồ sơ đang hoạt động** = `{ membershipId, nodeId, role }` → quyết định toàn bộ app: nav (theo capability), **chủ sở hữu nội dung tạo ra = node đang hoạt động**, dữ liệu hiển thị.
- **Switcher trên header** đổi hồ sơ bất kỳ lúc nào (nhập lại PIN nếu khoá).

## Menu theo năng lực
Mỗi mục nav khai báo `requiredCapability`. Shell chỉ render nếu hồ sơ đang hoạt động `can(cap)`. VD: "Quản lý thành viên" ← `members.manage`; "Tổ chức con" ← `suborg.manage`; "Đăng ký & ký số" ← `content.publish_sign`; "Phân tích" ← `analytics.view`; nút "Tạo mới" ← `content.create`. DRY, mở rộng được.

## Tích hợp với route hiện có (giữ app chạy)
- Login `systemRole==="admin"` → nhóm `admin/*` (đổi tên hiển thị "Admin Trường học số Quốc gia").
- Login `systemRole==="reviewer"` → nhóm `reviewer/*` ("Hội đồng thẩm định Trường học số Quốc gia").
- Hồ sơ node `personal` → nhóm `creator/*` (không gian cá nhân).
- Hồ sơ node `business` → nhóm `org/*` (không gian tổ chức) + **màn mới**: Cây tổ chức/Org con, Thành viên & vai trò.
- Nhà trường `school/*` giữ nguyên đợt này (chưa migrate).
- Cầu nối: shell đọc **hồ sơ đang hoạt động** từ identity store thay cho `roleId` cứng; các màn nội dung dùng "node đang hoạt động" làm chủ sở hữu/identity.

## Cấu trúc file (dự kiến)
- `src/lib/org/capabilities.ts` (+test) — `Capability`, `OrgRoleId`, `ROLE_CAPABILITIES`, nhãn.
- `src/lib/org/tree.ts` (+test) — `OrgNode`, helpers `childrenOf/ancestorsOf/subtreeOf`.
- `src/lib/org/permissions.ts` (+test) — `effectiveCapabilities`, `can`, `profilesForLogin`.
- `src/lib/org/types.ts` — `Login`, `Membership`, `OrgRoleId`.
- `src/lib/org-mock-data.ts` — `LOGINS`, `ORG_NODES`, `MEMBERSHIPS` (data thật).
- `src/stores/identity.ts` (+test) — activeLogin, activeProfile, selectProfile/switch/PIN, persist.
- `src/components/identity/profile-picker.tsx`, `profile-switcher.tsx`, `pin-dialog.tsx`.
- `src/components/org/org-tree.tsx` (quản lý org con), `org-members.tsx` (thành viên & vai trò).
- Sửa: `content-studio-shell.tsx` (nav theo capability + đọc identity), `login.tsx` (login + chọn hồ sơ), `mock-data.ts` (đổi tên admin/reviewer; tên thành viên thật).

## Demo data thật (logins / org tree / memberships)

**Cây tổ chức:**
- **NXB Giáo dục VN** (business, gốc) — Chủ sở hữu: **Đoàn Thuận Anh Thư**.
  - **Chi nhánh Toán** (business, con) — Quản lý: **Phạm Quốc Đạt**.
  - **Chi nhánh Ngữ văn** (business, con).
- **Công ty Công nghệ Giáo dục VietEdu** (business, gốc) — đối tác EdTech.
- Node `personal` riêng cho từng cá nhân.

**Logins (tile đăng nhập):**
| Login | Hồ sơ (membership) | Ghi chú |
|---|---|---|
| Admin Trường học số Quốc gia | (system.admin) | đổi tên, 1 hồ sơ, vào thẳng |
| Hội đồng thẩm định Trường học số Quốc gia | (system.review) | đổi tên, 1 hồ sơ, vào thẳng |
| **Nguyễn Minh Hồng** | Cá nhân (Chủ sở hữu) · NXB Giáo dục VN (Biên tập/CTV) 🔒PIN · VietEdu (Quản lý) | ngôi sao "1 login → nhiều hồ sơ" |
| **Đoàn Thuận Anh Thư** | NXB Giáo dục VN (Chủ sở hữu) | nắm toàn cây + org con |
| **Lê Trung Hiếu** *(giữ)* | Cá nhân (Chủ sở hữu) · NXB Giáo dục VN (Biên tập/CTV) | CTV cung cấp content cho DN |
| **Hoàng Xuân Nhi** *(giữ)* | Cá nhân (Chủ sở hữu) · NXB Giáo dục VN (Quản lý) | đa hồ sơ |

- Thành viên giới hạn quyền: hồ sơ Biên tập/CTV và Người xem chỉ thấy menu/hành động đúng năng lực (không thấy Quản lý thành viên, không thấy Ký số).
- Thay tên placeholder cũ ("Lê Quốc Owner", "Phạm Thu Manager"…) bằng tên thật (3 tên user cấp + tên hợp lý như Trần Thị Mai, Vũ Đức Long…).
- Giữ tên đang có: Lê Trung Hiếu, Hoàng Xuân Nhi, NXB Giáo dục VN, THPT Lê Lợi, Nguyễn An (ẩn).

## UI/UX
Mọi màn/UX mới (Chọn hồ sơ, PIN dialog, profile switcher, cây tổ chức, thành viên & vai trò) **bắt buộc** theo design system MobiFone (`/mobifone-ui`: token, không hex, primitive shadcn) **kết hợp** kỹ năng `/ui-ux-pro-max` cho chất lượng UX (phân cấp thông tin, trạng thái rỗng/khoá, luồng chuyển hồ sơ mượt). Không hardcode màu.

## Verification
- Gate: `npx tsc --noEmit`, `npm run test` (vitest, có test mới cho capabilities/permissions/tree/identity), `npm run build` xanh.
- Smoke: đăng nhập **Nguyễn Minh Hồng** → màn chọn hồ sơ 3 mục, vào hồ sơ NXB cần PIN; đổi hồ sơ qua header; menu khác nhau theo vai trò; tạo nội dung trong hồ sơ NXB → thuộc sở hữu NXB. Đăng nhập **Đoàn Thuận Anh Thư** → thấy & quản toàn cây NXB gồm org con. Admin/Hội đồng đổi tên đúng.

## Phạm vi loại trừ (YAGNI)
- Không backend/auth thật; PIN mock (so khớp chuỗi trong store).
- Không migrate Nhà trường/Học sinh vào mô hình org đợt này (mô hình đủ tổng quát để làm sau).
- Không "reduce override" phức tạp — kế thừa **additive** (cấp thêm, không thu hẹp) cho prototype.
- Không xây editor mới; tái dùng màn nội dung hiện có, chỉ đổi nguồn "chủ sở hữu = node đang hoạt động".

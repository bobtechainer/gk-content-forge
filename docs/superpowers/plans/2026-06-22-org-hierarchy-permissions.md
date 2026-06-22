# Tổ chức phân cấp & phân quyền theo năng lực — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay mô hình role phẳng bằng **cây tổ chức lồng nhau + phân quyền theo capability + đăng nhập kiểu Netflix (1 login → chọn hồ sơ + PIN)**, với nav render động theo năng lực và data demo thật.

**Architecture:** 4 lớp dữ liệu thuần (Login / OrgNode tree / Membership / Capability) + engine kế thừa quyền (TDD ở `src/lib/org/`). Một **identity store** (Zustand) giữ login + hồ sơ đang hoạt động + PIN; nó là nguồn sự thật mới. Để không phá các màn đang chạy, khi chọn hồ sơ sẽ **set kèm `session.roleId` (view-group dẫn xuất)**: node `personal`→`teacher` (nhóm `creator/*`), node `business`→`publisher` (nhóm `org/*`), `systemRole`→`admin`/`reviewer`. Shell **gate nav theo `can(capability)`**. Chủ sở hữu nội dung = node đang hoạt động. Nhà trường giữ luồng cũ đợt này.

**Tech Stack:** TanStack Start + React 19, Tailwind v4, shadcn/ui, Zustand (+persist), vitest. Gates: `npx tsc --noEmit`, `npm run test`, `npm run build`. **npm/npx (không bun). KHÔNG commit cho tới khi user yêu cầu** (bỏ qua mọi bước `git commit` trong plan — chỉ sửa file local). Không mass-format.

---

## Quy ước cho mọi task
- **UI/UX bắt buộc:** màn/element mới theo **`/mobifone-ui`** (đọc `.claude/skills/mobifone-ui/SKILL.md`: token, không hex literal, không arbitrary/ default-palette color, dùng primitive `src/components/ui/*`) **kết hợp `/ui-ux-pro-max`** (đọc `.claude/skills/ui-ux-pro-max/SKILL.md` nếu có: phân cấp thông tin, empty/locked state, chuyển hồ sơ mượt). Copy tiếng Việt tự nhiên.
- **Mức test:** module `src/lib/org/*` + store → vitest TDD đầy đủ. Màn/shell → kiểm bằng `tsc` + `build` + smoke (không bịa unit test cho component thuần).
- **Không commit; không sửa `src/routeTree.gen.ts` bằng tay** (build tự sinh).
- Gate cuối mỗi phase: `npx tsc --noEmit` && `npm run test` && `npm run build` xanh.

## File Structure
**Tạo mới (TDD logic):**
- `src/lib/org/capabilities.ts` (+test) — `Capability`, `OrgRoleId`, `ORG_ROLE_LABELS`, `ROLE_CAPABILITIES`.
- `src/lib/org/types.ts` — `Login`, `OrgNode`, `OrgNodeType`, `Membership`.
- `src/lib/org/tree.ts` (+test) — `nodeById`, `childrenOf`, `ancestorChain`, `subtreeIds`.
- `src/lib/org/permissions.ts` (+test) — `effectiveCapabilities`, `can`, `profilesForLogin`, `ProfileRef`.
- `src/lib/org-mock-data.ts` — `LOGINS`, `ORG_NODES`, `MEMBERSHIPS` (data thật).
- `src/stores/identity.ts` (+test) — login + hồ sơ + PIN.

**Tạo mới (UI):**
- `src/components/identity/profile-picker.tsx` — màn chọn hồ sơ sau login.
- `src/components/identity/pin-dialog.tsx` — nhập PIN cho hồ sơ khoá.
- `src/components/identity/profile-switcher.tsx` — đổi hồ sơ trên header (thay role-switcher cho luồng mới).
- `src/components/org/org-tree-page.tsx` — quản lý tổ chức con (cây).
- `src/components/org/org-members-page.tsx` — thành viên & vai trò.
- routes: `src/routes/org.structure.tsx`, `src/routes/org.members.tsx` *(org.members có thể đã tồn tại — kiểm tra; nếu có thì thay nội dung bằng màn mới, giữ path)*.

**Sửa:**
- `src/lib/mock-data.ts` — đổi tên `admin`→"Admin Trường học số Quốc gia", `reviewer`→"Hội đồng thẩm định Trường học số Quốc gia"; thay tên thành viên placeholder bằng tên thật.
- `src/stores/session.ts` — thêm `activeNodeId`; `setViewFromProfile()` helper (giữ roleId làm view-group).
- `src/components/content-studio-shell.tsx` — nav gate theo capability; đọc identity; ownership = active node.
- `src/routes/login.tsx` — login tiles = LOGINS; vào màn chọn hồ sơ.
- `src/components/role-switcher.tsx` — dùng profile-switcher cho login nhiều hồ sơ (giữ tương thích).

---

# PHASE 0 — Mô hình org + capability (TDD)

## Task 1: capabilities.ts

**Files:** Create `src/lib/org/capabilities.ts`, `src/lib/org/capabilities.test.ts`

- [ ] **Step 1: Test thất bại**
```typescript
// src/lib/org/capabilities.test.ts
import { describe, expect, test } from "vitest";
import { ROLE_CAPABILITIES, ORG_ROLE_LABELS, ALL_CAPABILITIES } from "./capabilities";

describe("org capabilities", () => {
  test("owner có toàn bộ năng lực", () => {
    expect([...ROLE_CAPABILITIES.owner].sort()).toEqual([...ALL_CAPABILITIES].sort());
  });
  test("viewer chỉ xem", () => {
    expect(ROLE_CAPABILITIES.viewer).toEqual(["content.view"]);
  });
  test("publisher (phát hành/ký số) hẹp: xem + gửi duyệt + ký số", () => {
    expect([...ROLE_CAPABILITIES.publisher].sort()).toEqual(
      ["content.publish_sign", "content.submit", "content.view"].sort(),
    );
  });
  test("chỉ owner có org.transfer", () => {
    const withTransfer = Object.entries(ROLE_CAPABILITIES)
      .filter(([, caps]) => caps.includes("org.transfer")).map(([r]) => r);
    expect(withTransfer).toEqual(["owner"]);
  });
  test("manager quản nội dung nhưng không quản thành viên", () => {
    expect(ROLE_CAPABILITIES.manager).toContain("content.edit_any");
    expect(ROLE_CAPABILITIES.manager).not.toContain("members.manage");
  });
  test("đủ 6 vai trò có nhãn tiếng Việt", () => {
    expect(Object.keys(ORG_ROLE_LABELS)).toHaveLength(6);
    expect(ORG_ROLE_LABELS.editor).toBe("Biên tập/CTV");
  });
});
```
- [ ] **Step 2: Chạy fail** — `npx vitest run src/lib/org/capabilities.test.ts` → FAIL (module chưa có).
- [ ] **Step 3: Cài đặt**
```typescript
// src/lib/org/capabilities.ts
export type Capability =
  | "content.view" | "content.create" | "content.edit_any" | "content.submit"
  | "content.publish_sign" | "analytics.view"
  | "members.manage" | "suborg.manage" | "org.settings" | "org.transfer";

export const ALL_CAPABILITIES: Capability[] = [
  "content.view", "content.create", "content.edit_any", "content.submit",
  "content.publish_sign", "analytics.view",
  "members.manage", "suborg.manage", "org.settings", "org.transfer",
];

export type OrgRoleId = "owner" | "admin" | "manager" | "editor" | "publisher" | "viewer";

export const ORG_ROLE_LABELS: Record<OrgRoleId, string> = {
  owner: "Chủ sở hữu", admin: "Quản trị", manager: "Quản lý",
  editor: "Biên tập/CTV", publisher: "Phát hành/Ký số", viewer: "Người xem",
};

export const ROLE_CAPABILITIES: Record<OrgRoleId, Capability[]> = {
  owner: [...ALL_CAPABILITIES],
  admin: ["content.view","content.create","content.edit_any","content.submit","content.publish_sign","analytics.view","members.manage","suborg.manage","org.settings"],
  manager: ["content.view","content.create","content.edit_any","content.submit","analytics.view"],
  editor: ["content.view","content.create","content.submit"],
  publisher: ["content.view","content.submit","content.publish_sign"],
  viewer: ["content.view"],
};
```
- [ ] **Step 4: Chạy pass** — PASS (6 test).
- [ ] **Step 5: Commit** — *(BỎ QUA — không commit; chỉ lưu file).*

## Task 2: org types + tree helpers

**Files:** Create `src/lib/org/types.ts`, `src/lib/org/tree.ts`, `src/lib/org/tree.test.ts`

- [ ] **Step 1: types.ts**
```typescript
// src/lib/org/types.ts
import type { Capability, OrgRoleId } from "./capabilities";

export interface Login {
  id: string;
  email: string;
  name: string;
  shortName: string;
  avatarColor: string;
  systemRole?: "admin" | "reviewer";
}
export type OrgNodeType = "business" | "personal";
export interface OrgNode {
  id: string;
  name: string;
  shortName: string;
  type: OrgNodeType;
  parentId: string | null;
  avatarColor: string;
  businessLicense?: string;
}
export interface Membership {
  id: string;
  loginId: string;
  nodeId: string;
  role: OrgRoleId;
  extraCapabilities?: Capability[];
  lockedByPin: boolean;
  pin?: string;
}
```
- [ ] **Step 2: Test thất bại**
```typescript
// src/lib/org/tree.test.ts
import { describe, expect, test } from "vitest";
import { nodeById, childrenOf, ancestorChain, subtreeIds } from "./tree";
import type { OrgNode } from "./types";

const N = (id: string, parentId: string | null): OrgNode => ({
  id, name: id, shortName: id, type: "business", parentId, avatarColor: "#000",
});
// root -> a -> a1 ; root -> b
const NODES: OrgNode[] = [N("root", null), N("a", "root"), N("a1", "a"), N("b", "root")];

describe("org tree", () => {
  test("nodeById", () => {
    expect(nodeById(NODES, "a")?.id).toBe("a");
    expect(nodeById(NODES, "x")).toBeNull();
  });
  test("childrenOf", () => {
    expect(childrenOf(NODES, "root").map((n) => n.id)).toEqual(["a", "b"]);
    expect(childrenOf(NODES, "a").map((n) => n.id)).toEqual(["a1"]);
  });
  test("ancestorChain gồm chính node + lên tới gốc", () => {
    expect(ancestorChain(NODES, "a1")).toEqual(["a1", "a", "root"]);
    expect(ancestorChain(NODES, "root")).toEqual(["root"]);
  });
  test("subtreeIds gồm chính node + mọi con cháu", () => {
    expect(subtreeIds(NODES, "root").sort()).toEqual(["a", "a1", "b", "root"].sort());
    expect(subtreeIds(NODES, "a").sort()).toEqual(["a", "a1"].sort());
  });
});
```
- [ ] **Step 3: Chạy fail** — FAIL.
- [ ] **Step 4: Cài đặt**
```typescript
// src/lib/org/tree.ts
import type { OrgNode } from "./types";

export const nodeById = (nodes: OrgNode[], id: string): OrgNode | null =>
  nodes.find((n) => n.id === id) ?? null;

export const childrenOf = (nodes: OrgNode[], parentId: string): OrgNode[] =>
  nodes.filter((n) => n.parentId === parentId);

/** [node, parent, ..., root] */
export const ancestorChain = (nodes: OrgNode[], id: string): string[] => {
  const out: string[] = [];
  let cur = nodeById(nodes, id);
  while (cur) {
    out.push(cur.id);
    cur = cur.parentId ? nodeById(nodes, cur.parentId) : null;
  }
  return out;
};

/** node + mọi con cháu */
export const subtreeIds = (nodes: OrgNode[], id: string): string[] => {
  const out = [id];
  for (const child of childrenOf(nodes, id)) out.push(...subtreeIds(nodes, child.id));
  return out;
};
```
- [ ] **Step 5: Chạy pass** — PASS (4 test). *(không commit)*

## Task 3: permissions engine

**Files:** Create `src/lib/org/permissions.ts`, `src/lib/org/permissions.test.ts`

- [ ] **Step 1: Test thất bại**
```typescript
// src/lib/org/permissions.test.ts
import { describe, expect, test } from "vitest";
import { effectiveCapabilities, can, profilesForLogin } from "./permissions";
import type { OrgNode, Membership } from "./types";

const N = (id: string, parentId: string | null): OrgNode => ({
  id, name: id, shortName: id, type: "business", parentId, avatarColor: "#000",
});
const NODES: OrgNode[] = [N("root", null), N("child", "root")];
const M = (id: string, loginId: string, nodeId: string, role: Membership["role"]): Membership => ({
  id, loginId, nodeId, role, lockedByPin: false,
});
const MEMBERSHIPS: Membership[] = [
  M("m1", "owner-login", "root", "owner"),
  M("m2", "viewer-login", "child", "viewer"),
];

describe("permissions", () => {
  test("owner ở gốc kế thừa toàn quyền xuống node con", () => {
    const caps = effectiveCapabilities("owner-login", "child", { nodes: NODES, memberships: MEMBERSHIPS });
    expect(can(caps, "members.manage")).toBe(true);
    expect(can(caps, "org.transfer")).toBe(true);
  });
  test("viewer ở node con chỉ xem, không có quyền quản lý", () => {
    const caps = effectiveCapabilities("viewer-login", "child", { nodes: NODES, memberships: MEMBERSHIPS });
    expect(can(caps, "content.view")).toBe(true);
    expect(can(caps, "members.manage")).toBe(false);
  });
  test("extraCapabilities được cộng thêm", () => {
    const ms = [{ ...M("m3", "x", "root", "viewer"), extraCapabilities: ["content.publish_sign"] as const }];
    const caps = effectiveCapabilities("x", "root", { nodes: NODES, memberships: ms });
    expect(can(caps, "content.publish_sign")).toBe(true);
  });
  test("profilesForLogin trả các hồ sơ kèm node", () => {
    const profs = profilesForLogin("owner-login", { nodes: NODES, memberships: MEMBERSHIPS });
    expect(profs).toHaveLength(1);
    expect(profs[0].node?.id).toBe("root");
    expect(profs[0].membership.role).toBe("owner");
  });
});
```
- [ ] **Step 2: Chạy fail** — FAIL.
- [ ] **Step 3: Cài đặt**
```typescript
// src/lib/org/permissions.ts
import { ROLE_CAPABILITIES, type Capability } from "./capabilities";
import { ancestorChain, nodeById } from "./tree";
import type { Membership, OrgNode } from "./types";

interface OrgData { nodes: OrgNode[]; memberships: Membership[]; }

export const effectiveCapabilities = (
  loginId: string, nodeId: string, { nodes, memberships }: OrgData,
): Set<Capability> => {
  const chain = new Set(ancestorChain(nodes, nodeId));
  const caps = new Set<Capability>();
  for (const m of memberships) {
    if (m.loginId !== loginId || !chain.has(m.nodeId)) continue;
    for (const c of ROLE_CAPABILITIES[m.role]) caps.add(c);
    for (const c of m.extraCapabilities ?? []) caps.add(c);
  }
  return caps;
};

export const can = (caps: Set<Capability>, c: Capability): boolean => caps.has(c);

export interface ProfileRef { membership: Membership; node: OrgNode | null; }

export const profilesForLogin = (
  loginId: string, { nodes, memberships }: OrgData,
): ProfileRef[] =>
  memberships
    .filter((m) => m.loginId === loginId)
    .map((m) => ({ membership: m, node: nodeById(nodes, m.nodeId) }));
```
- [ ] **Step 4: Chạy pass** — PASS (4 test). *(không commit)*

## Task 4: data thật — org-mock-data.ts + đổi tên trong mock-data.ts

**Files:** Create `src/lib/org-mock-data.ts`; Modify `src/lib/mock-data.ts`

- [ ] **Step 1: org-mock-data.ts** — dựng LOGINS / ORG_NODES / MEMBERSHIPS đúng demo thật.

Tạo theo đúng kịch bản (giữ tên đang có + 3 tên user cấp + tên hợp lý). Node ids dùng kebab.
```typescript
// src/lib/org-mock-data.ts
import type { Login, OrgNode, Membership } from "./org/types";

export const ORG_NODES: OrgNode[] = [
  // Cây NXB Giáo dục VN
  { id: "nxbgd", name: "NXB Giáo dục VN", shortName: "GD", type: "business", parentId: null, avatarColor: "#20447E", businessLicense: "GP-XB-0123/NXBGD" },
  { id: "nxbgd-toan", name: "Chi nhánh Toán", shortName: "T", type: "business", parentId: "nxbgd", avatarColor: "#237BD3" },
  { id: "nxbgd-van", name: "Chi nhánh Ngữ văn", shortName: "V", type: "business", parentId: "nxbgd", avatarColor: "#0EA5A4" },
  // Đối tác EdTech
  { id: "vietedu", name: "Công ty Công nghệ Giáo dục VietEdu", shortName: "VE", type: "business", parentId: null, avatarColor: "#7C3AED" },
  // Không gian cá nhân (mỗi cá nhân 1 node personal gốc)
  { id: "pn-hong", name: "Nguyễn Minh Hồng", shortName: "MH", type: "personal", parentId: null, avatarColor: "#F59E0B" },
  { id: "pn-hieu", name: "Lê Trung Hiếu", shortName: "LH", type: "personal", parentId: null, avatarColor: "#F59E0B" },
  { id: "pn-nhi", name: "Hoàng Xuân Nhi", shortName: "HN", type: "personal", parentId: null, avatarColor: "#2563EB" },
];

export const LOGINS: Login[] = [
  { id: "login-admin", email: "admin@truonghocso.vn", name: "Admin Trường học số Quốc gia", shortName: "AD", avatarColor: "#EF4444", systemRole: "admin" },
  { id: "login-review", email: "hoidong@truonghocso.vn", name: "Hội đồng thẩm định Trường học số Quốc gia", shortName: "HĐ", avatarColor: "#20447E", systemRole: "reviewer" },
  { id: "login-hong", email: "minhhong@email.vn", name: "Nguyễn Minh Hồng", shortName: "MH", avatarColor: "#F59E0B" },
  { id: "login-thu", email: "anhthu@nxbgd.vn", name: "Đoàn Thuận Anh Thư", shortName: "AT", avatarColor: "#20447E" },
  { id: "login-hieu", email: "letrunghieu@thcs-ltk.edu.vn", name: "Lê Trung Hiếu", shortName: "LH", avatarColor: "#F59E0B" },
  { id: "login-nhi", email: "hoangxuannhi@lhp.edu.vn", name: "Hoàng Xuân Nhi", shortName: "HN", avatarColor: "#2563EB" },
  { id: "login-dat", email: "quocdat@nxbgd.vn", name: "Phạm Quốc Đạt", shortName: "QĐ", avatarColor: "#237BD3" },
];

export const MEMBERSHIPS: Membership[] = [
  // Đoàn Thuận Anh Thư = Chủ sở hữu NXB (toàn cây)
  { id: "ms-thu-nxbgd", loginId: "login-thu", nodeId: "nxbgd", role: "owner", lockedByPin: false },
  // Phạm Quốc Đạt = Quản lý Chi nhánh Toán
  { id: "ms-dat-toan", loginId: "login-dat", nodeId: "nxbgd-toan", role: "manager", lockedByPin: false },
  // Nguyễn Minh Hồng: cá nhân (owner) + CTV NXB (khoá PIN) + Quản lý VietEdu
  { id: "ms-hong-personal", loginId: "login-hong", nodeId: "pn-hong", role: "owner", lockedByPin: false },
  { id: "ms-hong-nxbgd", loginId: "login-hong", nodeId: "nxbgd-van", role: "editor", lockedByPin: true, pin: "1234" },
  { id: "ms-hong-vietedu", loginId: "login-hong", nodeId: "vietedu", role: "manager", lockedByPin: false },
  // Lê Trung Hiếu: cá nhân (owner) + CTV NXB
  { id: "ms-hieu-personal", loginId: "login-hieu", nodeId: "pn-hieu", role: "owner", lockedByPin: false },
  { id: "ms-hieu-nxbgd", loginId: "login-hieu", nodeId: "nxbgd", role: "editor", lockedByPin: false },
  // Hoàng Xuân Nhi: cá nhân (owner) + Quản lý NXB
  { id: "ms-nhi-personal", loginId: "login-nhi", nodeId: "pn-nhi", role: "owner", lockedByPin: false },
  { id: "ms-nhi-nxbgd", loginId: "login-nhi", nodeId: "nxbgd", role: "manager", lockedByPin: false },
];
```
> Lưu ý: thêm vài thành viên "tĩnh" (chỉ hiển thị danh sách, không cần login) cho màn Thành viên: dùng tên thật như Trần Thị Mai, Vũ Đức Long, Đỗ Quỳnh Chi.

- [ ] **Step 2: Đổi tên trong mock-data.ts** — `ACCOUNTS.admin.name` → "Admin Trường học số Quốc gia"; `ACCOUNTS.reviewer.name` → "Hội đồng thẩm định Trường học số Quốc gia". Thay tên placeholder trong `ACCOUNTS.publisher.managers` ("Lê Quốc Owner"→"Đoàn Thuận Anh Thư", "Phạm Thu Manager"→"Trần Thị Mai", "Đỗ Văn Editor"→"Vũ Đức Long", "Vũ Thị Biên Tập"→"Đỗ Quỳnh Chi"). Chỉ sửa chuỗi tên, giữ nguyên cấu trúc.

- [ ] **Step 3: tsc** — `npx tsc --noEmit` → sạch (org-mock-data chưa được dùng nơi nào, hợp lệ). *(không commit)*

## Task 5: Identity store

**Files:** Create `src/stores/identity.ts`, `src/stores/identity.test.ts`

- [ ] **Step 1: Test thất bại**
```typescript
// src/stores/identity.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { useIdentity } from "./identity";

function reset() {
  useIdentity.setState({ activeLoginId: null, activeMembershipId: null, verifiedPins: {} });
}
describe("identity store", () => {
  beforeEach(reset);

  it("loginAs hệ thống (admin) tự chọn hồ sơ hệ thống", () => {
    useIdentity.getState().loginAs("login-admin");
    expect(useIdentity.getState().activeLoginId).toBe("login-admin");
  });

  it("selectProfile mở hồ sơ không khoá ngay; hồ sơ khoá cần verifyPin", () => {
    useIdentity.getState().loginAs("login-hong");
    // hồ sơ cá nhân (không khoá)
    expect(useIdentity.getState().selectProfile("ms-hong-personal")).toBe(true);
    expect(useIdentity.getState().activeMembershipId).toBe("ms-hong-personal");
    // hồ sơ NXB (khoá) — chưa verify
    expect(useIdentity.getState().selectProfile("ms-hong-nxbgd")).toBe(false);
    // sai PIN
    expect(useIdentity.getState().verifyPin("ms-hong-nxbgd", "0000")).toBe(false);
    // đúng PIN -> mở được
    expect(useIdentity.getState().verifyPin("ms-hong-nxbgd", "1234")).toBe(true);
    expect(useIdentity.getState().selectProfile("ms-hong-nxbgd")).toBe(true);
    expect(useIdentity.getState().activeMembershipId).toBe("ms-hong-nxbgd");
  });
});
```
- [ ] **Step 2: Chạy fail** — FAIL.
- [ ] **Step 3: Cài đặt**
```typescript
// src/stores/identity.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LOGINS, MEMBERSHIPS } from "@/lib/org-mock-data";

interface IdentityState {
  activeLoginId: string | null;
  activeMembershipId: string | null;
  verifiedPins: Record<string, boolean>;
  hasHydrated: boolean;
  loginAs: (loginId: string) => void;
  /** mở hồ sơ; trả false nếu hồ sơ khoá mà chưa verify PIN */
  selectProfile: (membershipId: string) => boolean;
  verifyPin: (membershipId: string, pin: string) => boolean;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useIdentity = create<IdentityState>()(
  persist(
    (set, get) => ({
      activeLoginId: null,
      activeMembershipId: null,
      verifiedPins: {},
      hasHydrated: false,
      loginAs: (loginId) => set({ activeLoginId: loginId, activeMembershipId: null }),
      verifyPin: (membershipId, pin) => {
        const m = MEMBERSHIPS.find((x) => x.id === membershipId);
        const ok = !!m && m.lockedByPin && m.pin === pin;
        if (ok) set((s) => ({ verifiedPins: { ...s.verifiedPins, [membershipId]: true } }));
        return ok;
      },
      selectProfile: (membershipId) => {
        const m = MEMBERSHIPS.find((x) => x.id === membershipId);
        if (!m) return false;
        if (m.lockedByPin && !get().verifiedPins[membershipId]) return false;
        set({ activeMembershipId: membershipId });
        return true;
      },
      logout: () => set({ activeLoginId: null, activeMembershipId: null, verifiedPins: {} }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "gk-identity",
      partialize: (s) => ({ activeLoginId: s.activeLoginId, activeMembershipId: s.activeMembershipId }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
```
- [ ] **Step 4: Chạy pass** — PASS. *(không commit)*

## Task 6: GATE Phase 0
- [ ] `npx tsc --noEmit && npm run test && npm run build` → xanh (test mới: capabilities, tree, permissions, identity).

---

# PHASE 1 — Selectors cầu nối + view-group

## Task 7: Hook ngữ cảnh hồ sơ + cầu nối session

**Files:** Create `src/lib/org/use-active-profile.ts`; Modify `src/stores/session.ts`

- [ ] **Step 1: session.ts thêm activeNodeId + setViewFromProfile**
Thêm field `activeNodeId?: string` và action `setView: (roleId: RoleId, activeNodeId?: string) => void` (set roleId làm view-group + activeNodeId). Giữ nguyên các field cũ (roleId, workspace, schoolRole, hasHydrated). Persist thêm activeNodeId.

- [ ] **Step 2: use-active-profile.ts** — gom identity + org data thành ngữ cảnh tiện dùng.
```typescript
// src/lib/org/use-active-profile.ts
import { LOGINS, ORG_NODES, MEMBERSHIPS } from "@/lib/org-mock-data";
import { useIdentity } from "@/stores/identity";
import { effectiveCapabilities, can as canCap, type ProfileRef } from "./permissions";
import { nodeById } from "./tree";
import type { Capability } from "./capabilities";
import type { Login, Membership, OrgNode } from "./types";

export interface ActiveProfile {
  login: Login | null;
  membership: Membership | null;
  node: OrgNode | null;
  capabilities: Set<Capability>;
  can: (c: Capability) => boolean;
  viewGroup: "admin" | "reviewer" | "creator" | "org" | null;
}

export function useActiveProfile(): ActiveProfile {
  const loginId = useIdentity((s) => s.activeLoginId);
  const membershipId = useIdentity((s) => s.activeMembershipId);
  const login = LOGINS.find((l) => l.id === loginId) ?? null;
  const membership = MEMBERSHIPS.find((m) => m.id === membershipId) ?? null;
  const node = membership ? nodeById(ORG_NODES, membership.nodeId) : null;
  const capabilities = login && membership
    ? effectiveCapabilities(login.id, membership.nodeId, { nodes: ORG_NODES, memberships: MEMBERSHIPS })
    : new Set<Capability>();
  const viewGroup = login?.systemRole === "admin" ? "admin"
    : login?.systemRole === "reviewer" ? "reviewer"
    : node?.type === "business" ? "org"
    : node?.type === "personal" ? "creator"
    : null;
  return { login, membership, node, capabilities, can: (c) => canCap(capabilities, c), viewGroup };
}
```
- [ ] **Step 3: tsc** → sạch. *(không commit)*

---

# PHASE 2 — Login + Netflix flow + switcher

## Task 8: Login tiles + màn Chọn hồ sơ + PIN dialog
**Files:** Modify `src/routes/login.tsx`; Create `src/components/identity/profile-picker.tsx`, `src/components/identity/pin-dialog.tsx`

Theo `/mobifone-ui` + `/ui-ux-pro-max`.
- [ ] **Step 1: login.tsx** — render tile cho mỗi `LOGINS` (tên + email + avatar). Click:
  - login `systemRole` (admin/reviewer): `useIdentity.loginAs(id)`; nếu chỉ có 0 membership → set view-group qua session (admin→/admin/dashboard, reviewer→/reviewer/queue) và điều hướng thẳng.
  - login thường: `loginAs(id)` → điều hướng tới `/choose-profile` (màn chọn hồ sơ).
- [ ] **Step 2: profile-picker.tsx** (route `/choose-profile`) — `profilesForLogin(activeLoginId)` → lưới thẻ hồ sơ (avatar node, tên node, nhãn vai trò `ORG_ROLE_LABELS`, badge 🔒 nếu lockedByPin). Click hồ sơ:
  - không khoá → `selectProfile` → set session view-group + activeNodeId → điều hướng theo viewGroup (org→/org/dashboard, creator→/creator/dashboard).
  - khoá → mở `pin-dialog`; verify đúng → selectProfile → điều hướng.
  - Empty/locked state rõ ràng (ui-ux-pro-max). Tạo route file `src/routes/choose-profile.tsx`.
- [ ] **Step 3: pin-dialog.tsx** — Dialog nhập PIN (dùng `input-otp` đã có trong deps hoặc Input), gọi `verifyPin`, báo lỗi sai PIN, thành công đóng + callback. Token-only.
- [ ] **Step 4:** tsc + smoke (login Nguyễn Minh Hồng → 3 hồ sơ, hồ sơ NXB cần PIN 1234). *(không commit)*

## Task 9: Profile switcher trên header
**Files:** Create `src/components/identity/profile-switcher.tsx`; Modify `src/components/content-studio-shell.tsx` (thay RoleSwitcher bằng ProfileSwitcher khi có activeLogin)

- [ ] **Step 1: profile-switcher.tsx** — dropdown liệt kê các hồ sơ của login hiện tại (giống profile-picker thu nhỏ), đổi hồ sơ (PIN nếu khoá) + mục "Đăng xuất" + (nếu là login demo) cho phép về trang login để đổi login. Token-only, /ui-ux-pro-max.
- [ ] **Step 2:** Trong shell header thay `<RoleSwitcher />` bằng `<ProfileSwitcher />` cho luồng identity (giữ RoleSwitcher cho school/luồng cũ nếu cần). tsc + smoke. *(không commit)*

---

# PHASE 3 — Shell nav theo năng lực + ownership

## Task 10: Nav gate theo capability + ownership = node đang hoạt động
**Files:** Modify `src/components/content-studio-shell.tsx`

- [ ] **Step 1:** Thêm `requiredCapability?: Capability` vào `NavItem`. Trong `getNavSections` cho nhóm `org` (business) dựng các mục: Trang chủ, Thư viện, **Tổ chức & đơn vị** (`/org/structure`, cần `suborg.manage`), **Thành viên & vai trò** (`/org/members`, cần `members.manage`), **Đăng ký & ký số** (`/org/signing`, cần `content.publish_sign`), **Phân tích** (`/org/analytics`, cần `analytics.view`), Kênh, Xác minh. Lọc bỏ mục nào active profile không `can(requiredCapability)`.
- [ ] **Step 2:** Shell đọc `useActiveProfile()`; nếu có active profile → dùng viewGroup + capability gating; account hiển thị = `node` (business) hoặc `login` (personal). Nút "Tạo mới" hiện khi `can("content.create")`.
- [ ] **Step 3:** Ownership: nơi tạo nội dung (`createDraft` owner id) dùng `activeNodeId` (node đang hoạt động) thay cho `resolveActiveOrgId`. Nội dung tạo trong hồ sơ business → ownerId = node business; trong personal → node personal.
- [ ] **Step 4:** tsc + smoke (đổi giữa hồ sơ Editor vs Owner thấy menu khác nhau; Editor không thấy Thành viên/Ký số). *(không commit)*

## Task 11: GATE Phase 1–3
- [ ] `npx tsc --noEmit && npm run test && npm run build` → xanh.

---

# PHASE 4 — Màn tổ chức con + thành viên & vai trò

## Task 12: Màn "Tổ chức & đơn vị" (cây org con)
**Files:** Create `src/components/org/org-tree-page.tsx`, `src/routes/org.structure.tsx`

Theo `/mobifone-ui` + `/ui-ux-pro-max`.
- [ ] **Step 1:** `OrgStructurePage` — lấy node đang hoạt động; render **cây con** (`subtreeIds`/`childrenOf` từ ORG_NODES) dạng tree/khối thẻ: mỗi node con hiện tên, vai trò người quản, số thành viên. Nút "Tạo đơn vị con" (Dialog mock → toast) hiện khi `can("suborg.manage")`. Chọn node con → xem chi tiết (read-only). Empty state nếu không có con.
- [ ] **Step 2:** route `/org/structure` → OrgStructurePage. tsc + smoke (login Đoàn Thuận Anh Thư → thấy Chi nhánh Toán/Ngữ văn). *(không commit)*

## Task 13: Màn "Thành viên & vai trò"
**Files:** Create `src/components/org/org-members-page.tsx`, `src/routes/org.members.tsx` *(kiểm tra org.members.tsx có sẵn — nếu có, thay nội dung giữ path; cập nhật import trong shell nếu cần)*

- [ ] **Step 1:** `OrgMembersPage` — bảng thành viên của node đang hoạt động (từ MEMBERSHIPS lọc theo nodeId + ancestor inheritance ghi chú "kế thừa từ <node cha>"), cột: tên (từ LOGINS hoặc thành viên tĩnh), vai trò (`ORG_ROLE_LABELS` qua `Select` đổi vai trò — mock toast), nguồn (trực tiếp/kế thừa), PIN khoá (toggle mock). Nút "Mời thành viên" (Dialog mock) hiện khi `can("members.manage")`. Hàng action: đổi vai trò, gỡ (toast).
- [ ] **Step 2:** route `/org/members`. tsc + smoke (Owner thấy & sửa vai trò; Editor không vào được menu này). *(không commit)*

## Task 14: GATE + smoke 4 kịch bản
- [ ] **Step 1:** `npx tsc --noEmit && npm run test && npm run build` → xanh.
- [ ] **Step 2:** Smoke 4 kịch bản: (a) Nguyễn Minh Hồng 3 hồ sơ + PIN; (b) Đoàn Thuận Anh Thư quản toàn cây NXB + org con; (c) Lê Trung Hiếu CTV tạo nội dung trong NXB → ownerId = NXB; (d) hồ sơ Editor/Viewer menu giới hạn. Admin & Hội đồng đổi tên đúng.
- [ ] **Step 3:** Tự kiểm `/mobifone-ui`: Grep các file mới (`src/components/identity`, `src/components/org`, `src/routes/{choose-profile,org.structure,org.members}.tsx`) không có hex/arbitrary/default-palette color.

---

## Phụ lục — tên định danh nhất quán
- capabilities.ts: `Capability`, `ALL_CAPABILITIES`, `OrgRoleId`, `ORG_ROLE_LABELS`, `ROLE_CAPABILITIES`.
- org/types.ts: `Login`, `OrgNode`, `OrgNodeType`, `Membership`.
- tree.ts: `nodeById`, `childrenOf`, `ancestorChain`, `subtreeIds`.
- permissions.ts: `effectiveCapabilities`, `can`, `profilesForLogin`, `ProfileRef`.
- org-mock-data.ts: `LOGINS`, `ORG_NODES`, `MEMBERSHIPS`.
- stores/identity.ts: `useIdentity` (`activeLoginId`, `activeMembershipId`, `loginAs`, `selectProfile`, `verifyPin`, `logout`).
- use-active-profile.ts: `useActiveProfile` → `{ login, membership, node, capabilities, can, viewGroup }`.
- session.ts (sửa): `activeNodeId`, `setView`.

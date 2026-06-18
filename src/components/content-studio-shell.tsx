import { useEffect, useState, type ComponentType } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  ChevronsUpDown,
  FileCheck2,
  Home,
  Library,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Tv,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { builderHref } from "@/lib/builder-url";
import { ACCOUNTS, CONTENT_REPORTS, VERIFICATION_REQUESTS } from "@/lib/mock-data";
import type { CreationCategory, LearningMaterialSubtype, RoleId } from "@/lib/types";
import { resolveActiveOrgId } from "@/lib/use-scoped-content";
import { cn } from "@/lib/utils";
import { useContent } from "@/stores/content";
import { useSession, type Workspace } from "@/stores/session";
import { useUi } from "@/stores/ui";
import { RoleSwitcher } from "./role-switcher";
import { MaterialTypePicker } from "./shared/material-type-picker";
import { VerifiedBadge } from "./shared/verified-badge";

/* ─── Types ─────────────────────────────────────────────────────── */

type BadgeKey = "pending" | "verifications" | "reports";
type IconType = ComponentType<{ className?: string }>;

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  badge?: BadgeKey;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

/* ─── Role → EXCLUSIVE Navigation mapping ─────────────────────── */

const TEACHER_NAV: NavSection[] = [
  {
    id: "personal",
    label: "Cá nhân",
    items: [
      { to: "/creator/dashboard", label: "Trang chủ", icon: Home },
      { to: "/creator/library", label: "Thư viện của tôi", icon: Library },
      { to: "/creator/channel", label: "Kênh của tôi", icon: Tv },
      { to: "/creator/verification", label: "Xác minh tài khoản", icon: BadgeCheck },
    ],
  },
];

const ORG_NAV: NavSection[] = [
  {
    id: "org",
    label: "Tổ chức",
    items: [
      { to: "/org/dashboard", label: "Trang chủ", icon: Home },
      { to: "/org/library", label: "Thư viện tổ chức", icon: Library },
      { to: "/org/channel", label: "Kênh tổ chức", icon: Tv },
      { to: "/org/members", label: "Quản lý thành viên", icon: Users },
      { to: "/org/verification", label: "Xác minh tổ chức", icon: BadgeCheck },
    ],
  },
];

const ADMIN_NAV: NavSection[] = [
  {
    id: "admin",
    label: "Quản trị",
    items: [
      { to: "/admin/dashboard", label: "Tổng quan", icon: BarChart3 },
      { to: "/admin/users", label: "Quản lý người dùng", icon: Users },
      { to: "/admin/content-review", label: "Duyệt nội dung", icon: FileCheck2, badge: "pending" },
      { to: "/admin/verification-requests", label: "Duyệt xác minh", icon: BadgeCheck, badge: "verifications" },
      { to: "/admin/reports", label: "Báo cáo vi phạm", icon: ShieldAlert, badge: "reports" },
      { to: "/admin/settings", label: "Cấu hình hệ thống", icon: Settings },
    ],
  },
];

function getNavSections(roleId: RoleId, workspace: Workspace): NavSection[] {
  switch (roleId) {
    case "admin":
      return ADMIN_NAV;
    case "publisher":
      return ORG_NAV;
    case "teacher":
    case "verified_teacher":
    default:
      return workspace === "org" ? ORG_NAV : TEACHER_NAV;
  }
}

function getFooterNav(roleId: RoleId, workspace: Workspace): NavItem[] {
  if (roleId === "admin") return [];
  const settingsTo = (roleId === "publisher" || workspace === "org") ? "/org/settings" : "/creator/settings";
  return [{ to: settingsTo, label: "Cài đặt", icon: Settings }];
}

function canCreate(roleId: RoleId): boolean {
  return roleId !== "admin";
}

function getScopeFromWorkspace(roleId: RoleId, workspace: Workspace): "creator" | "org" {
  if (roleId === "publisher" || workspace === "org") return "org";
  return "creator";
}

/* ─── Main Shell ──────────────────────────────────────────────── */

export function ContentStudioShell() {
  const roleId = useSession((s) => s.roleId);
  const workspace = useSession((s) => s.workspace);
  const createDraft = useContent((s) => s.createDraft);
  const pendingCount = useContent((s) => s.items.filter((i) => i.status === "pending").length);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!roleId) navigate({ to: "/login" });
  }, [roleId, navigate]);

  if (!roleId) return null;

  const account = ACCOUNTS[roleId];
  const isBuilder = pathname.includes("/builder/");
  const sections = getNavSections(roleId, workspace);
  const footerNav = getFooterNav(roleId, workspace);
  const showCreate = canCreate(roleId);
  const scope = getScopeFromWorkspace(roleId, workspace);
  // Content created inside the org workspace is owned by the org, not the person.
  const createOwnerId = scope === "org" ? resolveActiveOrgId(roleId) : roleId;

  const badges: Record<BadgeKey, number> = {
    pending: pendingCount,
    verifications: VERIFICATION_REQUESTS.filter((r) => r.status === "pending").length,
    reports: CONTENT_REPORTS.filter((r) => r.status === "open").length,
  };

  // Opening a builder always launches a fresh browser tab (URL = that builder).
  // zustand's persist writes the new draft to localStorage synchronously, so the
  // tab we open reads it back immediately.
  const handleCreateCategory = (category: CreationCategory) => {
    if (category === "learning_material") return;
    const id = createDraft(category, createOwnerId, { category });
    window.open(builderHref(scope, { id, category, materialSubtype: undefined }), "_blank", "noopener");
  };

  const handleCreateMaterial = (materialSubtype: LearningMaterialSubtype) => {
    const id = createDraft("learning_material", createOwnerId, {
      category: "learning_material",
      materialSubtype,
    });
    window.open(
      builderHref(scope, { id, category: "learning_material", materialSubtype }),
      "_blank",
      "noopener",
    );
  };

  // Builder routes render full-screen.
  if (isBuilder) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Outlet />
      </div>
    );
  }

  const shellTitle =
    roleId === "admin"
      ? "Admin Console"
      : workspace === "org"
        ? "Org Studio"
        : "Content Studio";

  return (
    <div className="min-h-screen bg-muted/20 pb-16 lg:pb-0">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border bg-sidebar lg:block">
        <UnifiedNav
          roleId={roleId}
          workspace={workspace}
          sections={sections}
          footerNav={footerNav}
          pathname={pathname}
          badges={badges}
          showCreate={showCreate}
          onCreate={() => setPickerOpen(true)}
        />
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Mở menu điều hướng"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <UnifiedNav
                  roleId={roleId}
                  workspace={workspace}
                  sections={sections}
                  footerNav={footerNav}
                  pathname={pathname}
                  badges={badges}
                  showCreate={showCreate}
                  onCreate={() => setPickerOpen(true)}
                />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <div className="truncate font-semibold text-foreground">{shellTitle}</div>
            </div>
          </div>

          {roleId !== "admin" && <HeaderSearch scope={scope} />}

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <RoleSwitcher />
            {showCreate && (
              <Button
                size="sm"
                className="gap-1.5 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                onClick={() => setPickerOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Tạo mới</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label="Thông báo" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF4444]" />
            </Button>
            <div className="hidden items-center gap-2 border-l border-border pl-3 sm:flex">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: account.avatarColor }}
              >
                {account.shortName}
              </span>
              <div className="hidden text-right md:block">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  {account.name}
                  <VerifiedBadge verified={account.verified} />
                </div>
                <div className="text-xs text-muted-foreground">{account.accountType}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <BottomNav
        roleId={roleId}
        sections={sections}
        pathname={pathname}
        showCreate={showCreate}
        onCreate={() => setPickerOpen(true)}
      />

      {/* Material type picker dialog */}
      {showCreate && (
        <MaterialTypePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onPickCategory={handleCreateCategory}
          onPickMaterial={handleCreateMaterial}
        />
      )}
    </div>
  );
}

/* ─── Workspace Switcher ───────────────────────────────────────── */

function WorkspaceSwitcher({ roleId }: { roleId: RoleId }) {
  const workspace = useSession((s) => s.workspace);
  const setWorkspace = useSession((s) => s.setWorkspace);
  const navigate = useNavigate();
  const account = ACCOUNTS[roleId];
  const memberships = account.orgMemberships ?? [];

  // Only show for personal accounts that have org memberships
  if (roleId === "admin" || roleId === "publisher" || memberships.length === 0) return null;

  const currentLabel =
    workspace === "org"
      ? memberships[0]?.orgName ?? "Tổ chức"
      : `${account.name} (Cá nhân)`;
  const currentColor =
    workspace === "org" ? memberships[0]?.orgColor ?? "#6B7280" : account.avatarColor;
  const currentShort =
    workspace === "org" ? memberships[0]?.orgShortName ?? "ORG" : account.shortName;

  const handleSwitch = (ws: Workspace) => {
    setWorkspace(ws);
    if (ws === "org") navigate({ to: "/org/dashboard" });
    else navigate({ to: "/creator/dashboard" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition hover:bg-muted/60"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
            style={{ backgroundColor: currentColor }}
          >
            {currentShort}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-foreground">{currentLabel}</div>
            <div className="text-[10px] text-muted-foreground">
              {workspace === "org" ? "Kênh tổ chức" : "Kênh cá nhân"}
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {/* Personal option */}
        <DropdownMenuItem
          onClick={() => handleSwitch("personal")}
          className={cn(
            "gap-2.5",
            workspace === "personal" && "bg-accent",
          )}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: account.avatarColor }}
          >
            {account.shortName}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{account.name}</div>
            <div className="text-[10px] text-muted-foreground">Kênh cá nhân</div>
          </div>
          {workspace === "personal" && (
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Org options */}
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.orgId}
            onClick={() => handleSwitch("org")}
            className={cn(
              "gap-2.5",
              workspace === "org" && "bg-accent",
            )}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: m.orgColor }}
            >
              {m.orgShortName}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{m.orgName}</div>
              <div className="text-[10px] text-muted-foreground">
                {m.role === "owner" ? "Chủ sở hữu" : m.role === "manager" ? "Quản lý" : "Biên tập viên"}
              </div>
            </div>
            {workspace === "org" && (
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Unified Sidebar Navigation ───────────────────────────────── */

function UnifiedNav({
  roleId,
  workspace,
  sections,
  footerNav,
  pathname,
  badges,
  showCreate,
  onCreate,
}: {
  roleId: RoleId;
  workspace: Workspace;
  sections: NavSection[];
  footerNav: NavItem[];
  pathname: string;
  badges: Record<BadgeKey, number>;
  showCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <img src="/assets/logo/Logomark.svg" alt="Trường học số" className="h-8 w-8" />
        <div className="min-w-0">
          <div className="truncate font-semibold text-sidebar-foreground">Trường học số</div>
          <div className="text-xs text-muted-foreground">Content Studio</div>
        </div>
      </div>

      {/* Workspace switcher — only for personal accounts with org memberships */}
      <div className="px-3 pt-3">
        <WorkspaceSwitcher roleId={roleId} />
      </div>

      {/* Create button */}
      {showCreate && (
        <div className="px-3 pt-3">
          <Button
            className="w-full justify-start gap-2 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" /> Tạo mới
          </Button>
        </div>
      )}

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto p-3">
        {sections.map((section, idx) => (
          <div key={section.id}>
            {idx > 0 && <div className="my-2 border-t border-border" />}
            <div className="mb-1 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLinkRow key={item.to} item={item} pathname={pathname} badges={badges} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer nav */}
      {footerNav.length > 0 && (
        <div className="space-y-1 border-t border-border p-3">
          {footerNav.map((item) => (
            <NavLinkRow key={item.to} item={item} pathname={pathname} badges={badges} />
          ))}
        </div>
      )}

      {/* Account info */}
      <div className="flex items-center gap-3 border-t border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-sidebar-foreground">
            Content Studio
          </div>
          <div className="text-xs text-muted-foreground">Quản lý nội dung</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────── */

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavLinkRow({
  item,
  pathname,
  badges,
}: {
  item: NavItem;
  pathname: string;
  badges: Record<BadgeKey, number>;
}) {
  const Icon = item.icon;
  const active = isActive(pathname, item.to);
  const count = item.badge ? badges[item.badge] : 0;
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{item.label}</span>
      {count > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function HeaderSearch({ scope }: { scope: "creator" | "org" }) {
  const navigate = useNavigate();
  const setLibrarySearch = useUi((s) => s.setLibrarySearch);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const libraryTo = scope === "org" ? "/org/library" : "/creator/library";

  const submit = () => {
    setLibrarySearch(value);
    navigate({ to: libraryTo });
    setOpen(false);
  };

  return (
    <>
      <div className="relative mx-2 hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Tìm học liệu, bộ đề, khóa học…"
          className="pl-9"
          aria-label="Tìm kiếm"
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Tìm kiếm"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-2 border-b border-border bg-card px-4 md:hidden">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Tìm kiếm…"
            className="flex-1 border-none shadow-none focus-visible:ring-0"
            aria-label="Tìm kiếm"
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Đóng tìm kiếm"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </>
  );
}

function BottomNav({
  roleId,
  sections,
  pathname,
  showCreate,
  onCreate,
}: {
  roleId: RoleId;
  sections: NavSection[];
  pathname: string;
  showCreate: boolean;
  onCreate: () => void;
}) {
  const allItems = sections.flatMap((s) => s.items);
  const leftItems = allItems.slice(0, 2);
  const rightItems = allItems.slice(2, 4);
  const overflowItems = allItems.slice(4);

  const MobileItem = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(pathname, item.to);
    const shortLabel = item.label.split(" ").slice(-1)[0];
    return (
      <Link
        to={item.to}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
          active ? "text-[#2563EB]" : "text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
        {shortLabel}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid items-center border-t border-border bg-card lg:hidden"
      style={{ gridTemplateColumns: `repeat(${showCreate ? leftItems.length + 1 + rightItems.length + (overflowItems.length > 0 ? 1 : 0) : allItems.length + (overflowItems.length > 0 ? 1 : 0)}, 1fr)` }}
    >
      {leftItems.map((item) => (
        <MobileItem key={item.to} item={item} />
      ))}

      {showCreate && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCreate}
            aria-label="Tạo mới"
            className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg ring-4 ring-card"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}

      {rightItems.map((item) => (
        <MobileItem key={item.to} item={item} />
      ))}

      {overflowItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
              Thêm
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top">
            {overflowItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to} className="gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}

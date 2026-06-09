import { useEffect } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  ListChecks,
  BookOpen,
  BarChart3,
  Settings,
  Users,
  ShieldCheck,
  Plus,
  BadgeCheck,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/stores/session";
import { ACCOUNTS } from "@/lib/mock-data";
import { useContent } from "@/stores/content";
import { RoleSwitcher } from "./role-switcher";
import { VerifiedBadge } from "./verified-badge";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/content", label: "Nội dung của tôi", icon: FileText },
  { to: "/quizzes", label: "Bộ đề", icon: ListChecks },
  { to: "/materials", label: "Học liệu", icon: BookOpen },
  { to: "/analytics", label: "Phân tích", icon: BarChart3 },
  { to: "/channel", label: "Kênh của tôi", icon: UserCircle },
  { to: "/verification", label: "Tích xanh", icon: BadgeCheck },
  { to: "/settings", label: "Cài đặt", icon: Settings },
] as const;

export function AppShell() {
  const roleId = useSession((s) => s.roleId);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const createDraft = useContent((s) => s.createDraft);

  useEffect(() => {
    if (!roleId) navigate({ to: "/login" });
  }, [roleId, navigate]);

  if (!roleId) return null;
  const account = ACCOUNTS[roleId];
  const isAdmin = roleId === "admin";

  const handleCreate = (type: "quiz" | "material") => {
    const id = createDraft(type, roleId);
    navigate({
      to: type === "quiz" ? "/builder/quiz/$id" : "/builder/material/$id",
      params: { id },
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            GK
          </div>
          <span className="text-base font-semibold text-foreground">GK Studio</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <>
              <div className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Admin
              </div>
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  pathname.startsWith("/admin")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                )}
              >
                <ShieldCheck className="h-4 w-4" /> Duyệt nội dung
              </Link>
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60"
              >
                <Users className="h-4 w-4" /> Quản lý người dùng
              </Link>
            </>
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              GK
            </div>
            <span className="text-base font-semibold">GK Studio</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <RoleSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5 bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
                  <Plus className="h-4 w-4" /> Tạo mới
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCreate("quiz")}>
                  <ListChecks className="mr-2 h-4 w-4" /> Bộ đề
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreate("material")}>
                  <BookOpen className="mr-2 h-4 w-4" /> Học liệu
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-2 border-l border-border pl-3">
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
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
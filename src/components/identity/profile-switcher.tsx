import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Lock, LogOut, UserCog } from "lucide-react";
import { LOGINS, ORG_NODES, MEMBERSHIPS } from "@/lib/org-mock-data";
import { profilesForLogin, type ProfileRef } from "@/lib/org/permissions";
import { ORG_ROLE_LABELS } from "@/lib/org/capabilities";
import { viewGroupRoleIdFor } from "@/lib/org/use-active-profile";
import { useIdentity } from "@/stores/identity";
import { useSession } from "@/stores/session";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PinDialog } from "./pin-dialog";

function homePathForRole(role: ReturnType<typeof viewGroupRoleIdFor>): string {
  if (role === "publisher") return "/org/dashboard";
  if (role === "admin") return "/admin/dashboard";
  if (role === "reviewer") return "/reviewer/queue";
  return "/creator/dashboard";
}

/**
 * Đổi hồ sơ trên header cho luồng identity. Trả về null nếu không có login đang
 * hoạt động (để shell rơi về RoleSwitcher của luồng cũ).
 */
export function ProfileSwitcher() {
  const navigate = useNavigate();
  const activeLoginId = useIdentity((s) => s.activeLoginId);
  const activeMembershipId = useIdentity((s) => s.activeMembershipId);
  const selectProfile = useIdentity((s) => s.selectProfile);
  const verifiedPins = useIdentity((s) => s.verifiedPins);
  const logout = useIdentity((s) => s.logout);
  const setView = useSession((s) => s.setView);
  const setRole = useSession((s) => s.setRole);
  const [pinProfile, setPinProfile] = useState<ProfileRef | null>(null);

  const login = LOGINS.find((l) => l.id === activeLoginId) ?? null;
  if (!login) return null;

  const profiles = profilesForLogin(login.id, { nodes: ORG_NODES, memberships: MEMBERSHIPS });
  const current = profiles.find((p) => p.membership.id === activeMembershipId) ?? null;
  const currentNode = current?.node ?? null;
  const currentLabel = currentNode?.name ?? login.name;
  const currentShort = currentNode?.shortName ?? login.shortName;
  const currentColor = currentNode?.avatarColor ?? login.avatarColor;

  const openProfile = (membershipId: string) => {
    if (!selectProfile(membershipId)) return;
    const profile = profiles.find((p) => p.membership.id === membershipId);
    const node = profile?.node ?? null;
    const role = viewGroupRoleIdFor(login, node);
    setView(role, node?.id);
    navigate({ to: homePathForRole(role) as string });
  };

  const handlePick = (profile: ProfileRef) => {
    if (profile.membership.id === activeMembershipId) return;
    const { membership } = profile;
    const isUnlocked = !membership.lockedByPin || verifiedPins[membership.id];
    if (isUnlocked) {
      openProfile(membership.id);
      return;
    }
    setPinProfile(profile);
  };

  const handleLogout = () => {
    logout();
    setRole(null);
    navigate({ to: "/login" });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-left transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ backgroundColor: currentColor }}
            >
              {currentShort}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-[10rem] truncate text-xs font-semibold text-foreground">
                {currentLabel}
              </span>
              {current && (
                <span className="block text-[10px] text-muted-foreground">
                  {ORG_ROLE_LABELS[current.membership.role]}
                </span>
              )}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <UserCog className="h-3.5 w-3.5" />
            {login.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {profiles.map((profile) => {
            const node = profile.node;
            const active = profile.membership.id === activeMembershipId;
            return (
              <DropdownMenuItem
                key={profile.membership.id}
                onClick={() => handlePick(profile)}
                className={cn("gap-2.5", active && "bg-accent")}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={node ? { backgroundColor: node.avatarColor } : undefined}
                >
                  {node?.shortName ?? "HS"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-foreground">
                    {node?.name ?? "Hồ sơ"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {ORG_ROLE_LABELS[profile.membership.role]}
                  </div>
                </div>
                {profile.membership.lockedByPin && !verifiedPins[profile.membership.id] && (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-success" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="gap-2.5 text-destructive">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PinDialog
        profile={pinProfile}
        open={pinProfile !== null}
        onOpenChange={(open) => {
          if (!open) setPinProfile(null);
        }}
        onVerified={(membershipId) => openProfile(membershipId)}
      />
    </>
  );
}

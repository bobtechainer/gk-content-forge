import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock, UserPlus } from "lucide-react";
import { LOGINS, ORG_NODES, MEMBERSHIPS } from "@/lib/org-mock-data";
import { profilesForLogin, type ProfileRef } from "@/lib/org/permissions";
import { ORG_ROLE_LABELS } from "@/lib/org/capabilities";
import { viewGroupRoleIdFor } from "@/lib/org/use-active-profile";
import { useIdentity } from "@/stores/identity";
import { useSession } from "@/stores/session";
import { Button } from "@/components/ui/button";
import { PinDialog } from "./pin-dialog";

/** Đường về màn theo view-group dẫn xuất từ hồ sơ. */
function homePathForRole(role: ReturnType<typeof viewGroupRoleIdFor>): string {
  if (role === "publisher") return "/org/dashboard";
  if (role === "admin") return "/admin/dashboard";
  if (role === "reviewer") return "/reviewer/queue";
  return "/creator/dashboard";
}

export function ProfilePicker({ onBack }: { onBack?: () => void } = {}) {
  const navigate = useNavigate();
  const back = onBack ?? (() => navigate({ to: "/login" }));
  const activeLoginId = useIdentity((s) => s.activeLoginId);
  const selectProfile = useIdentity((s) => s.selectProfile);
  const verifiedPins = useIdentity((s) => s.verifiedPins);
  const setView = useSession((s) => s.setView);
  const [pinProfile, setPinProfile] = useState<ProfileRef | null>(null);

  const login = LOGINS.find((l) => l.id === activeLoginId) ?? null;
  const profiles = activeLoginId
    ? profilesForLogin(activeLoginId, { nodes: ORG_NODES, memberships: MEMBERSHIPS })
    : [];

  const openProfile = (membershipId: string) => {
    if (!login) return;
    if (!selectProfile(membershipId)) return;
    const profile = profiles.find((p) => p.membership.id === membershipId);
    const node = profile?.node ?? null;
    const role = viewGroupRoleIdFor(login, node);
    setView(role, node?.id);
    navigate({ to: homePathForRole(role) as string });
  };

  const handlePick = (profile: ProfileRef) => {
    const { membership } = profile;
    const isUnlocked = !membership.lockedByPin || verifiedPins[membership.id];
    if (isUnlocked) {
      openProfile(membership.id);
      return;
    }
    setPinProfile(profile);
  };

  // Login chưa chọn (deep link / refresh sau khi đăng xuất) → về màn login.
  if (!login) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Chưa có phiên đăng nhập. Hãy chọn tài khoản để tiếp tục.
        </p>
        <Button onClick={back}>Về trang đăng nhập</Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white"
            style={{ backgroundColor: login.avatarColor }}
          >
            {login.shortName}
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Xin chào, {login.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Chọn hồ sơ bạn muốn làm việc. Mỗi hồ sơ có vai trò và quyền riêng.
          </p>
        </header>

        {profiles.length === 0 ? (
          <EmptyProfiles onBack={back} />
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <ProfileCard key={profile.membership.id} profile={profile} onPick={handlePick} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button variant="ghost" size="sm" onClick={back}>
            Đổi tài khoản đăng nhập
          </Button>
        </div>
      </div>

      <PinDialog
        profile={pinProfile}
        open={pinProfile !== null}
        onOpenChange={(open) => {
          if (!open) setPinProfile(null);
        }}
        onVerified={(membershipId) => openProfile(membershipId)}
      />
    </main>
  );
}

function ProfileCard({
  profile,
  onPick,
}: {
  profile: ProfileRef;
  onPick: (profile: ProfileRef) => void;
}) {
  const { membership, node } = profile;
  const name = node?.name ?? "Hồ sơ";
  const shortName = node?.shortName ?? "HS";
  const avatarColor = node?.avatarColor;

  return (
    <button
      type="button"
      onClick={() => onPick(profile)}
      className="group relative flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center shadow-sm transition hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {membership.lockedByPin && (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
        </span>
      )}
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white"
        style={avatarColor ? { backgroundColor: avatarColor } : undefined}
      >
        {shortName}
      </span>
      <div className="w-full">
        <div className="line-clamp-2 break-words font-semibold text-foreground">{name}</div>
        <div className="mt-1 text-xs text-muted-foreground">{ORG_ROLE_LABELS[membership.role]}</div>
      </div>
    </button>
  );
}

function EmptyProfiles({ onBack }: { onBack: () => void }) {
  return (
    <div className="mt-12 flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UserPlus className="h-5 w-5" />
      </span>
      <div>
        <p className="font-medium text-foreground">Tài khoản này chưa có hồ sơ tổ chức nào</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Bạn sẽ được mời vào một tổ chức hoặc tạo không gian cá nhân để bắt đầu.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onBack}>
        Về trang đăng nhập
      </Button>
    </div>
  );
}

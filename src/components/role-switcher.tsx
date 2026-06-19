import { useNavigate } from "@tanstack/react-router";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEMO_LOGINS } from "@/lib/mock-data";
import { getRoleHomePath } from "@/lib/taxonomy";
import { useSession } from "@/stores/session";
import { VerifiedBadge } from "./shared/verified-badge";

export function RoleSwitcher() {
  const setRole = useSession((s) => s.setRole);
  const current = useSession((s) => s.roleId);
  const sessionSchoolRole = useSession((s) => s.schoolRole);
  const navigate = useNavigate();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Repeat className="h-4 w-4" /> Đổi vai trò
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Chọn vai trò demo</p>
        {DEMO_LOGINS.map((login) => {
          const a = login.account;
          const isActive = current === login.roleId && sessionSchoolRole === login.schoolRole;
          return (
            <button
              key={login.key}
              onClick={() => {
                setRole(login.roleId, login.schoolRole);
                navigate({ to: getRoleHomePath(login.roleId, login.schoolRole) as string });
              }}
              className={`flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-accent ${isActive ? "bg-accent" : ""}`}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: a.avatarColor }}
              >
                {a.shortName}
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  {a.name} <VerifiedBadge verified={a.verified} />
                </span>
                <span className="block text-xs text-muted-foreground">{login.tagline}</span>
              </span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

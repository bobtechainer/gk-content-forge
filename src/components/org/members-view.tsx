import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNTS } from "@/lib/mock-data";
import type { OrgMember, OrgRole } from "@/lib/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  manager: "Manager",
  editor: "Editor",
};

const ROLE_STYLE: Record<OrgRole, string> = {
  owner: "bg-primary/10 text-primary",
  manager: "bg-primary/10 text-primary",
  editor: "bg-success/10 text-success",
};

export function MembersView() {
  const loading = usePageLoading();
  const [members, setMembers] = useState<OrgMember[]>(ACCOUNTS.publisher.managers ?? []);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("editor");

  if (loading) return <PageSkeleton />;

  const invite = () => {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      toast.error("Vui lòng nhập email hợp lệ");
      return;
    }
    if (members.some((m) => m.email === value)) {
      toast.error("Thành viên đã tồn tại");
      return;
    }
    setMembers((cur) => [
      ...cur,
      {
        email: value,
        name: value.split("@")[0],
        role,
        joinedAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setEmail("");
    toast.success(`Đã mời ${value} làm ${ROLE_LABELS[role]}`);
  };

  const changeRole = (memberEmail: string, newRole: OrgRole) => {
    setMembers((cur) => cur.map((m) => (m.email === memberEmail ? { ...m, role: newRole } : m)));
    toast.success("Đã cập nhật vai trò");
  };

  const remove = (memberEmail: string) => {
    setMembers((cur) => cur.filter((m) => m.email !== memberEmail));
    toast.success("Đã gỡ thành viên");
  };

  return (
    <PageFrame
      title="Quản lý thành viên"
      description="Mời, phân quyền Owner / Manager / Editor và theo dõi thành viên tổ chức."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mời thành viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="invite-email" className="mb-1.5 block">
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && invite()}
                placeholder="thanhvien@toochuc.vn"
              />
            </div>
            <div className="sm:w-40">
              <Label className="mb-1.5 block">Vai trò</Label>
              <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-1.5 bg-primary text-white hover:bg-primary-hover" onClick={invite}>
              <UserPlus className="h-4 w-4" /> Mời
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách thành viên ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Thành viên</th>
                  <th className="px-4 py-3 font-medium">Vai trò</th>
                  <th className="px-4 py-3 font-medium">Tham gia</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.email} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {m.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{m.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {m.role === "owner" ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_STYLE.owner}`}
                        >
                          Owner
                        </span>
                      ) : (
                        <Select
                          value={m.role}
                          onValueChange={(v) => changeRole(m.email, v as OrgRole)}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.joinedAt}</td>
                    <td className="px-4 py-3 text-right">
                      {m.role !== "owner" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Gỡ ${m.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Gỡ thành viên?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn chắc chắn muốn gỡ {m.name} khỏi tổ chức? Hành động này không thể
                                hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => remove(m.email)}
                              >
                                Gỡ thành viên
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageFrame>
  );
}

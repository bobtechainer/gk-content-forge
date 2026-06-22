import { useMemo, useState } from "react";
import { ArrowUpFromLine, Lock, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { ORG_NODES } from "@/lib/org-mock-data";
import { ORG_ROLE_LABELS, type OrgRoleId } from "@/lib/org/capabilities";
import { nodeById } from "@/lib/org/tree";
import { membersForNode, type MemberRow } from "@/lib/org/members";
import { useActiveProfile } from "@/lib/org/use-active-profile";
import type { OrgNode } from "@/lib/org/types";
import { usePageLoading } from "@/lib/use-page-loading";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageFrame } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";

/** Node hiển thị mặc định khi chưa có hồ sơ tổ chức (deep link / demo). */
const FALLBACK_NODE_ID = "nxbgd";

/** Các vai trò có thể gán (loại owner — chỉ chuyển nhượng riêng). */
const ASSIGNABLE_ROLES: OrgRoleId[] = ["admin", "manager", "publisher", "editor", "viewer"];

export function OrgMembersPage() {
  const loading = usePageLoading();
  const { node: activeNode, can } = useActiveProfile();

  const node = useMemo<OrgNode | null>(
    () =>
      activeNode && activeNode.type === "business"
        ? activeNode
        : nodeById(ORG_NODES, FALLBACK_NODE_ID),
    [activeNode],
  );

  // Trạng thái local (mock) cho vai trò + khoá PIN của các thành viên trực tiếp.
  const [roleOverrides, setRoleOverrides] = useState<Record<string, OrgRoleId>>({});
  const [pinOverrides, setPinOverrides] = useState<Record<string, boolean>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [inviteOpen, setInviteOpen] = useState(false);

  const baseRows = useMemo(
    () => (node ? membersForNode(ORG_NODES, node.id) : []),
    [node],
  );

  if (loading) return <PageSkeleton />;

  if (!node) {
    return (
      <PageFrame title="Thành viên & vai trò" description="Quản lý thành viên và phân quyền của tổ chức.">
        <EmptyState />
      </PageFrame>
    );
  }

  const canManage = can("members.manage");
  const rows = baseRows.filter((r) => !removed.has(r.id));
  const directCount = rows.filter((r) => r.source === "direct").length;
  const inheritedCount = rows.length - directCount;

  const roleOf = (row: MemberRow): OrgRoleId => roleOverrides[row.id] ?? row.role;
  const lockedOf = (row: MemberRow): boolean => pinOverrides[row.id] ?? row.lockedByPin;

  const changeRole = (row: MemberRow, role: OrgRoleId) => {
    setRoleOverrides((cur) => ({ ...cur, [row.id]: role }));
    toast.success(`Đã đổi vai trò của ${row.name} thành ${ORG_ROLE_LABELS[role]}`);
  };

  const togglePin = (row: MemberRow, locked: boolean) => {
    setPinOverrides((cur) => ({ ...cur, [row.id]: locked }));
    toast.success(
      locked ? `Đã bật khoá PIN cho ${row.name}` : `Đã tắt khoá PIN cho ${row.name}`,
    );
  };

  const removeMember = (row: MemberRow) => {
    setRemoved((cur) => new Set(cur).add(row.id));
    toast.success(`Đã gỡ ${row.name} khỏi ${node.name}`);
  };

  return (
    <PageFrame
      title="Thành viên & vai trò"
      description={`Quản lý thành viên và phân quyền của ${node.name}.`}
      actions={
        canManage ? (
          <Button className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Mời thành viên
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" /> {directCount} trực tiếp
        </Badge>
        {inheritedCount > 0 && (
          <Badge variant="outline" className="gap-1">
            <ArrowUpFromLine className="h-3 w-3" /> {inheritedCount} kế thừa
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Thành viên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead className="text-center">Khoá PIN</TableHead>
                  <TableHead className="px-4 text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isDirect = row.source === "direct";
                  const editable = canManage && isDirect && roleOf(row) !== "owner";
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: row.avatarColor }}
                          >
                            {row.shortName}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">{row.name}</div>
                            {row.email && (
                              <div className="truncate text-xs text-muted-foreground">
                                {row.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        {editable ? (
                          <Select
                            value={roleOf(row)}
                            onValueChange={(v) => changeRole(row, v as OrgRoleId)}
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ORG_ROLE_LABELS[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={roleOf(row) === "owner" ? "default" : "secondary"}>
                            {ORG_ROLE_LABELS[roleOf(row)]}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="py-3">
                        {isDirect ? (
                          <span className="text-sm text-muted-foreground">Trực tiếp</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <ArrowUpFromLine className="h-3.5 w-3.5" />
                            Kế thừa từ {row.inheritedFromName}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        {isDirect ? (
                          <Switch
                            checked={lockedOf(row)}
                            disabled={!canManage}
                            onCheckedChange={(checked) => togglePin(row, checked)}
                            aria-label={`Khoá PIN cho ${row.name}`}
                          />
                        ) : lockedOf(row) ? (
                          <Lock className="mx-auto h-4 w-4 text-muted-foreground" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-right">
                        {editable ? (
                          <RemoveMemberButton row={row} nodeName={node.name} onRemove={removeMember} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InviteMemberDialog open={inviteOpen} nodeName={node.name} onOpenChange={setInviteOpen} />
    </PageFrame>
  );
}

function RemoveMemberButton({
  row,
  nodeName,
  onRemove,
}: {
  row: MemberRow;
  nodeName: string;
  onRemove: (row: MemberRow) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          aria-label={`Gỡ ${row.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gỡ thành viên?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn chắc chắn muốn gỡ {row.name} khỏi {nodeName}? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-error-700"
            onClick={() => onRemove(row)}
          >
            Gỡ thành viên
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function InviteMemberDialog({
  open,
  nodeName,
  onOpenChange,
}: {
  open: boolean;
  nodeName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRoleId>("editor");

  const reset = () => {
    setEmail("");
    setRole("editor");
  };

  const submit = () => {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      toast.error("Vui lòng nhập email hợp lệ");
      return;
    }
    toast.success(`Đã gửi lời mời tới ${value} với vai trò ${ORG_ROLE_LABELS[role]}`);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mời thành viên</DialogTitle>
          <DialogDescription>
            Gửi lời mời tham gia {nodeName}. Thành viên sẽ nhận quyền theo vai trò được gán.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="thanhvien@nxbgd.vn"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Vai trò</Label>
            <Select value={role} onValueChange={(v) => setRole(v as OrgRoleId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ORG_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submit}>Gửi lời mời</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium text-foreground">Chưa có tổ chức nào đang hoạt động</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Hãy chọn một hồ sơ tổ chức để xem và quản lý danh sách thành viên.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useMemo, useState } from "react";
import { Building2, ChevronRight, Network, Plus, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { ORG_NODES } from "@/lib/org-mock-data";
import { ORG_ROLE_LABELS } from "@/lib/org/capabilities";
import { childrenOf, nodeById, subtreeIds } from "@/lib/org/tree";
import { directMemberCount, managerNameFor } from "@/lib/org/members";
import { useActiveProfile } from "@/lib/org/use-active-profile";
import type { OrgNode } from "@/lib/org/types";
import { usePageLoading } from "@/lib/use-page-loading";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PageFrame, Metric } from "../shared/page-frame";
import { PageSkeleton } from "../shared/page-skeleton";

/** Node hiển thị mặc định khi chưa có hồ sơ tổ chức (deep link / demo). */
const FALLBACK_NODE_ID = "nxbgd";

export function OrgStructurePage() {
  const loading = usePageLoading();
  const { node: activeNode, can } = useActiveProfile();

  // Node đang hoạt động (hoặc fallback NXB cho demo). Chỉ áp dụng cho org.
  const rootNode = useMemo<OrgNode | null>(
    () => (activeNode && activeNode.type === "business" ? activeNode : nodeById(ORG_NODES, FALLBACK_NODE_ID)),
    [activeNode],
  );

  const children = useMemo(
    () => (rootNode ? childrenOf(ORG_NODES, rootNode.id) : []),
    [rootNode],
  );
  const subtreeCount = useMemo(
    () => (rootNode ? subtreeIds(ORG_NODES, rootNode.id).length - 1 : 0),
    [rootNode],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  if (loading) return <PageSkeleton />;

  if (!rootNode) {
    return (
      <PageFrame title="Tổ chức & đơn vị" description="Quản lý các đơn vị trực thuộc tổ chức của bạn.">
        <EmptyState
          title="Chưa có tổ chức nào đang hoạt động"
          description="Hãy chọn một hồ sơ tổ chức để xem và quản lý các đơn vị trực thuộc."
        />
      </PageFrame>
    );
  }

  const canManage = can("suborg.manage");
  const selected = selectedId ? children.find((c) => c.id === selectedId) ?? null : null;

  const totalMembers = children.reduce((sum, c) => sum + directMemberCount(c.id), 0);

  return (
    <PageFrame
      title="Tổ chức & đơn vị"
      description={`Cơ cấu các đơn vị trực thuộc ${rootNode.name}.`}
      actions={
        canManage ? (
          <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Tạo đơn vị con
          </Button>
        ) : undefined
      }
    >
      {/* Tổ chức gốc + chỉ số nhanh */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-base font-semibold text-white"
              style={{ backgroundColor: rootNode.avatarColor }}
            >
              {rootNode.shortName}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-foreground">{rootNode.name}</h2>
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="h-3 w-3" /> Tổ chức gốc
                </Badge>
              </div>
              {rootNode.businessLicense && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Giấy phép: {rootNode.businessLicense}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-auto">
            <Metric label="Đơn vị trực thuộc" value={String(children.length)} />
            <Metric label="Tổng đơn vị (cây)" value={String(subtreeCount)} />
          </div>
        </CardContent>
      </Card>

      {children.length === 0 ? (
        <EmptyState
          title="Chưa có đơn vị con nào"
          description={
            canManage
              ? "Tạo đơn vị con (chi nhánh, phòng ban…) để phân cấp quản lý nội dung và thành viên."
              : "Tổ chức này hiện chưa phân cấp đơn vị con. Liên hệ chủ sở hữu nếu cần tạo đơn vị mới."
          }
          action={
            canManage ? (
              <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Tạo đơn vị con
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Cây đơn vị con */}
          <Card className="self-start">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Network className="h-4 w-4 text-muted-foreground" /> Đơn vị trực thuộc
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {totalMembers} thành viên trực tiếp
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              {children.map((child) => (
                <UnitRow
                  key={child.id}
                  node={child}
                  active={child.id === selectedId}
                  onSelect={() => setSelectedId(child.id)}
                />
              ))}
            </CardContent>
          </Card>

          {/* Chi tiết đơn vị (read-only) */}
          <UnitDetail node={selected} />
        </div>
      )}

      <CreateUnitDialog
        open={createOpen}
        parentName={rootNode.name}
        onOpenChange={setCreateOpen}
      />
    </PageFrame>
  );
}

function UnitRow({
  node,
  active,
  onSelect,
}: {
  node: OrgNode;
  active: boolean;
  onSelect: () => void;
}) {
  const grandChildren = childrenOf(ORG_NODES, node.id);
  const manager = managerNameFor(node.id);
  const memberCount = directMemberCount(node.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
        active
          ? "border-primary bg-accent"
          : "border-border hover:border-primary/40 hover:bg-muted",
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: node.avatarColor }}
      >
        {node.shortName}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{node.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            {manager ? `Quản lý: ${manager}` : "Chưa có người quản"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {memberCount} thành viên
          </span>
          {grandChildren.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Network className="h-3 w-3" />
              {grandChildren.length} đơn vị con
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function UnitDetail({ node }: { node: OrgNode | null }) {
  if (!node) {
    return (
      <Card className="self-start">
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-2 p-8 text-center">
          <Building2 className="h-9 w-9 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Chọn một đơn vị để xem chi tiết</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Chọn một đơn vị ở danh sách bên trái để xem thông tin người quản lý và thành viên.
          </p>
        </CardContent>
      </Card>
    );
  }

  const manager = managerNameFor(node.id);
  const memberCount = directMemberCount(node.id);
  const grandChildren = childrenOf(ORG_NODES, node.id);

  return (
    <Card className="self-start">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-semibold text-white"
            style={{ backgroundColor: node.avatarColor }}
          >
            {node.shortName}
          </span>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{node.name}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Đơn vị trực thuộc</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <DetailRow label="Người quản lý" value={manager ?? "Chưa phân công"} />
        <DetailRow label="Thành viên trực tiếp" value={`${memberCount} người`} />
        <DetailRow
          label="Đơn vị con"
          value={grandChildren.length > 0 ? `${grandChildren.length} đơn vị` : "Không có"}
        />
        {node.businessLicense && (
          <DetailRow label="Giấy phép" value={node.businessLicense} />
        )}
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Chế độ xem chỉ đọc. Để chỉnh sửa thông tin đơn vị hoặc quản lý thành viên, hãy mở hồ sơ có
          quyền quản trị tương ứng.
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Network className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

function CreateUnitDialog({
  open,
  parentName,
  onOpenChange,
}: {
  open: boolean;
  parentName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");

  const submit = () => {
    const value = name.trim();
    if (!value) {
      toast.error("Vui lòng nhập tên đơn vị");
      return;
    }
    toast.success(`Đã tạo đơn vị "${value}" trực thuộc ${parentName}`);
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo đơn vị con</DialogTitle>
          <DialogDescription>
            Đơn vị mới sẽ trực thuộc {parentName} và kế thừa quyền quản trị từ tổ chức gốc.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="unit-name">Tên đơn vị</Label>
          <Input
            id="unit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Ví dụ: Chi nhánh Khoa học tự nhiên"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submit}>Tạo đơn vị</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

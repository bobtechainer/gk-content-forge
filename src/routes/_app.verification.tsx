import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, CheckCircle2, Clock, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/verification")({
  head: () => ({ meta: [{ title: "Tích xanh — GK Studio" }] }),
  component: Page,
});

type Crit = { label: string; current: number; target: number; unit?: string };

const L1: Crit[] = [
  { label: "Xác minh Email", current: 1, target: 1 },
  { label: "Xác minh số điện thoại", current: 1, target: 1 },
  { label: "Tải lên CCCD / Giấy phép", current: 0, target: 1 },
];
const L2: Crit[] = [
  { label: "Hoàn thành Level 1", current: 2, target: 3 },
  { label: "Số nội dung đã xuất bản", current: 7, target: 10 },
  { label: "Tổng lượt xem", current: 620, target: 1000 },
  { label: "Điểm đánh giá trung bình", current: 38, target: 40, unit: "/10" },
  { label: "Được admin duyệt", current: 0, target: 1 },
];

function statusOf(c: Crit): "done" | "progress" | "todo" {
  if (c.current >= c.target) return "done";
  if (c.current > 0) return "progress";
  return "todo";
}

function StatusIcon({ s }: { s: ReturnType<typeof statusOf> }) {
  if (s === "done") return <CheckCircle2 className="h-4 w-4 text-[#10B981]" />;
  if (s === "progress") return <Clock className="h-4 w-4 text-[#F59E0B]" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

function LevelCard({
  level,
  title,
  subtitle,
  perks,
  crits,
  accent,
  badge,
}: {
  level: number;
  title: string;
  subtitle: string;
  perks: string[];
  crits: Crit[];
  accent: string;
  badge: React.ReactNode;
}) {
  const done = crits.filter((c) => statusOf(c) === "done").length;
  const eligible = done === crits.length;
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          {badge}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Level {level}
            </span>
            {eligible && (
              <span className="rounded-full bg-[#D1FAE5] px-2 py-0.5 text-xs font-medium text-[#065F46]">
                Đã đạt
              </span>
            )}
          </div>
          <h3 className="mt-0.5 text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold text-foreground">{done}/{crits.length}</div>
          <div className="text-xs text-muted-foreground">tiêu chí</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {crits.map((c) => {
          const s = statusOf(c);
          const pct = Math.min(100, Math.round((c.current / c.target) * 100));
          return (
            <div key={c.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-foreground">
                  <StatusIcon s={s} /> {c.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.current}
                  {c.unit ?? ""} / {c.target}
                  {c.unit ?? ""}
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Quyền lợi:</strong> {perks.join(" • ")}
      </div>

      {level === 2 && (
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!eligible}
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            Nộp đơn xin tích xanh
          </Button>
        </div>
      )}
    </Card>
  );
}

function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Hệ thống tích xanh</h1>
        <p className="text-sm text-muted-foreground">
          Lộ trình xác minh đa bậc — nâng cấp tín nhiệm để mở khóa quyền lợi nhà sáng tạo.
        </p>
      </div>

      <div className="relative space-y-4 before:absolute before:left-7 before:top-6 before:bottom-6 before:w-0.5 before:bg-border">
        <LevelCard
          level={1}
          title="Xác minh danh tính"
          subtitle="Hoàn thành các bước xác minh cơ bản để được phép tạo nội dung."
          perks={["Được tạo nội dung", "Xuất bản sau khi admin duyệt"]}
          crits={L1}
          accent="#717680"
          badge={<BadgeCheck className="h-7 w-7" />}
        />
        <LevelCard
          level={2}
          title="Tích xanh chính thức"
          subtitle="Trở thành nhà sáng tạo uy tín — được xác thực bởi GK Studio."
          perks={[
            "Xuất bản trực tiếp không cần duyệt",
            "Channel page đầy đủ",
            "Priority ranking trong tìm kiếm",
          ]}
          crits={L2}
          accent="#2563EB"
          badge={<BadgeCheck className="h-7 w-7 fill-[#DBEAFE]" />}
        />
      </div>
    </div>
  );
}
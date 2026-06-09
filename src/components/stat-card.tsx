import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "#2563EB",
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  trend?: string;
}) {
  return (
    <Card className="flex flex-row items-start justify-between gap-3 p-5">
      <div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
        {trend && <div className="mt-1 text-xs text-[#10B981]">{trend}</div>}
      </div>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}
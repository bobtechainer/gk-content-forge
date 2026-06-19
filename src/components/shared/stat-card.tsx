import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({
  title,
  label,
  value,
  icon: Icon,
  accent,
  trend,
  trendUp,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title ?? label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  trendUp ? "text-success" : "text-destructive",
                )}
              >
                {trend}
              </p>
            )}
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: accent ? `color-mix(in srgb, ${accent} 10%, transparent)` : undefined }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import { QUALITY_LABELS, type QualityTone } from "@/lib/quality-label";
import type { QualityLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<QualityTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-accent text-accent-foreground",
  warning: "bg-warning-100 text-warning-700",
  success: "bg-success/10 text-success",
  brand: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
};

export function QualityBadge({ label, className }: { label: QualityLabel; className?: string }) {
  const meta = QUALITY_LABELS[label];
  return (
    <Badge variant="secondary" className={cn("border-0", TONE_CLASS[meta.tone], className)}>
      {meta.label}
    </Badge>
  );
}

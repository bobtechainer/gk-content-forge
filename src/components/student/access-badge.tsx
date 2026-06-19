import { Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccessTerms, ContentTier } from "@/lib/types";

/**
 * Phân biệt học liệu Tầng Gốc miễn phí với học liệu cần cấp quyền (đối tác trả phí).
 * Quy tắc: Tầng Gốc luôn miễn phí; còn lại miễn phí nếu license.accessTerms === "free",
 * ngược lại là cần cấp quyền.
 */
export function isFreeAccess(tier?: ContentTier, accessTerms?: AccessTerms): boolean {
  if (tier === "root") return true;
  return accessTerms !== "paid";
}

export function AccessBadge({
  tier,
  accessTerms,
  className,
}: {
  tier?: ContentTier;
  accessTerms?: AccessTerms;
  className?: string;
}) {
  const free = isFreeAccess(tier, accessTerms);
  if (free) {
    return (
      <Badge
        variant="secondary"
        className={cn("gap-1 border-0 bg-success/10 text-success", className)}
      >
        <Sparkles className="h-3 w-3" />
        {tier === "root" ? "Tầng Gốc · miễn phí" : "Miễn phí"}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={cn("gap-1 border-0 bg-warning-100 text-warning-700", className)}
    >
      <Lock className="h-3 w-3" />
      Cần cấp quyền
    </Badge>
  );
}

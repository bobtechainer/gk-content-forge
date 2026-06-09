import { BadgeCheck, Shield } from "lucide-react";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VerifiedBadge({
  verified,
  className,
}: {
  verified: Account["verified"];
  className?: string;
}) {
  if (verified === "admin")
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive",
          className,
        )}
      >
        <Shield className="h-3 w-3" /> Admin
      </span>
    );
  if (verified === "L2")
    return <BadgeCheck className={cn("h-4 w-4 text-[#2563EB] fill-[#DBEAFE]", className)} />;
  if (verified === "L1")
    return <BadgeCheck className={cn("h-4 w-4 text-muted-foreground", className)} />;
  return null;
}
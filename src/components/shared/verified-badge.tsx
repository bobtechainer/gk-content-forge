import { BadgeCheck, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/lib/types";

interface VerifiedBadgeProps {
  verified: VerificationStatus;
  className?: string;
}

export function VerifiedBadge({ verified, className }: VerifiedBadgeProps) {
  if (verified === "none") return null;

  if (verified === "pending") {
    return (
      <span title="Đang chờ xác minh">
        <Clock className={cn("h-3.5 w-3.5 text-amber-500", className)} />
      </span>
    );
  }

  if (verified === "rejected") return null;

  // verified
  return (
    <span title="Đã xác minh">
      <BadgeCheck className={cn("h-3.5 w-3.5 text-blue-600", className)} />
    </span>
  );
}

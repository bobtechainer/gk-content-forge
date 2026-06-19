import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export function RegistryIdChip({ id, className }: { id: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground",
        className,
      )}
      title="Mã định danh nội dung"
    >
      <Hash className="h-3 w-3" /> {id}
    </span>
  );
}

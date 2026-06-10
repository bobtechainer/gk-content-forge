import { cn } from "@/lib/utils";

interface LogoLoaderProps {
  label?: string;
  className?: string;
  size?: number;
}

/** Trường học số logo with a pulse + spinning ring, used as the canonical loading indicator. */
export function LogoLoader({ label = "Đang tải...", className, size = 40 }: LogoLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative" style={{ height: size, width: size }}>
        <img
          src="/assets/logo/Logomark.svg"
          alt=""
          className="h-full w-full animate-pulse"
          aria-hidden
        />
        <div
          className="absolute inset-[-6px] animate-spin rounded-full border-2 border-transparent border-t-[#2563EB]"
          style={{ animationDuration: "1.1s" }}
        />
      </div>
      {label && <p className="animate-pulse text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

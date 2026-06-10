import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-3 bg-background px-4 h-14",
        fixed && "sticky top-0 z-50",
        className,
      )}
      {...props}
    >
      <SidebarTrigger variant="outline" className="scale-125 sm:scale-100" />
      <Separator orientation="vertical" className="h-6" />
      {children}
    </header>
  );
}

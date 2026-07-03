import { cn } from "@/lib/utils";

type ResponsiveTableShellProps = {
  children: React.ReactNode;
  className?: string;
  minWidthClassName?: string;
};

export function ResponsiveTableShell({
  children,
  className,
  minWidthClassName = "min-w-[720px]",
}: ResponsiveTableShellProps) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border bg-card", className)}>
      <div className={cn(minWidthClassName, "md:min-w-0")}>{children}</div>
    </div>
  );
}

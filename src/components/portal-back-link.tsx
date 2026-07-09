import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PortalBackLink({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:text-sm",
        className
      )}
    >
      <ArrowLeft className="size-3.5 sm:size-4" />
      <span className="hidden sm:inline">COC-ILIGAN Portal</span>
      <span className="sm:hidden">Portal</span>
    </Link>
  );
}

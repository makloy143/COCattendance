import { Badge } from "@/components/ui/badge";
import type { BorrowStatus } from "@/lib/inventory";

const statusConfig: Record<
  BorrowStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  RETURNED: {
    label: "Returned",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
};

export function BorrowStatusBadge({ status }: { status: BorrowStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

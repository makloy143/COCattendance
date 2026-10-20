import { cn } from "@/lib/utils";
import {
  ID_BAD_PRINT_STATUS_LABELS,
  ID_RELEASE_STATUS_LABELS,
  type IdBadPrintStatus,
  type IdReleaseStatus,
} from "@/lib/id-maintenance";

export function IdStatusBadge({
  status,
}: {
  status: IdReleaseStatus | IdBadPrintStatus;
}) {
  const label =
    status === "NEW_ID" || status === "SLING" || status === "REPRINT"
      ? ID_RELEASE_STATUS_LABELS[status]
      : ID_BAD_PRINT_STATUS_LABELS[status];

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        status === "NEW_ID" && "bg-emerald-100 text-emerald-800",
        status === "SLING" && "bg-amber-100 text-amber-800",
        status === "REPRINT" && "bg-rose-100 text-rose-700",
        status === "RESOLVED" && "bg-sky-100 text-sky-800",
        status === "CANCELLED" && "bg-slate-100 text-slate-500"
      )}
    >
      {label}
    </span>
  );
}

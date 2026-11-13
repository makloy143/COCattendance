import { COMPUTER_STATUS_LABELS, type ComputerStatus } from "@/lib/computers";
import { cn } from "@/lib/utils";

const TONES: Record<ComputerStatus, string> = {
  WORKING: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  UNDER_REPAIR: "bg-amber-50 text-amber-800 ring-amber-600/25",
  DEFECTIVE: "bg-rose-50 text-rose-700 ring-rose-600/20",
  RETIRED: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const COMPUTER_STATUS_BAR: Record<ComputerStatus, string> = {
  WORKING: "bg-emerald-500",
  UNDER_REPAIR: "bg-amber-400",
  DEFECTIVE: "bg-rose-500",
  RETIRED: "bg-slate-300",
};

export function ComputerStatusBadge({ status, className }: { status: ComputerStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[status],
        className
      )}
    >
      {COMPUTER_STATUS_LABELS[status]}
    </span>
  );
}

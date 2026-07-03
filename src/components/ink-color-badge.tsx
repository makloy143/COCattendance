import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  INK_COLOR_BADGE_CLASSES,
  getInkColorLabel,
  type InkColor,
} from "@/lib/inventory";

export function InkColorBadge({
  inkColor,
  model,
  itemName,
  className,
}: {
  inkColor?: InkColor | null;
  model?: string | null;
  itemName?: string;
  className?: string;
}) {
  const label = model || itemName || (inkColor ? getInkColorLabel(inkColor) : "Ink");
  const colorClass = inkColor
    ? INK_COLOR_BADGE_CLASSES[inkColor]
    : INK_COLOR_BADGE_CLASSES.OTHER;

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", colorClass, className)}
    >
      {label}
    </Badge>
  );
}

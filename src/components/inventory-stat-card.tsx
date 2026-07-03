import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InventoryStatCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  accent?: "default" | "emerald" | "amber" | "orange" | "red" | "cyan";
};

const accentClasses = {
  default: "border-l-primary",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  orange: "border-l-orange-500",
  red: "border-l-red-500",
  cyan: "border-l-cyan-500",
};

export function InventoryStatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "default",
}: InventoryStatCardProps) {
  return (
    <Card className={cn("border-l-4", accentClasses[accent])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

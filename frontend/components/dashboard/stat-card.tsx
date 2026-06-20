import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────
//  stat-card.tsx
//  A single metric card — e.g. "Total Revenue: 50,000".
//  Used across all three dashboards (admin/operator/user)
//  for a consistent look.
// ─────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  iconColor?: string;
}

export function StatCard({ label, value, icon: Icon, trend, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-emerald-600" : "text-red-600"
                )}
              >
                {trend.value}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              iconColor ?? "bg-primary/10"
            )}
          >
            <Icon className={cn("h-5 w-5", iconColor ? "" : "text-primary")} strokeWidth={1.75} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
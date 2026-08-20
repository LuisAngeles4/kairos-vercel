import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {value}
            {unit && (
              <span className="ml-1 text-base font-medium text-muted-foreground">{unit}</span>
            )}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className="rounded-lg bg-accent p-2 text-accent-foreground">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </CardContent>
    </Card>
  );
}

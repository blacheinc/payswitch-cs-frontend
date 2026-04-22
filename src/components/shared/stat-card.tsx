import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const TONE_VALUE: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  danger: "text-red-600 dark:text-red-400",
};

export function StatCard({
  label,
  value,
  icon,
  description,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("gap-2", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className={cn("text-2xl font-semibold mt-2", TONE_VALUE[tone])}>
          {value}
        </p>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </CardContent>
    </Card>
  );
}

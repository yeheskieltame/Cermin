import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "amber" | "success" | "warning" | "danger" | "info" | "ink";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-tight whitespace-nowrap",
        variant === "default" && "bg-surface-soft text-ink border border-line",
        variant === "amber" && "bg-amber-50 text-amber-700",
        variant === "success" && "bg-success/15 text-success",
        variant === "warning" && "bg-amber-50 text-amber-700",
        variant === "danger" && "bg-danger/12 text-danger",
        variant === "info" && "bg-info/12 text-info",
        variant === "ink" && "bg-shadow-900 text-cream-100",
        className
      )}
    >
      {children}
    </span>
  );
}

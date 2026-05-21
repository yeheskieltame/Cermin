import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  variant?: "white" | "soft" | "accent" | "ink";
  interactive?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({
  className,
  children,
  variant = "white",
  interactive,
  glow,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-3xl p-5 transition-all duration-300 overflow-hidden",
        variant === "white" && "bg-surface shadow-soft border border-cream-300",
        variant === "soft" && "bg-surface-soft border border-line",
        variant === "accent" && "bg-shadow-900 text-cream-100 shadow-pop",
        variant === "ink" && "bg-shadow-900 text-cream-100 shadow-pop",
        glow && "ring-1 ring-amber-200/50 shadow-soft",
        interactive &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-pop active:translate-y-0",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

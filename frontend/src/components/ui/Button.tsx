"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "soft" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: boolean;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  icon = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  className?: string;
}): string {
  return cn(
    "relative inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-200 rounded-full select-none cursor-pointer",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/50",
    variant === "primary" &&
      "bg-ink text-white hover:bg-ink-2 active:scale-[0.98] shadow-soft",
    variant === "secondary" &&
      "bg-white text-ink border border-line hover:border-amber-200 hover:bg-surface-soft active:scale-[0.98]",
    variant === "soft" &&
      "bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-[0.98]",
    variant === "ghost" && "text-ink hover:bg-surface-soft active:scale-[0.98]",
    variant === "danger" &&
      "bg-danger text-cream-50 hover:bg-danger/90 active:scale-[0.98] shadow-soft",
    icon && "rounded-full p-0",
    !icon && size === "sm" && "h-9 px-4 text-sm",
    !icon && size === "md" && "h-11 px-5 text-sm",
    !icon && size === "lg" && "h-12 px-6 text-base",
    !icon && size === "xl" && "h-14 px-7 text-base",
    icon && size === "sm" && "h-9 w-9",
    icon && size === "md" && "h-11 w-11",
    icon && size === "lg" && "h-12 w-12",
    icon && size === "xl" && "h-14 w-14",
    className,
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, icon, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={buttonClasses({ variant, size, icon, className })}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
export { Button };

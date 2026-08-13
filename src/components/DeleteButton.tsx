"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A submit button meant to sit inside a <form action={someDeleteServerAction}>.
 * Shows a native confirm() prompt before letting the form actually submit, since
 * deleting a record is permanent and cannot be undone.
 */
export function ConfirmSubmitButton({
  children,
  confirmMessage,
  variant = "danger",
  size = "md",
  className,
}: {
  children: ReactNode;
  confirmMessage: string;
  variant?: "danger" | "secondary" | "ghost";
  size?: "md" | "sm";
  className?: string;
}) {
  const variants: Record<string, string> = {
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
    ghost: "text-rose-600 hover:bg-rose-50",
  };
  const sizes: Record<string, string> = {
    md: "px-3.5 py-2 text-sm",
    sm: "px-2 py-1 text-xs",
  };
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "brand" | "warn" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-slate-900",
    brand: "text-brand",
    warn: "text-amber-600",
    danger: "text-rose-600",
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold", toneClasses[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}

const BADGE_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  TRIAL: "bg-sky-50 text-sky-700 ring-sky-600/20",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-amber-600/20",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-500/20",
  LEFT_ACADEMY: "bg-rose-50 text-rose-700 ring-rose-600/20",
  NEW: "bg-sky-50 text-sky-700 ring-sky-600/20",
  CONTACTED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  FOLLOW_UP: "bg-amber-50 text-amber-700 ring-amber-600/20",
  TRIAL_SCHEDULED: "bg-violet-50 text-violet-700 ring-violet-600/20",
  TRIAL_COMPLETED: "bg-violet-50 text-violet-700 ring-violet-600/20",
  CONVERTED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  NOT_INTERESTED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  LOST: "bg-rose-50 text-rose-700 ring-rose-600/20",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 ring-amber-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  OVERDUE: "bg-rose-50 text-rose-700 ring-rose-600/20",
  REVENUE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  EXPENSE: "bg-rose-50 text-rose-700 ring-rose-600/20",
  OPEN: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  const cls = BADGE_COLORS[value] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  const text = label ?? value.replaceAll("_", " ");
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap", cls)}>
      {text}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  type?: "button" | "submit" | "reset";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<string, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        variants[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-max text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children }: { children?: ReactNode }) {
  return <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>;
}

export function Td({ children, className, title }: { children?: ReactNode; className?: string; title?: string }) {
  return (
    <td title={title} className={cn("whitespace-nowrap border-b border-slate-100 px-4 py-3 text-slate-700", className)}>
      {children}
    </td>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  required,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, "pr-8", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, props.className)} />;
}

export function FormMessage({ message, tone = "error" }: { message?: string | null; tone?: "error" | "success" }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-sm ring-1 ring-inset",
        tone === "error" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
      )}
    >
      {message}
    </div>
  );
}

import { ShieldAlert } from "lucide-react";

export function Forbidden({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
      <ShieldAlert className="h-10 w-10 text-amber-500" />
      <p className="mt-3 text-sm font-medium text-slate-700">You do not have permission to view this page.</p>
      <p className="mt-1 text-sm text-slate-400">{message ?? "Contact your Super Admin if you believe this is a mistake."}</p>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, Input } from "@/components/ui";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Date Range" },
];

export function DateRangeFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const range = params.get("range") ?? "this_month";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  function update(next: Record<string, string>) {
    const merged = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v) merged.set(k, v);
      else merged.delete(k);
    });
    router.push(`/dashboard?${merged.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={range} onChange={(e) => update({ range: e.target.value })} className="w-auto">
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </Select>
      {range === "custom" && (
        <>
          <Input type="date" value={from} onChange={(e) => update({ range: "custom", from: e.target.value })} className="w-auto" />
          <span className="text-sm text-slate-400">to</span>
          <Input type="date" value={to} onChange={(e) => update({ range: "custom", to: e.target.value })} className="w-auto" />
        </>
      )}
    </div>
  );
}

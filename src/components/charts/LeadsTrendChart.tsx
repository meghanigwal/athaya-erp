"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function LeadsTrendChart({ data }: { data: { day: string; n: number }[] }) {
  if (data.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-slate-400">No leads in this period.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0b6e4f" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#0b6e4f" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
        <Area type="monotone" dataKey="n" name="New Leads" stroke="#0b6e4f" fill="url(#leadFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

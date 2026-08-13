import { can } from "@/lib/auth";
import { listActivityLogs } from "@/lib/activity";
import { listUsers } from "@/lib/modules/users";

const ACTIVITY_MODULES = ["Leads", "Players", "Coaches", "Centres", "Finance", "Users", "Auth", "System"];
import { PageHeader, Card, Table, Th, Td, EmptyState, Select, Input, Button, LinkButton } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { formatDateTime } from "@/lib/utils";
import type { ActivityLog } from "@/lib/types";
import { Download } from "lucide-react";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; userId?: string; from?: string; to?: string; search?: string }>;
}) {
  const allowed = await can("activity", "view");
  if (!allowed) return <Forbidden />;

  const params = await searchParams;
  const logs = listActivityLogs(
    { module: params.module, userId: params.userId, from: params.from, to: params.to, search: params.search },
    300
  ) as unknown as ActivityLog[];
  const users = listUsers();

  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));

  return (
    <div>
      <PageHeader
        title="Activity Log"
        subtitle="Complete audit trail of every important change"
        action={
          <LinkButton href={`/api/export/activity?${qs.toString()}`} variant="secondary">
            <Download className="h-4 w-4" /> Export
          </LinkButton>
        }
      />

      <Card>
        <form method="get" className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4">
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Module</label>
            <Select name="module" defaultValue={params.module ?? ""}>
              <option value="">All modules</option>
              {ACTIVITY_MODULES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">User</label>
            <Select name="userId" defaultValue={params.userId ?? ""}>
              <option value="">Everyone</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">From</label>
            <Input name="from" type="date" defaultValue={params.from ?? ""} />
          </div>
          <div className="w-36">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">To</label>
            <Input name="to" type="date" defaultValue={params.to ?? ""} />
          </div>
          <div className="min-w-48 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Search</label>
            <Input name="search" defaultValue={params.search ?? ""} placeholder="Record, user, action..." />
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>

        {logs.length === 0 ? (
          <EmptyState title="No activity found" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Action</Th>
                <Th>Module</Th>
                <Th>Record</Th>
                <Th>Previous Value</Th>
                <Th>New Value</Th>
                <Th>Date</Th>
                <Th>Time</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((a) => {
                const dt = formatDateTime(a.created_at);
                const [date, time] = dt.split(", ").length > 1 ? [dt.split(",")[0], dt.split(",").slice(1).join(",").trim()] : [dt, ""];
                return (
                  <tr key={a.id}>
                    <Td className="font-medium text-slate-800">{a.user_name ?? "System"}</Td>
                    <Td>{a.action}</Td>
                    <Td>{a.module}</Td>
                    <Td>{a.record_label ?? "-"}</Td>
                    <Td className="max-w-56 truncate" title={a.previous_value ?? ""}>
                      {a.previous_value ?? "-"}
                    </Td>
                    <Td className="max-w-56 truncate" title={a.new_value ?? ""}>
                      {a.new_value ?? "-"}
                    </Td>
                    <Td>{date}</Td>
                    <Td>{time}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

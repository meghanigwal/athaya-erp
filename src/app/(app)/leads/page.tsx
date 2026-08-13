import Link from "next/link";
import { can } from "@/lib/auth";
import { listLeads, leadStats } from "@/lib/modules/leads";
import { listCentres } from "@/lib/modules/centres";
import { listUsers } from "@/lib/modules/users";
import { LEAD_STATUSES } from "@/lib/types";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState, StatCard, Select, Input, Button } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Download } from "lucide-react";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; centreId?: string; assignedUserId?: string; search?: string }>;
}) {
  const allowed = await can("leads", "view");
  if (!allowed) return <Forbidden />;

  const params = await searchParams;
  const leads = listLeads({
    status: params.status,
    centreId: params.centreId,
    assignedUserId: params.assignedUserId,
    search: params.search,
  });
  const stats = leadStats();
  const centres = listCentres();
  const users = listUsers();
  const canAdd = await can("leads", "add");
  const canExport = await can("leads", "export");

  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));

  return (
    <div>
      <PageHeader
        title="Leads & Sales"
        subtitle="Track every enquiry from first contact to conversion"
        action={
          <>
            {canExport && (
              <LinkButton href={`/api/export/leads?${qs.toString()}`} variant="secondary">
                <Download className="h-4 w-4" /> Export
              </LinkButton>
            )}
            {canAdd && (
              <LinkButton href="/leads/new">
                <Plus className="h-4 w-4" /> Add Lead
              </LinkButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Leads" value={stats.total} />
        <StatCard label="Converted" value={stats.converted} tone="brand" />
        <StatCard label="Lost" value={stats.lost} tone="danger" />
        <StatCard label="Pending Follow-ups" value={stats.pendingFollowUp} tone="warn" />
      </div>

      <Card className="mt-5">
        <form method="get" className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4">
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
            <Select name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Centre</label>
            <Select name="centreId" defaultValue={params.centreId ?? ""}>
              <option value="">All centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Assigned Employee</label>
            <Select name="assignedUserId" defaultValue={params.assignedUserId ?? ""}>
              <option value="">Everyone</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-48 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Search</label>
            <Input name="search" defaultValue={params.search ?? ""} placeholder="Name, phone, lead ID..." />
          </div>
          <Button type="submit" variant="secondary">
            Apply Filters
          </Button>
        </form>

        {leads.length === 0 ? (
          <EmptyState title="No leads found" subtitle="Try adjusting your filters or add a new lead." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lead ID</Th>
                <Th>Child</Th>
                <Th>Parent</Th>
                <Th>Phone</Th>
                <Th>Centre</Th>
                <Th>Source</Th>
                <Th>Assigned</Th>
                <Th>Status</Th>
                <Th>Follow-up</Th>
                <Th>Expected Fee</Th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/leads/${l.id}`} className="font-medium text-brand hover:underline">
                      {l.code}
                    </Link>
                  </Td>
                  <Td className="font-medium text-slate-800">{l.child_name}</Td>
                  <Td>{l.parent_name ?? "-"}</Td>
                  <Td>{l.phone ?? "-"}</Td>
                  <Td>{l.centre_name ?? "-"}</Td>
                  <Td>{l.source ?? "-"}</Td>
                  <Td>{l.assigned_user_name ?? "Unassigned"}</Td>
                  <Td>
                    <Badge value={l.status} />
                  </Td>
                  <Td>{formatDate(l.follow_up_date)}</Td>
                  <Td>{l.expected_fee ? formatCurrency(l.expected_fee) : "-"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

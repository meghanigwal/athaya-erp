import { can } from "@/lib/auth";
import { REPORT_TYPES, runReport, type ReportKey } from "@/lib/modules/reports";
import { listCentres } from "@/lib/modules/centres";
import { listCoaches } from "@/lib/modules/coaches";
import { PLAYER_STATUSES, LEAD_STATUSES } from "@/lib/types";
import { PageHeader, LinkButton, Card, Table, Th, Td, EmptyState, Select, Input, Button } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { Download } from "lucide-react";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string; to?: string; centreId?: string; coachId?: string; status?: string; search?: string }>;
}) {
  const allowed = await can("reports", "view");
  if (!allowed) return <Forbidden />;

  const params = await searchParams;
  const type = (params.type as ReportKey) || "players";
  const filters = {
    from: params.from,
    to: params.to,
    centreId: params.centreId,
    coachId: params.coachId,
    status: params.status,
    search: params.search,
  };
  const result = runReport(type, filters);
  const centres = listCentres();
  const coaches = listCoaches();
  const canExport = await can("reports", "export");

  const qs = new URLSearchParams();
  qs.set("type", type);
  Object.entries(filters).forEach(([k, v]) => v && qs.set(k, v));

  const showStatusFilter = type === "players" || type === "leads";
  const statusOptions = type === "players" ? PLAYER_STATUSES : LEAD_STATUSES;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Business reports without manual Excel work"
        action={
          canExport && (
            <>
              <LinkButton href={`/api/export/reports/${type}?${qs.toString()}&format=csv`} variant="secondary">
                <Download className="h-4 w-4" /> CSV
              </LinkButton>
              <LinkButton href={`/api/export/reports/${type}?${qs.toString()}&format=xlsx`}>
                <Download className="h-4 w-4" /> Excel
              </LinkButton>
            </>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {REPORT_TYPES.map((r) => (
          <a
            key={r.key}
            href={`/reports?type=${r.key}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              type === r.key ? "bg-brand text-white" : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {r.label}
          </a>
        ))}
      </div>

      <Card>
        <form method="get" className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4">
          <input type="hidden" name="type" value={type} />
          <div className="w-36">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">From</label>
            <Input name="from" type="date" defaultValue={params.from ?? ""} />
          </div>
          <div className="w-36">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">To</label>
            <Input name="to" type="date" defaultValue={params.to ?? ""} />
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
          {type === "players" && (
            <div className="w-44">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Coach</label>
              <Select name="coachId" defaultValue={params.coachId ?? ""}>
                <option value="">All coaches</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {showStatusFilter && (
            <div className="w-44">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
              <Select name="status" defaultValue={params.status ?? ""}>
                <option value="">All statuses</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="min-w-48 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Search</label>
            <Input name="search" defaultValue={params.search ?? ""} />
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>

        {result.rows.length === 0 ? (
          <EmptyState title="No data for this report" subtitle="Try adjusting your filters." />
        ) : (
          <Table>
            <thead>
              <tr>
                {result.headers.map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {row.map((cell, cIdx) => (
                    <Td key={cIdx}>{cell === null || cell === undefined || cell === "" ? "-" : String(cell)}</Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

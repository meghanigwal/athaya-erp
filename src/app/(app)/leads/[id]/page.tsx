import { notFound } from "next/navigation";
import { can } from "@/lib/auth";
import { getLead } from "@/lib/modules/leads";
import { Badge, Card, CardHeader, LinkButton, Select, Button } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { LEAD_STATUSES } from "@/lib/types";
import { quickStatusAction, convertLeadAction } from "../actions";
import { Pencil } from "lucide-react";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const allowed = await can("leads", "view");
  if (!allowed) return <Forbidden />;

  const { id } = await params;
  const lead = getLead(id);
  if (!lead) notFound();

  const canEdit = await can("leads", "edit");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{lead.code}</p>
          <h1 className="text-xl font-semibold text-slate-900">{lead.child_name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge value={lead.status} />
            {lead.conversion_status === "CONVERTED" && <span className="text-xs text-emerald-600">Converted to player</span>}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <LinkButton href={`/leads/${lead.id}/edit`} variant="secondary">
              <Pencil className="h-4 w-4" /> Edit
            </LinkButton>
            {lead.conversion_status !== "CONVERTED" && (
              <form action={convertLeadAction}>
                <input type="hidden" name="id" value={lead.id} />
                <Button type="submit">Convert to Player</Button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Lead Details" />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
            <Detail label="Parent / Guardian" value={lead.parent_name} />
            <Detail label="Child Age" value={lead.child_age} />
            <Detail label="Phone" value={lead.phone} />
            <Detail label="WhatsApp" value={lead.whatsapp} />
            <Detail label="Email" value={lead.email} />
            <Detail label="Location / Society" value={lead.location} />
            <Detail label="City" value={lead.city} />
            <Detail label="Source" value={lead.source} />
            <Detail label="Interested Programme" value={lead.programme} />
            <Detail label="Interested Centre" value={lead.centre_name} />
            <Detail label="Lead Date" value={formatDate(lead.lead_date)} />
            <Detail label="Assigned Employee" value={lead.assigned_user_name ?? "Unassigned"} />
            <Detail label="Follow-up Date" value={formatDate(lead.follow_up_date)} />
            <Detail label="Expected Fee" value={lead.expected_fee ? formatCurrency(lead.expected_fee) : "-"} />
          </dl>
          {lead.notes && (
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{lead.notes}</p>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          {canEdit && (
            <Card>
              <CardHeader title="Update Status" subtitle="Move this lead through the pipeline" />
              <form action={quickStatusAction} className="space-y-3 px-5 py-4">
                <input type="hidden" name="id" value={lead.id} />
                <Select name="status" defaultValue={lead.status}>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
                <Button type="submit" className="w-full">
                  Update Status
                </Button>
              </form>
            </Card>
          )}
          <Card>
            <CardHeader title="Record Timeline" />
            <dl className="space-y-3 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Created</dt>
                <dd className="text-slate-700">{formatDateTime(lead.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Last Updated</dt>
                <dd className="text-slate-700">{formatDateTime(lead.updated_at)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-700">{value || "-"}</dd>
    </div>
  );
}

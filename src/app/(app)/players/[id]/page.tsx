import { notFound } from "next/navigation";
import { can, canDeleteRecords } from "@/lib/auth";
import { getPlayer, listPaymentsForPlayer, totalPaidForPlayer } from "@/lib/modules/players";
import { listActivityLogs } from "@/lib/activity";
import { Badge, Card, CardHeader, LinkButton, Table, Th, Td, EmptyState } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/DeleteButton";
import { Forbidden } from "@/components/Forbidden";
import { formatCurrency, formatDate, formatDateTime, calcAge } from "@/lib/utils";
import { RecordPaymentForm } from "../RecordPaymentForm";
import { deletePlayerAction } from "../actions";
import { Pencil, Trash2 } from "lucide-react";
import type { ActivityLog } from "@/lib/types";

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const allowed = await can("players", "view");
  if (!allowed) return <Forbidden />;

  const { id } = await params;
  const player = getPlayer(id);
  if (!player) notFound();

  const canEdit = await can("players", "edit");
  const canDelete = await canDeleteRecords();
  const payments = listPaymentsForPlayer(id);
  const totalPaid = totalPaidForPlayer(id);
  const history = listActivityLogs({}, 1000).filter(
    (a) => (a as unknown as ActivityLog).record_id === id
  ) as unknown as ActivityLog[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{player.code}</p>
          <h1 className="text-xl font-semibold text-slate-900">{player.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge value={player.status} />
            <Badge value={player.payment_status} />
          </div>
        </div>
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-2">
            {canEdit && (
              <LinkButton href={`/players/${player.id}/edit`} variant="secondary">
                <Pencil className="h-4 w-4" /> Edit
              </LinkButton>
            )}
            {canDelete && (
              <form action={deletePlayerAction}>
                <input type="hidden" name="id" value={player.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Permanently delete the player "${player.name}"? Their entire payment history will be deleted too. This cannot be undone.`}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Player Information" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
              <Detail label="Date of Birth" value={formatDate(player.dob)} />
              <Detail label="Age" value={calcAge(player.dob)} />
              <Detail label="Gender" value={player.gender} />
              <Detail label="Programme" value={player.programme} />
              <Detail label="Joining Date" value={formatDate(player.joining_date)} />
              <Detail label="Registration Date" value={formatDate(player.registration_date)} />
              <Detail label="Emergency Contact" value={player.emergency_contact} />
              <Detail label="Address" value={player.address} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Parent Information" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
              <Detail label="Parent / Guardian" value={player.parent_name} />
              <Detail label="Father / Mother" value={player.father_mother_name} />
              <Detail label="Phone" value={player.phone} />
              <Detail label="WhatsApp" value={player.whatsapp} />
              <Detail label="Email" value={player.email} />
              <Detail label="Society / Location" value={player.society} />
              <Detail label="City" value={player.city} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Training Centre" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
              <Detail label="Centre" value={player.centre_name} />
              <Detail label="Batch" value={player.batch_name} />
              <Detail label="Age Group" value={player.age_group} />
              <Detail label="Coach" value={player.coach_name} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Payment History" subtitle={`Total collected: ${formatCurrency(totalPaid)}`} />
            {payments.length === 0 ? (
              <EmptyState title="No payments recorded yet" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Payment ID</Th>
                    <Th>Amount</Th>
                    <Th>For Month</Th>
                    <Th>Payment Date</Th>
                    <Th>Method</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <Td>{p.code}</Td>
                      <Td className="font-medium text-slate-800">{formatCurrency(p.amount)}</Td>
                      <Td>{p.for_month ?? "-"}</Td>
                      <Td>{formatDate(p.payment_date)}</Td>
                      <Td>{p.payment_method.replaceAll("_", " ")}</Td>
                      <Td>
                        <Badge value={p.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="Activity / Change History" />
            {history.length === 0 ? (
              <EmptyState title="No changes recorded yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {history.map((a) => (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <p className="text-slate-700">
                      <span className="font-medium">{a.user_name ?? "System"}</span> — {a.description ?? a.action}
                    </p>
                    <p className="text-xs text-slate-400">{formatDateTime(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Fee Details" />
            <dl className="space-y-3 px-5 py-4 text-sm">
              <Row label="Monthly Fee" value={formatCurrency(player.monthly_fee)} />
              <Row label="Registration Fee" value={formatCurrency(player.registration_fee)} />
              <Row label="Total Paid" value={formatCurrency(totalPaid)} />
              <Row label="Amount Pending" value={formatCurrency(Math.max(player.monthly_fee - totalPaid, 0))} />
              <Row label="Payment Status" value={<Badge value={player.payment_status} />} />
            </dl>
          </Card>

          {canEdit && player.status !== "LEFT_ACADEMY" && (
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Record a Payment</h3>
              <RecordPaymentForm playerId={player.id} monthlyFee={player.monthly_fee} />
            </Card>
          )}

          {player.notes && (
            <Card>
              <CardHeader title="Notes" />
              <p className="whitespace-pre-line px-5 py-4 text-sm text-slate-700">{player.notes}</p>
            </Card>
          )}
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

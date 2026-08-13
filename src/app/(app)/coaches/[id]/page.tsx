import Link from "next/link";
import { notFound } from "next/navigation";
import { can, canDeleteRecords } from "@/lib/auth";
import { getCoach, coachStats } from "@/lib/modules/coaches";
import { getCentre, listBatches } from "@/lib/modules/centres";
import { listPlayers } from "@/lib/modules/players";
import { Badge, Card, CardHeader, LinkButton, Table, Th, Td, EmptyState } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/DeleteButton";
import { Forbidden } from "@/components/Forbidden";
import { formatDate } from "@/lib/utils";
import { deleteCoachAction } from "../actions";
import { Pencil, Trash2 } from "lucide-react";

export default async function CoachProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const allowed = await can("coaches", "view");
  if (!allowed) return <Forbidden />;

  const { id } = await params;
  const coach = getCoach(id);
  if (!coach) notFound();

  const canEdit = await can("coaches", "edit");
  const canDelete = await canDeleteRecords();
  const centre = coach.centre_id ? getCentre(coach.centre_id) : undefined;
  const batches = listBatches().filter((b) => b.coach_id === id);
  const players = listPlayers({ coachId: id });
  const stats = coachStats(id);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{coach.code}</p>
          <h1 className="text-xl font-semibold text-slate-900">{coach.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge value={coach.employment_status} />
            {coach.role && <span className="text-xs text-slate-500">{coach.role}</span>}
          </div>
        </div>
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-2">
            {canEdit && (
              <LinkButton href={`/coaches/${coach.id}/edit`} variant="secondary">
                <Pencil className="h-4 w-4" /> Edit
              </LinkButton>
            )}
            {canDelete && (
              <form action={deleteCoachAction}>
                <input type="hidden" name="id" value={coach.id} />
                <ConfirmSubmitButton confirmMessage={`Permanently delete the coach "${coach.name}"? This cannot be undone.`}>
                  <Trash2 className="h-4 w-4" /> Delete
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Coach Information" />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
            <Detail label="Phone" value={coach.phone} />
            <Detail label="Email" value={coach.email} />
            <Detail label="Qualification" value={coach.qualification} />
            <Detail label="Experience" value={coach.experience} />
            <Detail label="Joining Date" value={formatDate(coach.joining_date)} />
            <Detail label="Assigned Centre" value={centre?.name} />
            <Detail label="Salary / Payment Info" value={coach.salary_info} />
          </dl>
          {coach.notes && (
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{coach.notes}</p>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Summary" />
            <dl className="space-y-3 px-5 py-4 text-sm">
              <Row label="Active Players" value={stats.activePlayers} />
              <Row label="Batches Assigned" value={stats.batches} />
            </dl>
          </Card>
          <Card>
            <CardHeader title="Assigned Batches" />
            {batches.length === 0 ? (
              <EmptyState title="No batches assigned" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <li key={b.id} className="px-5 py-3 text-sm">
                    <p className="font-medium text-slate-700">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.schedule ?? "-"}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader title="Assigned Players" subtitle={`${players.length} player(s)`} />
        {players.length === 0 ? (
          <EmptyState title="No players assigned to this coach yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Player ID</Th>
                <Th>Name</Th>
                <Th>Batch</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <Link href={`/players/${p.id}`} className="font-medium text-brand hover:underline">
                      {p.code}
                    </Link>
                  </Td>
                  <Td className="font-medium text-slate-800">{p.name}</Td>
                  <Td>{p.batch_name ?? "-"}</Td>
                  <Td>
                    <Badge value={p.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
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

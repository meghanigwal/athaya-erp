import Link from "next/link";
import { can, canDeleteRecords } from "@/lib/auth";
import { listCentres, listBatches, centreStats } from "@/lib/modules/centres";
import { listCoaches } from "@/lib/modules/coaches";
import { PageHeader, LinkButton, Card, CardHeader, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/DeleteButton";
import { Forbidden } from "@/components/Forbidden";
import { deleteCentreAction, deleteBatchAction } from "./actions";
import { Plus } from "lucide-react";

export default async function CentresPage() {
  const allowed = await can("centres", "view");
  if (!allowed) return <Forbidden />;

  const centres = listCentres();
  const stats = centreStats() as { id: string; name: string; active_players: number; batch_count: number; coach_count: number }[];
  const statsMap = new Map(stats.map((s) => [s.id, s]));
  const batches = listBatches();
  const coaches = listCoaches();
  const coachMap = new Map(coaches.map((c) => [c.id, c.name]));
  const centreMap = new Map(centres.map((c) => [c.id, c.name]));
  const canAdd = await can("centres", "add");
  const canDelete = await canDeleteRecords();

  return (
    <div>
      <PageHeader
        title="Centres & Batches"
        subtitle="Centre → Batch → Coach → Players"
        action={
          canAdd && (
            <>
              <LinkButton href="/centres/new" variant="secondary">
                <Plus className="h-4 w-4" /> Add Centre
              </LinkButton>
              <LinkButton href="/centres/batches/new">
                <Plus className="h-4 w-4" /> Add Batch
              </LinkButton>
            </>
          )
        }
      />

      <Card>
        <CardHeader title="Centres" />
        {centres.length === 0 ? (
          <EmptyState title="No centres yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Centre ID</Th>
                <Th>Name</Th>
                <Th>City</Th>
                <Th>Active Players</Th>
                <Th>Batches</Th>
                <Th>Coaches</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {centres.map((c) => {
                const s = statsMap.get(c.id);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <Td>{c.code}</Td>
                    <Td className="font-medium text-slate-800">{c.name}</Td>
                    <Td>{c.city ?? "-"}</Td>
                    <Td>{s?.active_players ?? 0}</Td>
                    <Td>{s?.batch_count ?? 0}</Td>
                    <Td>{s?.coach_count ?? 0}</Td>
                    <Td>
                      <Badge value={c.status} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Link href={`/centres/${c.id}/edit`} className="text-xs font-medium text-brand hover:underline">
                          Edit
                        </Link>
                        {canDelete && (
                          <form action={deleteCentreAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <ConfirmSubmitButton
                              variant="ghost"
                              size="sm"
                              className="px-0 py-0"
                              confirmMessage={`Permanently delete the centre "${c.name}"? Players, coaches and batches linked to it will be unassigned, not deleted. This cannot be undone.`}
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-5">
        <CardHeader title="Batches" />
        {batches.length === 0 ? (
          <EmptyState title="No batches yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Batch ID</Th>
                <Th>Name</Th>
                <Th>Centre</Th>
                <Th>Coach</Th>
                <Th>Schedule</Th>
                <Th>Age Group</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <Td>{b.code}</Td>
                  <Td className="font-medium text-slate-800">{b.name}</Td>
                  <Td>{b.centre_id ? centreMap.get(b.centre_id) : "-"}</Td>
                  <Td>{b.coach_id ? coachMap.get(b.coach_id) : "-"}</Td>
                  <Td>{b.schedule ?? "-"}</Td>
                  <Td>{b.age_group ?? "-"}</Td>
                  <Td>
                    <Badge value={b.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Link href={`/centres/batches/${b.id}/edit`} className="text-xs font-medium text-brand hover:underline">
                        Edit
                      </Link>
                      {canDelete && (
                        <form action={deleteBatchAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <ConfirmSubmitButton
                            variant="ghost"
                            size="sm"
                            className="px-0 py-0"
                            confirmMessage={`Permanently delete the batch "${b.name}"? This cannot be undone.`}
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </div>
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

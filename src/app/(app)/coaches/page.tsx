import Link from "next/link";
import { can } from "@/lib/auth";
import { listCoaches, coachSummary, coachStats } from "@/lib/modules/coaches";
import { listCentres } from "@/lib/modules/centres";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState, StatCard } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { Plus } from "lucide-react";

export default async function CoachesPage() {
  const allowed = await can("coaches", "view");
  if (!allowed) return <Forbidden />;

  const coaches = listCoaches();
  const summary = coachSummary();
  const canAdd = await can("coaches", "add");
  const centres = listCentres();
  const centreLabel = (id: string | null) => centres.find((c) => c.id === id)?.name ?? "-";

  return (
    <div>
      <PageHeader
        title="Coaches & Staff"
        subtitle="Manage coaches and support staff"
        action={
          canAdd && (
            <LinkButton href="/coaches/new">
              <Plus className="h-4 w-4" /> Add Coach
            </LinkButton>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Coaches" value={summary.total} />
        <StatCard label="Active Coaches" value={summary.active} tone="brand" />
        <StatCard label="Centres Covered" value={new Set(coaches.map((c) => c.centre_id).filter(Boolean)).size} />
      </div>

      <Card className="mt-5">
        {coaches.length === 0 ? (
          <EmptyState title="No coaches yet" subtitle="Add your first coach to get started." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Coach ID</Th>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Phone</Th>
                <Th>Centre</Th>
                <Th>Active Players</Th>
                <Th>Batches</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((c) => {
                const stats = coachStats(c.id);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <Td>
                      <Link href={`/coaches/${c.id}`} className="font-medium text-brand hover:underline">
                        {c.code}
                      </Link>
                    </Td>
                    <Td className="font-medium text-slate-800">{c.name}</Td>
                    <Td>{c.role ?? "-"}</Td>
                    <Td>{c.phone ?? "-"}</Td>
                    <Td>{centreLabel(c.centre_id)}</Td>
                    <Td>{stats.activePlayers}</Td>
                    <Td>{stats.batches}</Td>
                    <Td>
                      <Badge value={c.employment_status} />
                    </Td>
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

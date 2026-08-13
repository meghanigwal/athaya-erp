import Link from "next/link";
import { can } from "@/lib/auth";
import { listPlayers, playerStats } from "@/lib/modules/players";
import { listCentres } from "@/lib/modules/centres";
import { PLAYER_STATUSES, PAYMENT_STATUSES } from "@/lib/types";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState, StatCard, Select, Input, Button } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { formatCurrency } from "@/lib/utils";
import { Plus, Download } from "lucide-react";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; centreId?: string; paymentStatus?: string; search?: string }>;
}) {
  const allowed = await can("players", "view");
  if (!allowed) return <Forbidden />;

  const params = await searchParams;
  const players = listPlayers({
    status: params.status,
    centreId: params.centreId,
    paymentStatus: params.paymentStatus,
    search: params.search,
  });
  const stats = playerStats();
  const centres = listCentres();
  const canAdd = await can("players", "add");
  const canExport = await can("players", "export");

  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));

  return (
    <div>
      <PageHeader
        title="Players"
        subtitle="Central database of every registered player"
        action={
          <>
            {canExport && (
              <LinkButton href={`/api/export/players?${qs.toString()}`} variant="secondary">
                <Download className="h-4 w-4" /> Export
              </LinkButton>
            )}
            {canAdd && (
              <LinkButton href="/players/new">
                <Plus className="h-4 w-4" /> Add Player
              </LinkButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Active Players" value={stats.active} tone="brand" />
        <StatCard label="Total Players" value={stats.total} />
        <StatCard label="Pending Fee Amount" value={formatCurrency(stats.pendingAmount)} tone="warn" />
      </div>

      <Card className="mt-5">
        <form method="get" className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4">
          <div className="w-40">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
            <Select name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option>
              {PLAYER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-40">
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
          <div className="w-40">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Payment Status</label>
            <Select name="paymentStatus" defaultValue={params.paymentStatus ?? ""}>
              <option value="">All</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-48 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Search</label>
            <Input name="search" defaultValue={params.search ?? ""} placeholder="Name, phone, society, player ID..." />
          </div>
          <Button type="submit" variant="secondary">
            Apply Filters
          </Button>
        </form>

        {players.length === 0 ? (
          <EmptyState title="No players found" subtitle="Try adjusting your filters or register a new player." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Player ID</Th>
                <Th>Name</Th>
                <Th>Parent</Th>
                <Th>Phone</Th>
                <Th>Centre</Th>
                <Th>Batch</Th>
                <Th>Coach</Th>
                <Th>Monthly Fee</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/players/${p.id}`} className="font-medium text-brand hover:underline">
                      {p.code}
                    </Link>
                  </Td>
                  <Td className="font-medium text-slate-800">{p.name}</Td>
                  <Td>{p.parent_name ?? "-"}</Td>
                  <Td>{p.phone ?? "-"}</Td>
                  <Td>{p.centre_name ?? "-"}</Td>
                  <Td>{p.batch_name ?? "-"}</Td>
                  <Td>{p.coach_name ?? "-"}</Td>
                  <Td>{formatCurrency(p.monthly_fee)}</Td>
                  <Td>
                    <Badge value={p.payment_status} />
                  </Td>
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

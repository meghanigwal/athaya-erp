import Link from "next/link";
import { getCurrentUser, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listPlayers } from "@/lib/modules/players";
import { listLeads } from "@/lib/modules/leads";
import { listCoaches } from "@/lib/modules/coaches";
import { listCentres } from "@/lib/modules/centres";
import { PageHeader, Card, CardHeader, EmptyState, Badge } from "@/components/ui";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const permissions = getPermissions(user.id, user.role);

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const players = query && permissions.players?.can_view ? listPlayers({ search: query }).slice(0, 20) : [];
  const leads = query && permissions.leads?.can_view ? listLeads({ search: query }).slice(0, 20) : [];
  const coaches = query && permissions.coaches?.can_view ? listCoaches().filter((c) => matches(c.name, query) || matches(c.phone, query)).slice(0, 20) : [];
  const centres = query && permissions.centres?.can_view ? listCentres().filter((c) => matches(c.name, query) || matches(c.city, query)).slice(0, 20) : [];

  const totalResults = players.length + leads.length + coaches.length + centres.length;

  return (
    <div>
      <PageHeader title="Search Results" subtitle={query ? `Showing results for "${query}"` : "Enter a search term above"} />

      {!query || totalResults === 0 ? (
        <Card>
          <EmptyState title={query ? "No matching records found" : "Start typing in the search bar"} />
        </Card>
      ) : (
        <div className="space-y-5">
          {players.length > 0 && (
            <Card>
              <CardHeader title="Players" subtitle={`${players.length} match(es)`} />
              <ul className="divide-y divide-slate-100">
                {players.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/players/${p.id}`} className="font-medium text-brand hover:underline">
                      {p.name} <span className="text-slate-400">({p.code})</span>
                    </Link>
                    <Badge value={p.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {leads.length > 0 && (
            <Card>
              <CardHeader title="Leads" subtitle={`${leads.length} match(es)`} />
              <ul className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/leads/${l.id}`} className="font-medium text-brand hover:underline">
                      {l.child_name} <span className="text-slate-400">({l.code})</span>
                    </Link>
                    <Badge value={l.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {coaches.length > 0 && (
            <Card>
              <CardHeader title="Coaches" subtitle={`${coaches.length} match(es)`} />
              <ul className="divide-y divide-slate-100">
                {coaches.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/coaches/${c.id}`} className="font-medium text-brand hover:underline">
                      {c.name} <span className="text-slate-400">({c.code})</span>
                    </Link>
                    <Badge value={c.employment_status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {centres.length > 0 && (
            <Card>
              <CardHeader title="Centres" subtitle={`${centres.length} match(es)`} />
              <ul className="divide-y divide-slate-100">
                {centres.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href="/centres" className="font-medium text-brand hover:underline">
                      {c.name} <span className="text-slate-400">({c.code})</span>
                    </Link>
                    <Badge value={c.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function matches(value: string | null | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query.toLowerCase());
}

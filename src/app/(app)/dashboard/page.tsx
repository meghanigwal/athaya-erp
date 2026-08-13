import Link from "next/link";
import { PageHeader, StatCard, Card, CardHeader, Badge, Table, Th, Td, EmptyState } from "@/components/ui";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { LeadsTrendChart } from "@/components/charts/LeadsTrendChart";
import { PlayerRegistrationsChart } from "@/components/charts/PlayerRegistrationsChart";
import {
  dashboardKpis,
  leadPipeline,
  leadsTrend,
  playerRegistrationsTrend,
  recentActivity,
  resolveRange,
  revenueTrend,
  upcomingActions,
} from "@/lib/modules/dashboard";
import { pendingPayments } from "@/lib/modules/players";
import { formatCurrency, formatDate, formatDateTime, humanize } from "@/lib/utils";
import type { ActivityLog } from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = resolveRange(params.range, params.from, params.to);

  const kpis = dashboardKpis(range);
  const revenue = revenueTrend(6).map((r) => ({ ...r }));
  const leads = leadsTrend(30).map((r) => ({ ...r }));
  const registrations = playerRegistrationsTrend(6).map((r) => ({ ...r }));
  const pipeline = leadPipeline();
  const pending = pendingPayments(6);
  const activity = recentActivity(8) as unknown as ActivityLog[];
  const actions = upcomingActions(6);

  const pipelineMap = new Map(pipeline.map((p) => [p.status, p.n]));
  const pipelineOrder = ["NEW", "CONTACTED", "FOLLOW_UP", "TRIAL_SCHEDULED", "TRIAL_COMPLETED", "CONVERTED", "LOST"];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Business overview at a glance" action={<DateRangeFilter />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Active Players" value={kpis.totalActivePlayers} tone="brand" />
        <StatCard label="New Players" value={kpis.newPlayersThisRange} hint="Selected period" />
        <StatCard label="Total Leads" value={kpis.totalLeads} />
        <StatCard label="New Leads" value={kpis.newLeadsThisRange} hint="Selected period" />
        <StatCard label="Converted Leads" value={kpis.convertedLeads} />
        <StatCard label="Conversion Rate" value={`${kpis.conversionRate}%`} tone="brand" />
        <StatCard label="Revenue" value={formatCurrency(kpis.monthlyRevenue)} hint="Selected period" tone="brand" />
        <StatCard label="Pending Payments" value={formatCurrency(kpis.pendingPaymentsAmount)} tone="warn" />
        <StatCard label="Total Coaches" value={kpis.totalCoaches} />
        <StatCard label="Active Centres" value={kpis.activeCentres} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue Overview" subtitle="Revenue vs. expenses, last 6 months" />
          <div className="px-3 pb-3 pt-1">
            <RevenueChart data={revenue} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Lead Conversion" subtitle="Pipeline snapshot" />
          <div className="space-y-2.5 px-5 py-4">
            {pipelineOrder.map((status) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <Badge value={status} />
                <span className="font-medium text-slate-700">{pipelineMap.get(status) ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="New Leads" subtitle="Last 30 days" />
          <div className="px-3 pb-3 pt-1">
            <LeadsTrendChart data={leads} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Player Registrations" subtitle="Last 6 months" />
          <div className="px-3 pb-3 pt-1">
            <PlayerRegistrationsChart data={registrations} />
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Pending Payments" subtitle="Players with outstanding fees" action={<Link href="/finance" className="text-xs font-medium text-brand hover:underline">View all</Link>} />
          {pending.length === 0 ? (
            <EmptyState title="No pending payments" subtitle="All active players are up to date." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Player</Th>
                  <Th>Centre</Th>
                  <Th>Monthly Fee</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id}>
                    <Td>
                      <Link href={`/players/${p.id}`} className="font-medium text-slate-800 hover:text-brand">
                        {p.name}
                      </Link>
                    </Td>
                    <Td>{p.centre_name ?? "-"}</Td>
                    <Td>{formatCurrency(p.monthly_fee)}</Td>
                    <Td>
                      <Badge value={p.payment_status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Upcoming Actions" subtitle="Follow-ups due soon" />
          {actions.length === 0 ? (
            <EmptyState title="Nothing due" subtitle="No upcoming follow-ups." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {actions.map((a, idx) => (
                <li key={idx} className="px-5 py-3 text-sm">
                  <Link href={`/leads/${a.id}`} className="font-medium text-slate-700 hover:text-brand">
                    {a.label}
                  </Link>
                  <p className="text-xs text-slate-400">Due {formatDate(a.due_date)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest changes across the system" action={<Link href="/activity" className="text-xs font-medium text-brand hover:underline">View log</Link>} />
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
                  <div>
                    <p className="text-slate-700">
                      <span className="font-medium">{a.user_name ?? "System"}</span> {humanize(a.action).toLowerCase()}
                      {a.record_label ? <> — {a.record_label}</> : null}
                    </p>
                    {a.description && <p className="text-xs text-slate-400">{a.description}</p>}
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

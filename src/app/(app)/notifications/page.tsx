import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { overdueFollowUps } from "@/lib/modules/leads";
import { pendingPayments } from "@/lib/modules/players";
import { PageHeader, Card, CardHeader, EmptyState, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const followUps = overdueFollowUps(50);
  const payments = pendingPayments(50);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Things that need your attention" />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Overdue Lead Follow-ups" subtitle={`${followUps.length} lead(s) need a follow-up`} />
          {followUps.length === 0 ? (
            <EmptyState title="No overdue follow-ups" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {followUps.map((l) => (
                <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <Link href={`/leads/${l.id}`} className="font-medium text-brand hover:underline">
                    {l.child_name} <span className="text-slate-400">({l.code})</span>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Follow-up was due {formatDate(l.follow_up_date)}</span>
                    <Badge value={l.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Pending Player Payments" subtitle={`${payments.length} player(s) with outstanding fees`} />
          {payments.length === 0 ? (
            <EmptyState title="No pending payments" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <Link href={`/players/${p.id}`} className="font-medium text-brand hover:underline">
                    {p.name} <span className="text-slate-400">({p.code})</span>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{formatCurrency(p.monthly_fee)}</span>
                    <Badge value={p.payment_status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

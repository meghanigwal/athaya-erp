import { can } from "@/lib/auth";
import { listTransactions, financialSummary } from "@/lib/modules/finance";
import { listCentres } from "@/lib/modules/centres";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, REVENUE_CATEGORIES } from "@/lib/types";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState, StatCard, Select, Input, Button } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { formatCurrency, formatDate, startOfMonthIso, endOfMonthIso } from "@/lib/utils";
import { Plus, Download } from "lucide-react";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; centreId?: string; paymentMethod?: string; from?: string; to?: string }>;
}) {
  const allowed = await can("finance", "view");
  if (!allowed) return <Forbidden />;

  const params = await searchParams;
  const transactions = listTransactions({
    type: params.type as "REVENUE" | "EXPENSE" | undefined,
    category: params.category,
    centreId: params.centreId,
    paymentMethod: params.paymentMethod,
    from: params.from,
    to: params.to,
  });
  const summary = financialSummary(startOfMonthIso(), endOfMonthIso());
  const centres = listCentres();
  const canAdd = await can("finance", "add");
  const canExport = await can("finance", "export");

  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));

  const categories = [...REVENUE_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    <div>
      <PageHeader
        title="Finance & Accounts"
        subtitle="Track revenue, expenses and profitability"
        action={
          <>
            {canExport && (
              <LinkButton href={`/api/export/finance?${qs.toString()}`} variant="secondary">
                <Download className="h-4 w-4" /> Export
              </LinkButton>
            )}
            {canAdd && (
              <LinkButton href="/finance/new">
                <Plus className="h-4 w-4" /> Add Transaction
              </LinkButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Revenue (Month)" value={formatCurrency(summary.revenue)} tone="brand" />
        <StatCard label="Expenses (Month)" value={formatCurrency(summary.expense)} tone="danger" />
        <StatCard label="Net Profit (Month)" value={formatCurrency(summary.profit)} tone={summary.profit >= 0 ? "brand" : "danger"} />
        <StatCard label="Total Revenue" value={formatCurrency(summary.totalRevenueAllTime)} />
        <StatCard label="Total Expenses" value={formatCurrency(summary.totalExpenseAllTime)} />
        <StatCard label="Net Profit (All-time)" value={formatCurrency(summary.profitAllTime)} />
      </div>

      <Card className="mt-5">
        <form method="get" className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4">
          <div className="w-36">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Type</label>
            <Select name="type" defaultValue={params.type ?? ""}>
              <option value="">All</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expense</option>
            </Select>
          </div>
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Category</label>
            <Select name="category" defaultValue={params.category ?? ""}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
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
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Payment Type</label>
            <Select name="paymentMethod" defaultValue={params.paymentMethod ?? ""}>
              <option value="">All</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">From</label>
            <Input name="from" type="date" defaultValue={params.from ?? ""} />
          </div>
          <div className="w-36">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">To</label>
            <Input name="to" type="date" defaultValue={params.to ?? ""} />
          </div>
          <Button type="submit" variant="secondary">
            Apply Filters
          </Button>
        </form>

        {transactions.length === 0 ? (
          <EmptyState title="No transactions found" subtitle="Try adjusting your filters or add a new transaction." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Transaction ID</Th>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Category</Th>
                <Th>Description</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Centre</Th>
                <Th>Added By</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <Td>{t.code}</Td>
                  <Td>{formatDate(t.date)}</Td>
                  <Td>
                    <Badge value={t.type} />
                  </Td>
                  <Td>{t.category}</Td>
                  <Td>{t.description ?? "-"}</Td>
                  <Td className={t.type === "REVENUE" ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
                    {t.type === "REVENUE" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </Td>
                  <Td>{t.payment_method.replaceAll("_", " ")}</Td>
                  <Td>{t.centre_name ?? "-"}</Td>
                  <Td>{t.added_by_name ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

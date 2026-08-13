import { can } from "@/lib/auth";
import { listCentres } from "@/lib/modules/centres";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { TransactionForm } from "../TransactionForm";
import { createTransactionAction } from "../actions";

export default async function NewTransactionPage() {
  const allowed = await can("finance", "add");
  if (!allowed) return <Forbidden />;

  const centres = listCentres(false);

  return (
    <div>
      <PageHeader title="Add Transaction" subtitle="Record revenue or an expense" />
      <Card className="max-w-2xl p-5">
        <TransactionForm action={createTransactionAction} centres={centres} />
      </Card>
    </div>
  );
}

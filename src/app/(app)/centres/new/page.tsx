import { can } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { CentreForm } from "../CentreForm";
import { createCentreAction } from "../actions";

export default async function NewCentrePage() {
  const allowed = await can("centres", "add");
  if (!allowed) return <Forbidden />;

  return (
    <div>
      <PageHeader title="Add New Centre" />
      <Card className="max-w-2xl p-5">
        <CentreForm action={createCentreAction} />
      </Card>
    </div>
  );
}

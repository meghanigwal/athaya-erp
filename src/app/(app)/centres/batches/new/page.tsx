import { can } from "@/lib/auth";
import { listCentres } from "@/lib/modules/centres";
import { listCoaches } from "@/lib/modules/coaches";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { BatchForm } from "../../BatchForm";
import { createBatchAction } from "../../actions";

export default async function NewBatchPage() {
  const allowed = await can("centres", "add");
  if (!allowed) return <Forbidden />;

  const centres = listCentres(false);
  const coaches = listCoaches(false);

  return (
    <div>
      <PageHeader title="Add New Batch" />
      <Card className="max-w-2xl p-5">
        <BatchForm action={createBatchAction} centres={centres} coaches={coaches} />
      </Card>
    </div>
  );
}

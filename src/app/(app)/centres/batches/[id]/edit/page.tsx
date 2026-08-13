import { notFound } from "next/navigation";
import { can } from "@/lib/auth";
import { getBatch, listCentres } from "@/lib/modules/centres";
import { listCoaches } from "@/lib/modules/coaches";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { BatchForm } from "../../../BatchForm";
import { updateBatchAction } from "../../../actions";

export default async function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const allowed = await can("centres", "edit");
  if (!allowed) return <Forbidden />;

  const { id } = await params;
  const batch = getBatch(id);
  if (!batch) notFound();

  const centres = listCentres(false);
  const coaches = listCoaches(false);
  const action = updateBatchAction.bind(null, id);

  return (
    <div>
      <PageHeader title={`Edit Batch — ${batch.name}`} />
      <Card className="max-w-2xl p-5">
        <BatchForm action={action} batch={batch} centres={centres} coaches={coaches} />
      </Card>
    </div>
  );
}

import { notFound } from "next/navigation";
import { can } from "@/lib/auth";
import { getCentre } from "@/lib/modules/centres";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { CentreForm } from "../../CentreForm";
import { updateCentreAction } from "../../actions";

export default async function EditCentrePage({ params }: { params: Promise<{ id: string }> }) {
  const allowed = await can("centres", "edit");
  if (!allowed) return <Forbidden />;

  const { id } = await params;
  const centre = getCentre(id);
  if (!centre) notFound();

  const action = updateCentreAction.bind(null, id);

  return (
    <div>
      <PageHeader title={`Edit Centre — ${centre.name}`} />
      <Card className="max-w-2xl p-5">
        <CentreForm action={action} centre={centre} />
      </Card>
    </div>
  );
}

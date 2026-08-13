import { notFound } from "next/navigation";
import { can } from "@/lib/auth";
import { getCoach } from "@/lib/modules/coaches";
import { listCentres } from "@/lib/modules/centres";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { CoachForm } from "../../CoachForm";
import { updateCoachAction } from "../../actions";

export default async function EditCoachPage({ params }: { params: Promise<{ id: string }> }) {
  const allowed = await can("coaches", "edit");
  if (!allowed) return <Forbidden />;

  const { id } = await params;
  const coach = getCoach(id);
  if (!coach) notFound();

  const centres = listCentres(false);
  const action = updateCoachAction.bind(null, id);

  return (
    <div>
      <PageHeader title={`Edit Coach — ${coach.name}`} subtitle={coach.code} />
      <Card className="p-5">
        <CoachForm action={action} coach={coach} centres={centres} />
      </Card>
    </div>
  );
}

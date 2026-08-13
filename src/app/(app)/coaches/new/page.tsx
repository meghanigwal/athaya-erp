import { can } from "@/lib/auth";
import { listCentres } from "@/lib/modules/centres";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { CoachForm } from "../CoachForm";
import { createCoachAction } from "../actions";

export default async function NewCoachPage() {
  const allowed = await can("coaches", "add");
  if (!allowed) return <Forbidden />;

  const centres = listCentres(false);

  return (
    <div>
      <PageHeader title="Add New Coach" subtitle="Register a coach or staff member" />
      <Card className="p-5">
        <CoachForm action={createCoachAction} centres={centres} />
      </Card>
    </div>
  );
}

import { can } from "@/lib/auth";
import { listCentres } from "@/lib/modules/centres";
import { listUsers } from "@/lib/modules/users";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { LeadForm } from "../LeadForm";
import { createLeadAction } from "../actions";

export default async function NewLeadPage() {
  const allowed = await can("leads", "add");
  if (!allowed) return <Forbidden />;

  const centres = listCentres(false);
  const users = listUsers();

  return (
    <div>
      <PageHeader title="Add New Lead" subtitle="Capture a new enquiry into the sales pipeline" />
      <Card className="p-5">
        <LeadForm action={createLeadAction} centres={centres} users={users} />
      </Card>
    </div>
  );
}

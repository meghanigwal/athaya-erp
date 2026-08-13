import { notFound } from "next/navigation";
import { can } from "@/lib/auth";
import { getLead } from "@/lib/modules/leads";
import { listCentres } from "@/lib/modules/centres";
import { listUsers } from "@/lib/modules/users";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { LeadForm } from "../../LeadForm";
import { updateLeadAction } from "../../actions";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const allowed = await can("leads", "edit");
  if (!allowed) return <Forbidden />;

  const { id } = await params;
  const lead = getLead(id);
  if (!lead) notFound();

  const centres = listCentres(false);
  const users = listUsers();
  const action = updateLeadAction.bind(null, id);

  return (
    <div>
      <PageHeader title={`Edit Lead — ${lead.child_name}`} subtitle={lead.code} />
      <Card className="p-5">
        <LeadForm action={action} lead={lead} centres={centres} users={users} />
      </Card>
    </div>
  );
}

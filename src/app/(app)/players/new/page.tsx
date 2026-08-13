import { can } from "@/lib/auth";
import { listCentres, listBatches } from "@/lib/modules/centres";
import { listCoaches } from "@/lib/modules/coaches";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { PlayerForm } from "../PlayerForm";
import { createPlayerAction } from "../actions";

export default async function NewPlayerPage() {
  const allowed = await can("players", "add");
  if (!allowed) return <Forbidden />;

  const centres = listCentres(false);
  const batches = listBatches();
  const coaches = listCoaches(false);

  return (
    <div>
      <PageHeader title="Register New Player" subtitle="Add a player to the central database" />
      <Card className="p-5">
        <PlayerForm action={createPlayerAction} centres={centres} batches={batches} coaches={coaches} />
      </Card>
    </div>
  );
}

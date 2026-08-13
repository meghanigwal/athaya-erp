import { notFound } from "next/navigation";
import { can } from "@/lib/auth";
import { getPlayer } from "@/lib/modules/players";
import { listCentres, listBatches } from "@/lib/modules/centres";
import { listCoaches } from "@/lib/modules/coaches";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { PlayerForm } from "../../PlayerForm";
import { updatePlayerAction } from "../../actions";

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const allowed = await can("players", "edit");
  if (!allowed) return <Forbidden />;

  const { id } = await params;
  const player = getPlayer(id);
  if (!player) notFound();

  const centres = listCentres(false);
  const batches = listBatches();
  const coaches = listCoaches(false);
  const action = updatePlayerAction.bind(null, id);

  return (
    <div>
      <PageHeader title={`Edit Player — ${player.name}`} subtitle={player.code} />
      <Card className="p-5">
        <PlayerForm action={action} player={player} centres={centres} batches={batches} coaches={coaches} />
      </Card>
    </div>
  );
}

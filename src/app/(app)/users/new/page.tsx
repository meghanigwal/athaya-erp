import { getCurrentUser } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { UserForm } from "../UserForm";
import { createUserAction } from "../actions";

export default async function NewUserPage() {
  const me = await getCurrentUser();
  if (!me || me.role !== "SUPER_ADMIN") return <Forbidden message="Only the Super Admin can create users." />;

  return (
    <div>
      <PageHeader title="Add New User" subtitle="Create a login for an employee, admin, or another super admin" />
      <Card className="max-w-2xl p-5">
        <UserForm action={createUserAction} />
      </Card>
    </div>
  );
}

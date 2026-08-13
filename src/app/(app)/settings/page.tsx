import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader, Card, CardHeader } from "@/components/ui";
import { ProfileForm, PasswordForm } from "./SettingsForms";
import { humanize } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader title="Settings" subtitle={`Signed in as ${humanize(user.role)}`} />
      <div className="max-w-2xl space-y-5">
        <Card>
          <CardHeader title="Profile" />
          <div className="px-5 py-5">
            <ProfileForm user={user} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Change Password" />
          <div className="px-5 py-5">
            <PasswordForm />
          </div>
        </Card>
      </div>
    </div>
  );
}

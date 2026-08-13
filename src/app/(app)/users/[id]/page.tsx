import { notFound } from "next/navigation";
import { getCurrentUser, getPermissions } from "@/lib/auth";
import { getUser } from "@/lib/modules/users";
import { MODULES, MODULE_LABELS } from "@/lib/types";
import { PageHeader, Card, CardHeader, Button } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { EditUserForm } from "./EditUserForm";
import { updateUserAction, savePermissionsAction } from "../actions";

export default async function ManageUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me || me.role !== "SUPER_ADMIN") return <Forbidden message="Only the Super Admin can manage users and permissions." />;

  const { id } = await params;
  const user = getUser(id);
  if (!user) notFound();

  const action = updateUserAction.bind(null, id);
  const permissions = getPermissions(user.id, user.role);

  return (
    <div>
      <PageHeader title={`Manage User — ${user.name}`} subtitle={user.email} />

      <div className="space-y-5">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Account Details</h3>
          <EditUserForm action={action} user={user} isSelf={me.id === user.id} />
        </Card>

        <Card>
          <CardHeader
            title="Module Permissions"
            subtitle={
              user.role === "SUPER_ADMIN"
                ? "Super Admins always have full access to every module."
                : "Control exactly what this user can see and do in each module."
            }
          />
          {user.role === "SUPER_ADMIN" ? (
            <p className="px-5 py-6 text-sm text-slate-500">No configuration needed — Super Admins have complete access.</p>
          ) : (
            <form action={savePermissionsAction}>
              <input type="hidden" name="user_id" value={user.id} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Module
                      </th>
                      {(["view", "add", "edit", "delete", "export"] as const).map((action) => (
                        <th key={action} className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.filter((m) => m !== "users").map((mod) => {
                      const p = permissions[mod];
                      return (
                        <tr key={mod}>
                          <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 font-medium text-slate-700">
                            {MODULE_LABELS[mod]}
                          </td>
                          {(["view", "add", "edit", "delete", "export"] as const).map((action) => (
                            <td key={action} className="border-b border-slate-100 px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                name={`${mod}_${action}`}
                                defaultChecked={Boolean(p[`can_${action}`])}
                                className="h-4 w-4 rounded border-slate-300"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-4">
                <Button type="submit">Save Permissions</Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/lib/modules/users";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { humanize } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function UsersPage() {
  const me = await getCurrentUser();
  if (!me || me.role !== "SUPER_ADMIN") return <Forbidden message="Only the Super Admin can manage users and permissions." />;

  const users = listUsers();

  return (
    <div>
      <PageHeader
        title="Users & Permissions"
        subtitle="Manage team accounts and module-level access"
        action={
          <LinkButton href="/users/new">
            <Plus className="h-4 w-4" /> Add User
          </LinkButton>
        }
      />

      <Card>
        {users.length === 0 ? (
          <EmptyState title="No users yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>User ID</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <Td>{u.code}</Td>
                  <Td className="font-medium text-slate-800">{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{humanize(u.role)}</Td>
                  <Td>
                    <Badge value={u.status} />
                  </Td>
                  <Td>
                    <Link href={`/users/${u.id}`} className="text-xs font-medium text-brand hover:underline">
                      Manage
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

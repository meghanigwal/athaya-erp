"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select } from "@/components/ui";
import type { User } from "@/lib/types";
import type { FormState } from "../actions";

export function EditUserForm({
  action,
  user,
  isSelf,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  user: User;
  isSelf: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const superAdminLocked = user.role === "SUPER_ADMIN" && !isSelf;

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage message={state.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={user.name} required disabled={superAdminLocked} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={user.phone ?? ""} disabled={superAdminLocked} />
        </Field>
        <Field label="Role" htmlFor="role">
          <Select id="role" name="role" defaultValue={user.role} disabled={superAdminLocked || user.role === "SUPER_ADMIN"}>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </Select>
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={user.status} disabled={superAdminLocked || user.role === "SUPER_ADMIN"}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </Field>
        <Field label="Reset Password" htmlFor="new_password" hint="Leave blank to keep current password">
          <Input id="new_password" name="new_password" type="text" minLength={6} disabled={superAdminLocked} />
        </Field>
      </div>
      <Button type="submit" disabled={pending || superAdminLocked}>
        {pending ? "Saving..." : "Save Changes"}
      </Button>
      {superAdminLocked && <p className="text-xs text-slate-400">Super Admin accounts can only be edited by themselves.</p>}
    </form>
  );
}

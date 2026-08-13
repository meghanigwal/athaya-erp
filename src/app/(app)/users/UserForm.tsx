"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select } from "@/components/ui";
import type { FormState } from "./actions";

export function UserForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage message={state.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="name" required>
          <Input id="name" name="name" required />
        </Field>
        <Field label="Email Address" htmlFor="email" required>
          <Input id="email" name="email" type="email" required />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" />
        </Field>
        <Field label="Role" htmlFor="role" required>
          <Select id="role" name="role" defaultValue="EMPLOYEE">
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </Select>
        </Field>
        <Field label="Temporary Password" htmlFor="password" required hint="At least 6 characters">
          <Input id="password" name="password" type="text" required minLength={6} />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create User"}
      </Button>
    </form>
  );
}

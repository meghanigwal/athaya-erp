"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input } from "@/components/ui";
import { updateProfileAction, changePasswordAction, type FormState } from "./actions";
import type { User } from "@/lib/types";

export function ProfileForm({ user }: { user: User }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {} as FormState);
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage message={state.error} />
      <FormMessage message={state.success} tone="success" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={user.name} required />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={user.phone ?? ""} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" value={user.email} disabled />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {} as FormState);
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage message={state.error} />
      <FormMessage message={state.success} tone="success" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Current Password" htmlFor="current_password" required>
          <Input id="current_password" name="current_password" type="password" required />
        </Field>
        <Field label="New Password" htmlFor="new_password" required hint="At least 6 characters">
          <Input id="new_password" name="new_password" type="password" required minLength={6} />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Updating..." : "Change Password"}
      </Button>
    </form>
  );
}

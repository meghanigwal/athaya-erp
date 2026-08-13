"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select } from "@/components/ui";
import type { Centre } from "@/lib/types";
import type { FormState } from "./actions";

export function CentreForm({
  action,
  centre,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  centre?: Centre;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage message={state.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Centre Name" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={centre?.name} required />
        </Field>
        <Field label="City" htmlFor="city">
          <Input id="city" name="city" defaultValue={centre?.city ?? ""} />
        </Field>
        <Field label="Address" htmlFor="address">
          <Input id="address" name="address" defaultValue={centre?.address ?? ""} />
        </Field>
        {centre && (
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={centre.status}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : centre ? "Save Changes" : "Add Centre"}
      </Button>
    </form>
  );
}

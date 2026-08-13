"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select } from "@/components/ui";
import type { Batch } from "@/lib/types";
import type { FormState } from "./actions";

export function BatchForm({
  action,
  batch,
  centres,
  coaches,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  batch?: Batch;
  centres: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage message={state.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Batch Name" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={batch?.name} required placeholder="e.g. Sukhdev Vihar - Evening" />
        </Field>
        <Field label="Centre" htmlFor="centre_id">
          <Select id="centre_id" name="centre_id" defaultValue={batch?.centre_id ?? ""}>
            <option value="">Select centre</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Coach" htmlFor="coach_id">
          <Select id="coach_id" name="coach_id" defaultValue={batch?.coach_id ?? ""}>
            <option value="">Select coach</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Schedule" htmlFor="schedule">
          <Input id="schedule" name="schedule" defaultValue={batch?.schedule ?? ""} placeholder="e.g. Mon / Wed / Fri - 5:00 PM" />
        </Field>
        <Field label="Age Group" htmlFor="age_group">
          <Input id="age_group" name="age_group" defaultValue={batch?.age_group ?? ""} placeholder="e.g. 6-9 yrs" />
        </Field>
        {batch && (
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={batch.status}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : batch ? "Save Changes" : "Add Batch"}
      </Button>
    </form>
  );
}

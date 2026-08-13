"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select, Textarea } from "@/components/ui";
import type { Coach } from "@/lib/types";
import type { FormState } from "./actions";

export function CoachForm({
  action,
  coach,
  centres,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  coach?: Coach;
  centres: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage message={state.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={coach?.name} required />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={coach?.phone ?? ""} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={coach?.email ?? ""} />
        </Field>
        <Field label="Role" htmlFor="role">
          <Select id="role" name="role" defaultValue={coach?.role ?? "Coach"}>
            <option value="Head Coach">Head Coach</option>
            <option value="Coach">Coach</option>
            <option value="Assistant Coach">Assistant Coach</option>
            <option value="Fitness Trainer">Fitness Trainer</option>
            <option value="Admin Staff">Admin Staff</option>
          </Select>
        </Field>
        <Field label="Qualification" htmlFor="qualification">
          <Input id="qualification" name="qualification" defaultValue={coach?.qualification ?? ""} placeholder="e.g. AFC C License" />
        </Field>
        <Field label="Experience" htmlFor="experience">
          <Input id="experience" name="experience" defaultValue={coach?.experience ?? ""} placeholder="e.g. 4 years" />
        </Field>
        <Field label="Joining Date" htmlFor="joining_date">
          <Input id="joining_date" name="joining_date" type="date" defaultValue={coach?.joining_date ?? ""} />
        </Field>
        <Field label="Assigned Centre" htmlFor="centre_id">
          <Select id="centre_id" name="centre_id" defaultValue={coach?.centre_id ?? ""}>
            <option value="">Select centre</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        {coach && (
          <Field label="Employment Status" htmlFor="employment_status">
            <Select id="employment_status" name="employment_status" defaultValue={coach.employment_status}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
        )}
        <Field label="Salary / Payment Info" htmlFor="salary_info">
          <Input id="salary_info" name="salary_info" defaultValue={coach?.salary_info ?? ""} placeholder="e.g. ₹25,000/month" />
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={coach?.notes ?? ""} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : coach ? "Save Changes" : "Add Coach"}
      </Button>
    </form>
  );
}

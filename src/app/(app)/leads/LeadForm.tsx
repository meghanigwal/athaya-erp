"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select, Textarea } from "@/components/ui";
import { LEAD_STATUSES } from "@/lib/types";
import type { Lead } from "@/lib/types";
import type { FormState } from "./actions";

const LEAD_SOURCES = ["Referral", "Instagram", "Facebook Ads", "Walk-in", "Google", "WhatsApp", "Other"];

export function LeadForm({
  action,
  lead,
  centres,
  users,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  lead?: Lead;
  centres: { id: string; name: string }[];
  users: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage message={state.error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Child Name" htmlFor="child_name" required>
          <Input id="child_name" name="child_name" defaultValue={lead?.child_name} required />
        </Field>
        <Field label="Parent / Guardian Name" htmlFor="parent_name">
          <Input id="parent_name" name="parent_name" defaultValue={lead?.parent_name ?? ""} />
        </Field>
        <Field label="Child Age" htmlFor="child_age">
          <Input id="child_age" name="child_age" defaultValue={lead?.child_age ?? ""} />
        </Field>
        <Field label="Phone Number" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={lead?.phone ?? ""} />
        </Field>
        <Field label="WhatsApp Number" htmlFor="whatsapp">
          <Input id="whatsapp" name="whatsapp" defaultValue={lead?.whatsapp ?? ""} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} />
        </Field>
        <Field label="Location / Society" htmlFor="location">
          <Input id="location" name="location" defaultValue={lead?.location ?? ""} />
        </Field>
        <Field label="City" htmlFor="city">
          <Input id="city" name="city" defaultValue={lead?.city ?? ""} />
        </Field>
        <Field label="Source" htmlFor="source">
          <Select id="source" name="source" defaultValue={lead?.source ?? ""}>
            <option value="">Select source</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Interested Programme" htmlFor="programme">
          <Input id="programme" name="programme" defaultValue={lead?.programme ?? ""} placeholder="e.g. Weekday Batch" />
        </Field>
        <Field label="Interested Centre" htmlFor="centre_id">
          <Select id="centre_id" name="centre_id" defaultValue={lead?.centre_id ?? ""}>
            <option value="">Select centre</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lead Date" htmlFor="lead_date">
          <Input id="lead_date" name="lead_date" type="date" defaultValue={lead?.lead_date ?? new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Assigned Employee" htmlFor="assigned_user_id">
          <Select id="assigned_user_id" name="assigned_user_id" defaultValue={lead?.assigned_user_id ?? ""}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lead Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={lead?.status ?? "NEW"}>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Follow-up Date" htmlFor="follow_up_date">
          <Input id="follow_up_date" name="follow_up_date" type="date" defaultValue={lead?.follow_up_date ?? ""} />
        </Field>
        <Field label="Expected Fee (₹)" htmlFor="expected_fee">
          <Input id="expected_fee" name="expected_fee" type="number" min={0} defaultValue={lead?.expected_fee ?? ""} />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={lead?.notes ?? ""} placeholder="Follow-up notes, trial feedback, etc." />
      </Field>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
        </Button>
      </div>
    </form>
  );
}

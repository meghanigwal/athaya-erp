"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select, Textarea } from "@/components/ui";
import { PLAYER_STATUSES } from "@/lib/types";
import type { Player } from "@/lib/types";
import type { FormState } from "./actions";

export function PlayerForm({
  action,
  player,
  centres,
  batches,
  coaches,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  player?: Player;
  centres: { id: string; name: string }[];
  batches: { id: string; name: string; centre_id: string | null }[];
  coaches: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage message={state.error} />

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Player Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Player Name" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={player?.name} required />
          </Field>
          <Field label="Date of Birth" htmlFor="dob">
            <Input id="dob" name="dob" type="date" defaultValue={player?.dob ?? ""} />
          </Field>
          <Field label="Gender" htmlFor="gender">
            <Select id="gender" name="gender" defaultValue={player?.gender ?? ""}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Player Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={player?.status ?? "ACTIVE"}>
              {PLAYER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Parent Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Parent / Guardian Name" htmlFor="parent_name">
            <Input id="parent_name" name="parent_name" defaultValue={player?.parent_name ?? ""} />
          </Field>
          <Field label="Father / Mother Name" htmlFor="father_mother_name">
            <Input id="father_mother_name" name="father_mother_name" defaultValue={player?.father_mother_name ?? ""} />
          </Field>
          <Field label="Phone Number" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={player?.phone ?? ""} />
          </Field>
          <Field label="WhatsApp Number" htmlFor="whatsapp">
            <Input id="whatsapp" name="whatsapp" defaultValue={player?.whatsapp ?? ""} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={player?.email ?? ""} />
          </Field>
          <Field label="Emergency Contact" htmlFor="emergency_contact">
            <Input id="emergency_contact" name="emergency_contact" defaultValue={player?.emergency_contact ?? ""} />
          </Field>
          <Field label="Address" htmlFor="address">
            <Input id="address" name="address" defaultValue={player?.address ?? ""} />
          </Field>
          <Field label="Society / Location" htmlFor="society">
            <Input id="society" name="society" defaultValue={player?.society ?? ""} />
          </Field>
          <Field label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={player?.city ?? ""} />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Training Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Centre" htmlFor="centre_id">
            <Select id="centre_id" name="centre_id" defaultValue={player?.centre_id ?? ""}>
              <option value="">Select centre</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Batch" htmlFor="batch_id">
            <Select id="batch_id" name="batch_id" defaultValue={player?.batch_id ?? ""}>
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Age Group" htmlFor="age_group">
            <Input id="age_group" name="age_group" defaultValue={player?.age_group ?? ""} placeholder="e.g. 6-9 yrs" />
          </Field>
          <Field label="Coach" htmlFor="coach_id">
            <Select id="coach_id" name="coach_id" defaultValue={player?.coach_id ?? ""}>
              <option value="">Select coach</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Programme" htmlFor="programme">
            <Input id="programme" name="programme" defaultValue={player?.programme ?? ""} />
          </Field>
          <Field label="Joining Date" htmlFor="joining_date">
            <Input id="joining_date" name="joining_date" type="date" defaultValue={player?.joining_date ?? new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Registration Date" htmlFor="registration_date">
            <Input id="registration_date" name="registration_date" type="date" defaultValue={player?.registration_date ?? new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Fee Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Monthly Fee (₹)" htmlFor="monthly_fee">
            <Input id="monthly_fee" name="monthly_fee" type="number" min={0} defaultValue={player?.monthly_fee ?? 0} />
          </Field>
          <Field label="Registration Fee (₹)" htmlFor="registration_fee">
            <Input id="registration_fee" name="registration_fee" type="number" min={0} defaultValue={player?.registration_fee ?? 0} />
          </Field>
        </div>
      </section>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={player?.notes ?? ""} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : player ? "Save Changes" : "Add Player"}
      </Button>
    </form>
  );
}

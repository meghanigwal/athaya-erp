"use client";

import { useActionState } from "react";
import { useState } from "react";
import { Button, Field, FormMessage, Input, Select } from "@/components/ui";
import { PAYMENT_METHODS } from "@/lib/types";
import { recordPaymentAction, type FormState } from "./actions";

export function RecordPaymentForm({ playerId, monthlyFee }: { playerId: string; monthlyFee: number }) {
  const [state, formAction, pending] = useActionState(recordPaymentAction, {} as FormState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        Record Payment
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="player_id" value={playerId} />
      <FormMessage message={state.error} />
      <Field label="Amount (₹)" htmlFor="amount" required>
        <Input id="amount" name="amount" type="number" min={1} defaultValue={monthlyFee || ""} required />
      </Field>
      <Field label="For Month" htmlFor="for_month">
        <Input id="for_month" name="for_month" type="month" defaultValue={new Date().toISOString().slice(0, 7)} />
      </Field>
      <Field label="Payment Date" htmlFor="payment_date">
        <Input id="payment_date" name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </Field>
      <Field label="Payment Method" htmlFor="payment_method">
        <Select id="payment_method" name="payment_method" defaultValue="CASH">
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Input id="notes" name="notes" placeholder="Optional" />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Saving..." : "Save Payment"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

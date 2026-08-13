"use client";

import { useActionState, useState } from "react";
import { Button, Field, FormMessage, Input, Select, Textarea } from "@/components/ui";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, REVENUE_CATEGORIES } from "@/lib/types";
import type { FormState } from "./actions";

export function TransactionForm({
  action,
  centres,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  centres: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [type, setType] = useState<"REVENUE" | "EXPENSE">("REVENUE");
  const categories = type === "REVENUE" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage message={state.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Type" htmlFor="type" required>
          <Select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as "REVENUE" | "EXPENSE")}>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expense</option>
          </Select>
        </Field>
        <Field label="Category" htmlFor="category" required>
          <Select id="category" name="category" required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount (₹)" htmlFor="amount" required>
          <Input id="amount" name="amount" type="number" min={1} required />
        </Field>
        <Field label="Date" htmlFor="date" required>
          <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
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
        <Field label="Centre" htmlFor="related_centre_id">
          <Select id="related_centre_id" name="related_centre_id">
            <option value="">Not centre-specific</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Description" htmlFor="description">
        <Input id="description" name="description" placeholder="Short description" />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Add Transaction"}
      </Button>
    </form>
  );
}

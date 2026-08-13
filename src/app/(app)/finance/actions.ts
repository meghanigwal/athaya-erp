"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertCan, requireUser } from "@/lib/auth";
import { createTransaction } from "@/lib/modules/finance";
import { logActivity } from "@/lib/activity";
import { str, parseFormNumber, formatCurrency } from "@/lib/utils";
import type { PaymentMethod, TransactionType } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function createTransactionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("finance", "add");
    const user = await requireUser();
    const type = (str(formData.get("type")) as TransactionType) ?? "REVENUE";
    const category = str(formData.get("category"));
    const amount = parseFormNumber(formData.get("amount"), 0);
    const date = str(formData.get("date")) ?? new Date().toISOString().slice(0, 10);

    if (!category) return { error: "Please select a category." };
    if (amount <= 0) return { error: "Please enter a valid amount." };

    const txn = createTransaction({
      date,
      type,
      category,
      description: str(formData.get("description")),
      amount,
      payment_method: (str(formData.get("payment_method")) as PaymentMethod) ?? "CASH",
      related_centre_id: str(formData.get("related_centre_id")),
      added_by_user_id: user.id,
      notes: str(formData.get("notes")),
    });

    logActivity({
      user,
      action: "Created",
      module: "Finance",
      recordId: txn.id,
      recordLabel: txn.code,
      description: `${type === "REVENUE" ? "Revenue" : "Expense"} of ${formatCurrency(amount)} recorded under ${category}.`,
    });

    revalidatePath("/finance");
    revalidatePath("/dashboard");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/finance");
}

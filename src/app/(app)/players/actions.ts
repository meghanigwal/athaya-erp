"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertCan, requireUser } from "@/lib/auth";
import { createPlayer, getPlayer, updatePlayer, recordPayment } from "@/lib/modules/players";
import { createTransaction } from "@/lib/modules/finance";
import { logActivity, diffFields } from "@/lib/activity";
import { str, parseFormNumber, formatCurrency } from "@/lib/utils";
import type { PaymentMethod, PlayerStatus } from "@/lib/types";

export interface FormState {
  error?: string;
}

function readPlayerInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    dob: str(formData.get("dob")),
    gender: str(formData.get("gender")),
    parent_name: str(formData.get("parent_name")),
    father_mother_name: str(formData.get("father_mother_name")),
    phone: str(formData.get("phone")),
    whatsapp: str(formData.get("whatsapp")),
    email: str(formData.get("email")),
    address: str(formData.get("address")),
    society: str(formData.get("society")),
    city: str(formData.get("city")),
    centre_id: str(formData.get("centre_id")),
    batch_id: str(formData.get("batch_id")),
    age_group: str(formData.get("age_group")),
    coach_id: str(formData.get("coach_id")),
    joining_date: str(formData.get("joining_date")),
    registration_date: str(formData.get("registration_date")),
    programme: str(formData.get("programme")),
    monthly_fee: parseFormNumber(formData.get("monthly_fee"), 0),
    registration_fee: parseFormNumber(formData.get("registration_fee"), 0),
    status: (str(formData.get("status")) as PlayerStatus) ?? "ACTIVE",
    emergency_contact: str(formData.get("emergency_contact")),
    notes: str(formData.get("notes")),
  };
}

export async function createPlayerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("players", "add");
    const user = await requireUser();
    const input = readPlayerInput(formData);
    if (!input.name) return { error: "Player name is required." };
    const player = createPlayer(input);
    logActivity({ user, action: "Created", module: "Players", recordId: player.id, recordLabel: player.name, description: `New player registered: ${player.name}` });
    revalidatePath("/players");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/players");
}

export async function updatePlayerAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("players", "edit");
    const user = await requireUser();
    const before = getPlayer(id);
    if (!before) return { error: "Player not found." };
    const input = readPlayerInput(formData);
    if (!input.name) return { error: "Player name is required." };
    const after = updatePlayer(id, input);

    const diff = diffFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>, {
      monthly_fee: "Monthly Fee",
      status: "Player Status",
      centre_id: "Centre",
      coach_id: "Coach",
      batch_id: "Batch",
    });
    logActivity({
      user,
      action: before.status !== after.status ? "Status Changed" : "Updated",
      module: "Players",
      recordId: id,
      recordLabel: after.name,
      previousValue: diff?.previous ?? null,
      newValue: diff?.next ?? null,
      description: diff?.description ?? `Player ${after.name} updated.`,
    });
    revalidatePath("/players");
    revalidatePath(`/players/${id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect(`/players/${id}`);
}

export async function recordPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("players", "edit");
    const user = await requireUser();
    const playerId = String(formData.get("player_id"));
    const player = getPlayer(playerId);
    if (!player) return { error: "Player not found." };
    const amount = parseFormNumber(formData.get("amount"), 0);
    if (amount <= 0) return { error: "Please enter a valid payment amount." };

    const method = (str(formData.get("payment_method")) as PaymentMethod) ?? "CASH";
    const paymentDate = str(formData.get("payment_date")) ?? new Date().toISOString().slice(0, 10);

    recordPayment({
      player_id: playerId,
      amount,
      for_month: str(formData.get("for_month")),
      payment_date: paymentDate,
      payment_method: method,
      status: "PAID",
      notes: str(formData.get("notes")),
      added_by_user_id: user.id,
    });

    createTransaction({
      date: paymentDate,
      type: "REVENUE",
      category: "Monthly Fees",
      description: `Fee payment from ${player.name}`,
      amount,
      payment_method: method,
      related_player_id: playerId,
      related_centre_id: player.centre_id,
      added_by_user_id: user.id,
    });

    logActivity({
      user,
      action: "Payment Recorded",
      module: "Finance",
      recordId: playerId,
      recordLabel: player.name,
      description: `Recorded payment of ${formatCurrency(amount)} for ${player.name} via ${method.replaceAll("_", " ")}.`,
    });

    revalidatePath(`/players/${playerId}`);
    revalidatePath("/finance");
    revalidatePath("/dashboard");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect(`/players/${String(formData.get("player_id"))}`);
}

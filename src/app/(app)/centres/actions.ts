"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertCan, requireUser } from "@/lib/auth";
import { createCentre, getCentre, updateCentre, createBatch, getBatch, updateBatch } from "@/lib/modules/centres";
import { logActivity, diffFields } from "@/lib/activity";
import { str } from "@/lib/utils";

export interface FormState {
  error?: string;
}

export async function createCentreAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("centres", "add");
    const user = await requireUser();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Centre name is required." };
    const centre = createCentre({ name, address: str(formData.get("address")), city: str(formData.get("city")) });
    logActivity({ user, action: "Created", module: "Centres", recordId: centre.id, recordLabel: centre.name, description: `New centre added: ${centre.name}` });
    revalidatePath("/centres");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/centres");
}

export async function updateCentreAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("centres", "edit");
    const user = await requireUser();
    const before = getCentre(id);
    if (!before) return { error: "Centre not found." };
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Centre name is required." };
    const after = updateCentre(id, {
      name,
      address: str(formData.get("address")),
      city: str(formData.get("city")),
      status: str(formData.get("status")) ?? "ACTIVE",
    });
    const diff = diffFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>, { status: "Status" });
    logActivity({
      user,
      action: "Updated",
      module: "Centres",
      recordId: id,
      recordLabel: after.name,
      previousValue: diff?.previous ?? null,
      newValue: diff?.next ?? null,
      description: diff?.description ?? `Centre ${after.name} updated.`,
    });
    revalidatePath("/centres");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/centres");
}

export async function createBatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("centres", "add");
    const user = await requireUser();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Batch name is required." };
    const batch = createBatch({
      name,
      centre_id: str(formData.get("centre_id")),
      coach_id: str(formData.get("coach_id")),
      schedule: str(formData.get("schedule")),
      age_group: str(formData.get("age_group")),
    });
    logActivity({ user, action: "Created", module: "Centres", recordId: batch.id, recordLabel: batch.name, description: `New batch added: ${batch.name}` });
    revalidatePath("/centres");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/centres");
}

export async function updateBatchAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("centres", "edit");
    const user = await requireUser();
    const before = getBatch(id);
    if (!before) return { error: "Batch not found." };
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Batch name is required." };
    const after = updateBatch(id, {
      name,
      centre_id: str(formData.get("centre_id")),
      coach_id: str(formData.get("coach_id")),
      schedule: str(formData.get("schedule")),
      age_group: str(formData.get("age_group")),
      status: str(formData.get("status")) ?? "ACTIVE",
    });
    const diff = diffFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>, {
      coach_id: "Coach",
      schedule: "Schedule",
    });
    logActivity({
      user,
      action: "Updated",
      module: "Centres",
      recordId: id,
      recordLabel: after.name,
      previousValue: diff?.previous ?? null,
      newValue: diff?.next ?? null,
      description: diff?.description ?? `Batch ${after.name} updated.`,
    });
    revalidatePath("/centres");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/centres");
}

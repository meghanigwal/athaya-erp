"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertCan, requireUser } from "@/lib/auth";
import { createCoach, getCoach, updateCoach } from "@/lib/modules/coaches";
import { logActivity, diffFields } from "@/lib/activity";
import { str } from "@/lib/utils";

export interface FormState {
  error?: string;
}

function readCoachInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: str(formData.get("phone")),
    email: str(formData.get("email")),
    role: str(formData.get("role")),
    qualification: str(formData.get("qualification")),
    experience: str(formData.get("experience")),
    joining_date: str(formData.get("joining_date")),
    centre_id: str(formData.get("centre_id")),
    salary_info: str(formData.get("salary_info")),
    notes: str(formData.get("notes")),
  };
}

export async function createCoachAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("coaches", "add");
    const user = await requireUser();
    const input = readCoachInput(formData);
    if (!input.name) return { error: "Coach name is required." };
    const coach = createCoach(input);
    logActivity({ user, action: "Created", module: "Coaches", recordId: coach.id, recordLabel: coach.name, description: `New coach added: ${coach.name}` });
    revalidatePath("/coaches");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/coaches");
}

export async function updateCoachAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("coaches", "edit");
    const user = await requireUser();
    const before = getCoach(id);
    if (!before) return { error: "Coach not found." };
    const input = readCoachInput(formData);
    if (!input.name) return { error: "Coach name is required." };
    const employment_status = str(formData.get("employment_status")) ?? "ACTIVE";
    const after = updateCoach(id, { ...input, employment_status });

    const diff = diffFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>, {
      centre_id: "Assigned Centre",
      employment_status: "Employment Status",
    });
    logActivity({
      user,
      action: "Updated",
      module: "Coaches",
      recordId: id,
      recordLabel: after.name,
      previousValue: diff?.previous ?? null,
      newValue: diff?.next ?? null,
      description: diff?.description ?? `Coach ${after.name} updated.`,
    });
    revalidatePath("/coaches");
    revalidatePath(`/coaches/${id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect(`/coaches/${id}`);
}

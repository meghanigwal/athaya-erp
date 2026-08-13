"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertCan, requireDeletePrivilege, requireUser } from "@/lib/auth";
import { createLead, deleteLead, getLead, updateLead } from "@/lib/modules/leads";
import { createPlayer } from "@/lib/modules/players";
import { logActivity, diffFields } from "@/lib/activity";
import { str, parseFormNumber } from "@/lib/utils";
import type { LeadStatus } from "@/lib/types";

export interface FormState {
  error?: string;
}

function readLeadInput(formData: FormData) {
  return {
    child_name: String(formData.get("child_name") ?? "").trim(),
    parent_name: str(formData.get("parent_name")),
    child_age: str(formData.get("child_age")),
    phone: str(formData.get("phone")),
    whatsapp: str(formData.get("whatsapp")),
    email: str(formData.get("email")),
    location: str(formData.get("location")),
    city: str(formData.get("city")),
    source: str(formData.get("source")),
    programme: str(formData.get("programme")),
    centre_id: str(formData.get("centre_id")),
    lead_date: str(formData.get("lead_date")),
    assigned_user_id: str(formData.get("assigned_user_id")),
    status: (str(formData.get("status")) as LeadStatus) ?? "NEW",
    follow_up_date: str(formData.get("follow_up_date")),
    notes: str(formData.get("notes")),
    expected_fee: formData.get("expected_fee") ? parseFormNumber(formData.get("expected_fee")) : null,
  };
}

export async function createLeadAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("leads", "add");
    const user = await requireUser();
    const input = readLeadInput(formData);
    if (!input.child_name) return { error: "Child name is required." };
    const lead = createLead(input);
    logActivity({ user, action: "Created", module: "Leads", recordId: lead.id, recordLabel: lead.child_name, description: `New lead added: ${lead.child_name}` });
    revalidatePath("/leads");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect("/leads");
}

export async function updateLeadAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assertCan("leads", "edit");
    const user = await requireUser();
    const before = getLead(id);
    if (!before) return { error: "Lead not found." };
    const input = readLeadInput(formData);
    if (!input.child_name) return { error: "Child name is required." };
    const after = updateLead(id, input);

    const diff = diffFields(
      before as unknown as Record<string, unknown>,
      after as unknown as Record<string, unknown>,
      { status: "Status", follow_up_date: "Follow-up Date", expected_fee: "Expected Fee" }
    );
    logActivity({
      user,
      action: before.status !== after.status ? "Status Changed" : "Updated",
      module: "Leads",
      recordId: id,
      recordLabel: after.child_name,
      previousValue: diff?.previous ?? null,
      newValue: diff?.next ?? null,
      description: diff?.description ?? `Lead ${after.child_name} updated.`,
    });
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }
  redirect(`/leads/${id}`);
}

export async function quickStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as LeadStatus;
  await assertCan("leads", "edit");
  const user = await requireUser();
  const before = getLead(id);
  if (!before) return;
  updateLead(id, { status });
  logActivity({
    user,
    action: "Status Changed",
    module: "Leads",
    recordId: id,
    recordLabel: before.child_name,
    previousValue: before.status,
    newValue: status,
    description: `Lead status changed from ${before.status} to ${status}.`,
  });
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function deleteLeadAction(formData: FormData) {
  const id = String(formData.get("id"));
  const user = await requireDeletePrivilege();
  const lead = getLead(id);
  if (!lead) redirect("/leads");

  deleteLead(id);

  logActivity({
    user,
    action: "Deleted",
    module: "Leads",
    recordId: id,
    recordLabel: lead.child_name,
    description: `Lead ${lead.child_name} (${lead.code}) was permanently deleted by ${user.name}.`,
  });

  revalidatePath("/leads");
  redirect("/leads");
}

export async function convertLeadAction(formData: FormData) {
  const id = String(formData.get("id"));
  await assertCan("leads", "edit");
  await assertCan("players", "add");
  const user = await requireUser();
  const lead = getLead(id);
  if (!lead) return;

  const player = createPlayer({
    name: lead.child_name,
    parent_name: lead.parent_name,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    email: lead.email,
    society: lead.location,
    city: lead.city,
    centre_id: lead.centre_id,
    programme: lead.programme,
    monthly_fee: lead.expected_fee ?? 0,
    joining_date: new Date().toISOString().slice(0, 10),
    registration_date: new Date().toISOString().slice(0, 10),
    status: "TRIAL",
    lead_id: lead.id,
  });

  updateLead(id, { status: "CONVERTED" });

  logActivity({
    user,
    action: "Converted",
    module: "Leads",
    recordId: id,
    recordLabel: lead.child_name,
    description: `Lead ${lead.child_name} converted to player ${player.code}.`,
  });
  logActivity({
    user,
    action: "Created",
    module: "Players",
    recordId: player.id,
    recordLabel: player.name,
    description: `Player profile created from converted lead ${lead.code}.`,
  });

  revalidatePath("/leads");
  revalidatePath("/players");
  redirect(`/players/${player.id}`);
}

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function logAudit(
  entityType: string,
  entityId: string,
  action: string,
  actor: { id?: string; email?: string | null } | null,
  values: { from?: string | null; to?: string | null },
  note?: string | null,
  metadata?: Record<string, any>
) {
  try {
    const { error } = await supabaseAdmin.from("admin_audit_logs").insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor_id: actor?.id || null,
      actor_email: actor?.email || null,
      from_value: values.from,
      to_value: values.to,
      note,
      metadata,
    });
    if (error) console.error("Audit log error:", error);
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }
}

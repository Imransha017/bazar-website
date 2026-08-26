import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logAudit } from "./audit.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const recordAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: any) => d as {
    entityType: string;
    entityId: string;
    action: string;
    fromValue?: string | null;
    toValue?: string | null;
    note?: string | null;
    metadata?: Record<string, any>;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userData?.user?.email;

    await logAudit(
      data.entityType,
      data.entityId,
      data.action,
      { id: userId, email },
      { from: data.fromValue, to: data.toValue },
      data.note,
      data.metadata
    );
    return { success: true };
  });

export const recordOrderAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: any) => d as {
    orderId: string;
    eventType: string;
    message: string;
    metadata?: Record<string, any>;
    severity?: "info" | "warning" | "error";
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.rpc("log_order_event", {
      _order_id: data.orderId,
      _event_type: data.eventType,
      _message: data.message,
      _metadata: data.metadata || {},
      _severity: data.severity || "info"
    });

    if (error) throw error;
    return { success: true };
  });

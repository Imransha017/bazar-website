import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


/**
 * Server-side error logger. 
 * Use this to record failures in server functions or catch-all API errors.
 */
export async function logServerError(params: {
  type: string;
  message: string;
  stack?: string;
  context?: any;
  userId?: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("error_logs" as any).insert({
      source: "server",
      error_type: params.type,
      message: params.message,
      stack: params.stack,
      context: params.context || {},
      user_id: params.userId,
    } as any);

    if (error) throw error;

    // If it's a critical system error, also notify admins
    if (params.type === "CRITICAL" || params.type === "BUILD") {
      await supabaseAdmin.from("admin_notifications" as any).insert({
        type: "error",
        title: `Server Error: ${params.type}`,
        message: params.message,
        details: { stack: params.stack, context: params.context },
      } as any);
    }

    return { ok: true };
  } catch (e) {
    console.error("Failed to log server error:", e);
    return { ok: false };
  }
}

/**
 * Client-callable function to log frontend errors
 */
export const logClientError = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    message: z.string(),
    stack: z.string().optional(),
    url: z.string().optional(),
    context: z.any().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = (context as any).userId;
    
    await supabaseAdmin.from("error_logs" as any).insert({
      source: "client",
      message: data.message,
      stack: data.stack,
      url: data.url,
      context: data.context || {},
      user_id: userId,
    } as any);

    return { ok: true };
  });

export const getAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    if (!userId) return [];

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) return [];

    const { data } = await supabase
      .from("admin_notifications" as any)
      .select("*")
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    return data || [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) throw new Error("Forbidden: admin access required");

    await supabase
      .from("admin_notifications" as any)
      .update({ is_read: true })
      .eq("id", data.id);
    return { ok: true };
  });



import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const idSchema = z.object({ userId: z.string().uuid() });

/** Admin: fetch a customer's profile + auth email. */
export const adminGetUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, date_of_birth, gender, is_locked, email, created_at")
      .eq("id", data.userId)
      .maybeSingle();
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    return {
      profile: profile ?? null,
      email: authUser?.user?.email ?? profile?.email ?? null,
    };
  });

const updateSchema = z.object({
  userId: z.string().uuid(),
  full_name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(20).optional(),
  date_of_birth: z.string().trim().max(20).optional().nullable(),
  gender: z.string().trim().max(20).optional().nullable(),
  is_locked: z.boolean().optional(),
});

/** Admin: update a customer's personal information (bypasses the one-time lock). */
export const adminUpdateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { id: data.userId, updated_at: new Date().toISOString() };
    if (data.full_name !== undefined) patch.full_name = data.full_name || null;
    if (data.phone !== undefined) patch.phone = data.phone || null;
    if (data.date_of_birth !== undefined) patch.date_of_birth = data.date_of_birth || null;
    if (data.gender !== undefined) patch.gender = data.gender || null;
    if (data.is_locked !== undefined) patch.is_locked = data.is_locked;
    const { error } = await supabaseAdmin.from("profiles").upsert(patch as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const pwdSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8).max(72),
});

/** Admin: set a customer's account password directly. */
export const adminSetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => pwdSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.newPassword,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


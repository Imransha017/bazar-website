import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const updateDropshipperMarketing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    facebook_pixel_id: z.string().optional().nullable(),
    google_analytics_id: z.string().optional().nullable(),
    custom_domain: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    const { error } = await supabase
      .from("dropshippers")
      .update({
        facebook_pixel_id: data.facebook_pixel_id,
        google_analytics_id: data.google_analytics_id,
        custom_domain: data.custom_domain,
        domain_status: data.custom_domain ? 'pending' : null
      })
      .eq("user_id", userId);

    if (error) throw error;
    return { ok: true };
  });

export const getProductMarketingAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: assets } = await supabase
      .from("product_marketing_assets")
      .select("*")
      .eq("product_id", data.productId);
    
    return assets || [];
  });

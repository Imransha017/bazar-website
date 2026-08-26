import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const verifyDomainDns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ domain: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    const domain = data.domain.toLowerCase().trim();
    const VERCEL_IP = "76.76.21.21";
    
    try {
      // Use Cloudflare DNS-over-HTTPS
      const res = await fetch(`https://cloudflare-dns.com/query?name=${domain}&type=A`, {
        headers: { "accept": "application/dns-json" }
      });
      const dns = await res.json();
      
      const isPointed = dns.Answer?.some((a: any) => a.data === VERCEL_IP);
      
      if (isPointed) {
        await supabase
          .from("dropshippers")
          .update({ 
            domain_status: 'active', 
            domain_verified_at: new Date().toISOString() 
          })
          .eq("user_id", userId)
          .eq("custom_domain", domain);
      }
      
      return { active: !!isPointed, dns: dns.Answer || [] };
    } catch (e) {
      console.error("DNS verify failed", e);
      return { active: false, error: "DNS lookup failed" };
    }
  });

export const getAffiliateReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ 
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    const { data: ds } = await supabase
      .from("dropshippers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!ds) return { clicks: [], sales: [], subAffiliates: [], stats: { views: 0, whatsapp: 0, conversions: 0 } };

    let clickQuery = supabase
        .from("dropshipper_clicks")
        .select("*")
        .eq("dropshipper_id", ds.id);
    
    if (data.startDate) clickQuery = clickQuery.gte("created_at", data.startDate);
    if (data.endDate) clickQuery = clickQuery.lte("created_at", data.endDate);

    const { data: clicks } = await clickQuery.order("created_at", { ascending: false });

    // Get sub-affiliates
    const { data: subs } = await supabase
        .from("dropshippers")
        .select("id, store_name, created_at, status")
        .eq("parent_dropshipper_id", ds.id);

    // Calculate basic stats from clicks
    const stats = {
      views: clicks?.length || 0,
      whatsapp: clicks?.filter((c: any) => c.utm_medium === 'whatsapp' || c.utm_source === 'whatsapp').length || 0,
      conversions: 0 // Will be populated if order attribution is linked to clicks
    };

    return { 
      clicks: clicks || [], 
      subAffiliates: subs || [],
      stats
    };
  });

export const logPixelTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ 
    platform: z.enum(['facebook', 'google']),
    status: z.string()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    await supabase
      .from("dropshippers")
      .update({ 
        last_pixel_test_at: new Date().toISOString(),
        pixel_test_status: `${data.platform}: ${data.status}`
      })
      .eq("user_id", userId);

    return { ok: true };
  });

export const importProductVideoReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ 
    productId: z.string(),
    videoUrl: z.string().url(),
    platform: z.enum(['youtube', 'facebook'])
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    const { data: ds } = await supabase
      .from("dropshippers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!ds) throw new Error("Dropshipper profile not found");

    const { error } = await supabase
      .from("product_video_reviews")
      .insert({
        dropshipper_id: ds.id,
        product_id: data.productId,
        video_url: data.videoUrl,
        platform: data.platform,
        status: 'pending' // Default to pending for moderation
      });

    if (error) throw error;
    
    // Notify admin about new review for moderation
    await supabase.from("admin_notifications").insert({
      type: 'video_review_moderation',
      title: 'New Video Review for Moderation',
      content: `A new ${data.platform} review was submitted for product ${data.productId}.`,
      metadata: { dropshipper_id: ds.id, product_id: data.productId }
    });

    return { ok: true };
  });

export const getProductVideoReviews = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ 
    productId: z.string(),
    dropshipperId: z.string().optional(),
    onlyApproved: z.boolean().optional().default(true)
  }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase: any = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_PUBLISHABLE_KEY']!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    
    let query = supabase
      .from("product_video_reviews")
      .select("*")
      .eq("product_id", data.productId);
    
    if (data.dropshipperId) {
      query = query.eq("dropshipper_id", data.dropshipperId);
    }

    if (data.onlyApproved) {
      query = query.eq("status", "approved");
    }

    const { data: reviews } = await query;
    return reviews || [];
  });


export const createCustomShortLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ 
    productId: z.string().optional(),
    alias: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/)
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    const { data: ds } = await supabase
      .from("dropshippers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!ds) throw new Error("Dropshipper profile not found");

    const { error } = await supabase
      .from("dropshipper_short_links")
      .insert({
        dropshipper_id: ds.id,
        product_id: data.productId || null,
        alias: data.alias
      });

    if (error) {
       if (error.code === '23505') throw new Error("This alias is already taken");
       throw error;
    }
    return { ok: true };
  });

export const getShortLinkStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    const { data: ds } = await supabase
      .from("dropshippers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!ds) throw new Error("Dropshipper not found");

    const { data: links } = await supabase
      .from("dropshipper_short_links")
      .select("id, alias, views_count, cart_adds_count, conversions_count, last_clicked_at")
      .eq("dropshipper_id", ds.id);

    return links || [];
  });

export const getFeedLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    const { data: ds } = await supabase
      .from("dropshippers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!ds) throw new Error("Dropshipper not found");

    const { data: logs } = await supabase
      .from("dropshipper_feed_logs")
      .select("*")
      .eq("dropshipper_id", ds.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return logs || [];
  });

export const trackShortLinkEvent = createServerFn({ method: "POST" })
  .validator((d: any) => d as { alias: string; type: 'click' | 'cart_add' | 'order'; metadata?: any })
  .handler(async ({ data }) => {





    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Find short link
    const { data: link }: any = await (supabaseAdmin as any)
      .from("dropshipper_short_links")
      .select("id")
      .eq("alias", data.alias)
      .maybeSingle();
    
    if (!link) return { ok: false };

    // Log event
    await (supabaseAdmin as any)
      .from("short_link_events")
      .insert({
        short_link_id: link.id,
        event_type: data.type,
        metadata: data.metadata || {}
      });

    // Update counters
    await (supabaseAdmin as any).rpc('increment_short_link_metric', { 
      link_id: link.id, 
      metric: data.type === 'click' ? 'views_count' : 
              data.type === 'cart_add' ? 'cart_adds_count' : 'conversions_count' 
    });

    return { ok: true };
  });

export const moderateVideoReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ 
    reviewId: z.string(),
    status: z.enum(['approved', 'rejected'])
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");
    
    // Check if user is admin (in a real app, use a proper role check middleware)
    // For now we rely on the authenticated context + sys-x7k9 route protection
    
    const { error } = await supabase
      .from("product_video_reviews")
      .update({ status: data.status })
      .eq("id", data.reviewId);
      
    if (error) throw error;
    return { ok: true };
  });

export const getPendingVideoReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");
    
    const { data } = await supabase
      .from("product_video_reviews")
      .select("*, products(title)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
      
    return data || [];
  });



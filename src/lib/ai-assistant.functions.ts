// src/lib/ai-assistant.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const askAssistant = createServerFn({ method: "POST" })
  .validator((data: unknown) => 
    z.object({
      message: z.string(),
      threadId: z.string().optional(),
      sessionId: z.string(),
      userId: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { handleAssistantQuery } = await import("./ai-assistant.server");
    return handleAssistantQuery(data.message, data.threadId, data.sessionId, data.userId);
  });

export const getChatHistory = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ threadId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: messages, error } = await (supabaseAdmin as any)
      .from("ai_chat_messages")
      .select("*")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    
    if (error) return [];
    return messages || [];
  });

export const getOrCreateThread = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ userId: z.string().optional() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.userId) {
      const { data: threads } = await (supabaseAdmin as any)
        .from("ai_chat_threads")
        .select("id")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (threads && threads.length > 0) return threads[0].id;
      
      const { data: newThread, error } = await (supabaseAdmin as any)
        .from("ai_chat_threads")
        .insert({ user_id: data.userId })
        .select("id")
        .single();
      
      if (error) throw error;
      return newThread.id;
    }
    
    const { data: newThread, error } = await (supabaseAdmin as any)
      .from("ai_chat_threads")
      .insert({})
      .select("id")
      .single();
    
    if (error) throw error;
    return newThread.id;
  });

export const getAIConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("ai_assistant_configs").select("*");
    if (error) return [];
    return data || [];
  });

export const updateAIConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string(), content: z.any() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("ai_assistant_configs")
      .upsert({ id: data.id, content: data.content, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { success: true };
  });

export const getAIAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("ai_assistant_analytics")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  });

/* ---------------- Assistant on/off settings ---------------- */

export const getAssistantSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any)
    .from("ai_assistant_configs")
    .select("content")
    .eq("id", "settings")
    .maybeSingle();
  const c = data?.content || {};
  return { enabled: c.enabled !== false, memory_only: c.memory_only !== false };
});

export const setAssistantSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ enabled: z.boolean(), memory_only: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("ai_assistant_configs").upsert({
      id: "settings",
      content: { enabled: data.enabled, memory_only: data.memory_only ?? true },
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true };
  });

/* ---------------- AI Memory files (admin only) ---------------- */

export const listMemoryFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("ai_memory_files")
      .select("id, file_name, mime_type, size_bytes, is_active, created_at, content, extraction_status, extraction_error, extracted_at")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data || []).map((f: any) => ({
      ...f,
      preview: String(f.content || "").slice(0, 400),
      chars: String(f.content || "").length,
      content: undefined,
    }));
  });

export const uploadMemoryFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        fileName: z.string().min(1),
        mimeType: z.string().optional(),
        sizeBytes: z.number().optional(),
        base64: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, extractText } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.length > 8 * 1024 * 1024) throw new Error("File too large (max 8MB)");

    const path = `${Date.now()}-${data.fileName.replace(/[^\w.\-]/g, "_")}`;
    const { error: upErr } = await admin.storage
      .from("ai-memory")
      .upload(path, bytes, { contentType: data.mimeType || "application/octet-stream", upsert: true });

    const extracted = extractText(bytes, data.fileName, data.mimeType);
    const status = upErr ? "failed" : extracted.status;
    const errMsg = upErr ? `স্টোরেজ আপলোড ব্যর্থ: ${upErr.message}` : extracted.error;

    const { data: row, error } = await admin
      .from("ai_memory_files")
      .insert({
        file_name: data.fileName,
        mime_type: data.mimeType || null,
        size_bytes: data.sizeBytes ?? bytes.length,
        storage_path: path,
        content: extracted.text,
        is_active: status !== "failed",
        extraction_status: status,
        extraction_error: errMsg,
        extracted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id, chars: extracted.text.length, status, error: errMsg };
  });

export const updateMemoryFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string(), content: z.string().optional(), is_active: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.content !== undefined) {
      patch.content = data.content;
      patch.extraction_status = data.content.trim().length > 0 ? "success" : "failed";
      patch.extraction_error = data.content.trim().length > 0 ? null : "কোনো টেক্সট নেই।";
      patch.extracted_at = new Date().toISOString();
    }
    if (data.is_active !== undefined) patch.is_active = data.is_active;
    const { error } = await (supabaseAdmin as any).from("ai_memory_files").update(patch).eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const getMemoryFileContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await (supabaseAdmin as any)
      .from("ai_memory_files")
      .select("content")
      .eq("id", data.id)
      .maybeSingle();
    return { content: row?.content || "" };
  });

export const deleteMemoryFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { data: row } = await admin.from("ai_memory_files").select("storage_path").eq("id", data.id).maybeSingle();
    if (row?.storage_path) await admin.storage.from("ai-memory").remove([row.storage_path]);
    const { error } = await admin.from("ai_memory_files").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

/* ---------------- AI model / API key settings ---------------- */

const MODEL_ID = "ai_model";

export const getAIModelSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("ai_assistant_configs")
      .select("content")
      .eq("id", MODEL_ID)
      .maybeSingle();
    const c = data?.content || {};
    const key = String(c.api_key || "");
    return {
      provider: c.provider || "lovable",
      model: c.model || "google/gemini-2.5-flash",
      base_url: c.base_url || "",
      temperature: typeof c.temperature === "number" ? c.temperature : 0.3,
      has_api_key: key.length > 0,
      api_key_masked: key ? `${key.slice(0, 4)}••••${key.slice(-4)}` : "",
      lovable_key_present: !!process.env["LOVABLE_API_KEY"],
    };
  });

export const setAIModelSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        provider: z.enum(["lovable", "custom"]),
        model: z.string().min(1),
        base_url: z.string().optional(),
        temperature: z.number().optional(),
        api_key: z.string().optional(), // empty string = keep existing
        clear_api_key: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { data: row } = await admin
      .from("ai_assistant_configs")
      .select("content")
      .eq("id", MODEL_ID)
      .maybeSingle();
    const prev = row?.content || {};
    const apiKey = data.clear_api_key ? "" : data.api_key && data.api_key.trim() ? data.api_key.trim() : prev.api_key || "";
    const { error } = await admin.from("ai_assistant_configs").upsert({
      id: MODEL_ID,
      content: {
        provider: data.provider,
        model: data.model,
        base_url: data.base_url || "",
        temperature: data.temperature ?? 0.3,
        api_key: apiKey,
      },
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    // Verify the saved settings actually work so admins get instant feedback.
    const { probeModel } = await import("./ai-model-probe.server");
    const test = await probeModel({
      provider: data.provider,
      model: data.model,
      base_url: data.base_url || "",
      api_key: apiKey,
    });
    return { success: true, has_api_key: apiKey.length > 0, test };
  });

export const testAIModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./ai-admin-guard.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { probeModel } = await import("./ai-model-probe.server");
    const { data } = await (supabaseAdmin as any)
      .from("ai_assistant_configs")
      .select("content")
      .eq("id", MODEL_ID)
      .maybeSingle();
    return probeModel(data?.content || {});
  });

/* ---------------- Image-based product search ---------------- */

export const askAssistantWithImage = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        image: z.string().min(20).max(8_000_000),
        note: z.string().max(500).optional(),
        threadId: z.string().optional(),
        sessionId: z.string(),
        userId: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { handleImageQuery } = await import("./ai-assistant.server");
    return handleImageQuery(data.image, data.note, data.threadId, data.sessionId, data.userId);
  });


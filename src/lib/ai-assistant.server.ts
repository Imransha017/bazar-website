/**
 * Securely handles AI queries by fetching trusted data from the database
 * and answering with Lovable AI grounded ONLY on that data.
 */

const DEFAULT_WHATSAPP = "8801759968476";
const DEFAULT_WHATSAPP_LINK = `https://wa.me/${DEFAULT_WHATSAPP}`;
const DEFAULT_ADMIN_FALLBACK = `দুঃখিত, এই বিষয়ে সঠিক তথ্য আমার কাছে নেই। 🙏\nঅনুগ্রহ করে সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন:\n📱 WhatsApp: 01759968476\n👉 ${DEFAULT_WHATSAPP_LINK}`;

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "what", "which", "about", "please", "can", "you",
  "আমি", "আমার", "এই", "একটি", "কি", "কোন", "করে", "করতে", "জন্য", "সম্পর্কে", "দাম", "চাই",
  "অর্ডার", "ডেলিভারি", "চার্জ", "কিভাবে", "করব", "পেমেন্ট", "পদ্ধতি",
]);

function keywords(q: string) {
  return q
    .replace(/[?।,.!]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 6);
}

async function callLovableAI(messages: any[], modelConfig?: any) {
  const cfg = modelConfig || {};
  const customKey = String(cfg.api_key || "").trim();
  const useCustom = cfg.provider === "custom" && customKey.length > 0;
  const apiKey = useCustom ? customKey : process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  const baseUrl = useCustom
    ? String(cfg.base_url || "https://api.openai.com/v1").replace(/\/+$/, "")
    : "https://ai.gateway.lovable.dev/v1";
  const model = String(cfg.model || "google/gemini-2.5-flash");
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        ...(useCustom
          ? { Authorization: `Bearer ${apiKey}` }
          : { "Lovable-API-Key": String(apiKey) }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        ...(typeof cfg.temperature === "number" ? { temperature: cfg.temperature } : {}),
      }),
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null) as { message?: string; error?: { message?: string } } | null;
      const message = errorBody?.message || errorBody?.error?.message || `AI request failed (${res.status})`;
      throw new Error(message);
    }
    const json: any = await res.json();
    return json?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e: any) {
    console.error("AI Assistant Error:", e);
    const fallback = {
      answer: "দুঃখিত, বর্তমানে আমার সিস্টেমে কিছু সমস্যা হচ্ছে। জরুরি প্রয়োজনে সরাসরি এডমিনের সাথে যোগাযোগ করুন।",
      links: [{ label: "যোগাযোগ করুন", url: `https://wa.me/${DEFAULT_WHATSAPP}`, variant: "success" }],
    };
    // Note: saveMessage is not available in callLovableAI scope
    return null; // Return null so the caller can handle it
  }
}

export async function handleAssistantQuery(message: string, threadId?: string, sessionId?: string, userId?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const query = message.toLowerCase();

  const { data: configs } = await admin.from("ai_assistant_configs").select("*");
  const configMap = (configs || []).reduce((acc: any, curr: any) => {
    acc[curr.id] = curr.content;
    return acc;
  }, {});
  const faqs = configMap["faq"] || [];
  const policies = configMap["policies"] || {};
  const rules = configMap["rules"] || {};
  const settings = configMap["settings"] || {};
  const contact = configMap["contact"] || {};

  const whatsappNum = contact.whatsapp || DEFAULT_WHATSAPP;
  const whatsappLink = `https://wa.me/${whatsappNum}`;
  const messengerLink = contact.messenger || "";
  const fbLink = contact.facebook || "";
  const contactLinks = [
    whatsappNum && { label: "WhatsApp", url: whatsappLink, variant: "success" as const },
    contact.messenger && { label: "Messenger", url: contact.messenger, variant: "primary" as const },
    contact.facebook && { label: "Facebook", url: contact.facebook, variant: "outline" as const },
  ].filter(Boolean) as { label: string; url: string; variant: "primary" | "outline" | "success" }[];

  const contactText = [
    whatsappNum && `📱 WhatsApp: ${whatsappNum}`,
    contact.imo && `📱 Imo: ${contact.imo}`,
    contact.mobile && `📞 Mobile: ${contact.mobile}`,
  ].filter(Boolean).join("\n");

  const adminFallback = `দুঃখিত, এই বিষয়ে সঠিক তথ্য আমার কাছে নেই। 🙏\nঅনুগ্রহ করে সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন:\n${contactText}`;


  if (settings.enabled === false) {
    return {
      answer: `দুঃখিত, এই মুহূর্তে AI Assistant বন্ধ আছে। 🙏\nসরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন:\n${contactText}\n👉 ${whatsappLink}`,
      disabled: true,
      products: [],
    };
  }

  // Admin-uploaded memory files (knowledge base)
  const { data: memoryRows } = await admin
    .from("ai_memory_files")
    .select("file_name, content")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  const memoryContext = (memoryRows || [])
    .map((m: any) => `--- FILE: ${m.file_name} ---\n${String(m.content || "").slice(0, 20000)}`)
    .join("\n\n")
    .slice(0, 60000);


  const logEvent = async (type: string, payload: any = {}) => {
    if (!sessionId) return;
    try {
      await admin.from("ai_assistant_analytics").insert({
        session_id: sessionId,
        event_type: type,
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
          source_check: "database_verified"
        },
        user_id: userId || null,
      });
    } catch (e) {
      console.error("Failed to log AI event:", e);
    }
  };

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!threadId) return;
    await admin.from("ai_chat_messages").insert({ thread_id: threadId, role, content });
  };

  await saveMessage("user", message);
  await logEvent("message_sent", { message });

  // 0. Conversational order flow (assistant can submit the order itself)
  {
    const { loadFlow, handleOrderFlow } = await import("./ai-order.server");
    const flow = await loadFlow(admin, threadId);
    const orderResponse = await handleOrderFlow({ admin, message, threadId, userId, flow });
    if (orderResponse) {
      await saveMessage("assistant", orderResponse.answer);
      await logEvent("order_flow", { stage: flow?.stage || "start" });
      return {
        answer: orderResponse.answer,
        products: orderResponse.products || [],
        links: orderResponse.links || [],
        actions: orderResponse.actions || [],
      };
    }
  }

  // 1. Order tracking (deterministic, never AI-generated)
  const orderMatch = query.match(/(order|অর্ডার|status|অবস্থা)\s*#?([a-z0-9-]+)/i);
  if (orderMatch || query.includes("track") || query.includes("ট্র্যাক")) {
    const orderNumber = orderMatch ? orderMatch[2] : null;
    let orderQuery = admin.from("orders").select("id, order_number, status, total, created_at");

    if (orderNumber) {
      orderQuery = orderQuery.eq("order_number", orderNumber);
    } else if (userId) {
      orderQuery = orderQuery.eq("user_id", userId).order("created_at", { ascending: false }).limit(1);
    } else {
      const response = { answer: "আপনার অর্ডার ট্র্যাক করতে অনুগ্রহ করে অর্ডার নম্বরটি দিন অথবা লগইন করুন।" };
      await saveMessage("assistant", response.answer);
      return response;
    }

    const { data: orderData } = await orderQuery.maybeSingle();
    if (orderData) {
      const response = {
        answer: `আপনার অর্ডার #${orderData.order_number} এর বর্তমান অবস্থা: **${String(orderData.status).toUpperCase()}**।\nমোট: ৳${Number(orderData.total).toLocaleString("en-BD")}\nঅর্ডারের তারিখ: ${new Date(orderData.created_at).toLocaleDateString()}`,
        links: [{ label: "🚚 অর্ডারের বিস্তারিত দেখুন", url: `/order/${orderData.id}`, variant: "primary" as const }],
      };
      await saveMessage("assistant", response.answer);
      await logEvent("order_lookup", { order_number: orderData.order_number, status: orderData.status });
      return response;
    }
    const response = { answer: `দুঃখিত, এই অর্ডার নম্বরটি খুঁজে পাওয়া যায়নি।\nসাহায্যের জন্য অ্যাডমিন: ${whatsappLink}` };
    await saveMessage("assistant", response.answer);
    return response;
  }

  // Common delivery and payment questions are answered deterministically from
  // trusted admin configuration, so a temporary AI outage never hides known facts.
  const asksDelivery = /(ডেলিভারি|delivery|শিপিং|shipping)/i.test(message);
  const asksCharge = /(চার্জ|charge|খরচ|cost|fee)/i.test(message);
  const asksPayment = /(পেমেন্ট|payment|cod|ক্যাশ অন ডেলিভারি|টাকা)/i.test(message);
  // First check if memory context has info about these topics, if not fallback to deterministic logic
  const hasMemoryInfo = memoryRows && memoryRows.length > 0;
  
  if (asksDelivery || asksPayment) {
    // We no longer use deterministic logic here to ensure the assistant only answers 
    // from memory files or products as requested.
    // If memoryRows is empty, it will proceed to AI which will return NO_DATA if not in context.
  }

  // 2. Gather trusted product context (automatic for every product in catalog)
  const productFields = `id, name, slug, price, original_price, discount_percent, description, short_description,
    specifications, brand, sku, category_name, subcategory_name, option_name, tags, image, images, stock,
    warranty, return_days, weight, cod_available, free_shipping, sizes, colors, variants, rating, sold_count, video_url`;

  const terms = keywords(message);
  let matched: any[] = [];

  if (terms.length > 0) {
    const orConditions = terms
      .map((t) => `name.ilike.%${t}%,description.ilike.%${t}%,short_description.ilike.%${t}%,brand.ilike.%${t}%,category_name.ilike.%${t}%,subcategory_name.ilike.%${t}%,option_name.ilike.%${t}%,sku.ilike.%${t}%`)
      .join(",");
    const { data } = await admin
      .from("products")
      .select(productFields)
      .eq("is_active", true)
      .or(orConditions)
      .limit(12);
    matched = data || [];
  }

  // budget filter (e.g. "১৫০০ টাকার মধ্যে")
  const priceMatch = message.match(/(\d{2,7})\s*(taka|tk|৳|টাকা)/i);
  const budget = priceMatch ? parseInt(priceMatch[1], 10) : null;
  if (budget) {
    const { data } = await admin
      .from("products")
      .select(productFields)
      .eq("is_active", true)
      .lte("price", budget)
      .order("sold_count", { ascending: false })
      .limit(8);
    matched = [...matched, ...(data || [])];
  }

  if (matched.length === 0) {
    const { data } = await admin
      .from("products")
      .select(productFields)
      .eq("is_active", true)
      .order("sold_count", { ascending: false })
      .limit(10);
    matched = data || [];
  }

  // dedupe
  const seen = new Set<string>();
  const products = matched.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true))).slice(0, 12);

  const catalogContext = products
    .map((p) =>
      JSON.stringify({
        name: p.name,
        price: p.price,
        original_price: p.original_price,
        discount_percent: p.discount_percent,
        brand: p.brand,
        sku: p.sku,
        category: [p.category_name, p.subcategory_name, p.option_name].filter(Boolean).join(" > "),
        stock: p.stock,
        description: (p.description || p.short_description || "").slice(0, 900),
        specifications: p.specifications,
        sizes: p.sizes,
        colors: p.colors,
        variants: p.variants,
        warranty: p.warranty,
        return_days: p.return_days,
        weight: p.weight,
        cod_available: p.cod_available,
        free_shipping: p.free_shipping,
        rating: p.rating,
        sold_count: p.sold_count,
        link: `/product/${p.slug || p.id}`,
      }),
    )
    .join("\n");

  const systemPrompt = `তুমি "Bazar AI Assistant" — একটি বাংলাদেশি ই-কমার্স ওয়েবসাইটের অত্যন্ত দক্ষ এবং প্রঅ্যাকটিভ শপিং সহকারী।

কঠোর নিয়ম এবং আচরণবিধি:
1. ইউজার যে ভাষায় কথা বলবে (বাংলা বা ইংরেজি), তুমিও সেই একই ভাষায় উত্তর দিবে।
2. শুধুমাত্র নিচে দেওয়া MEMORY FILES এবং CATALOG DATA তথ্য ব্যবহার করে উত্তর দিবে। বাইরের কোনো জ্ঞান ব্যবহার করবে না। তথ্যের অভাব থাকলে "NO_DATA" বলবে।
3. **প্রোডাক্ট খোঁজা (Product Search):** যখন ইউজার প্রোডাক্ট খুঁজতে চাইবে, সরাসরি লিস্ট না দেখিয়ে প্রথমে তাদের চাহিদা বুঝতে প্রঅ্যাকটিভ প্রশ্ন করবে (যেমন: বাজেট কত, কি ধরণের বৈশিষ্ট্য খুঁজছেন)। 
   - আমাদের প্রধান ক্যাটাগরিগুলো হলো: ${Array.from(seen).length > 0 ? Array.from(seen).join(", ") : "Men's Fashion, Women's Fashion"} ইত্যাদি।
   - ইউজারকে ক্যাটাগরি বা সাব-ক্যাটাগরি সিলেক্ট করতে বলবে যদি তাদের সার্চ খুব সাধারণ হয়।
   - যদি সার্চে কোনো মিল না পাওয়া যায়, তবে "Category not found" না বলে প্রাসঙ্গিক বিকল্প বা জনপ্রিয় আইটেম সাজেস্ট করবে।
4. **কমিউনিকেশন:** তুমি নিজে থেকে কাস্টমারের সাথে কথা বলবে এবং তাদের সমস্যার সমাধান দিতে চাইবে। তবে সবসময় প্রোডাক্ট ডাটাবেজ এবং মেমোরি ফাইলের সীমার মধ্যে থাকবে।
5. **অর্ডার:** তুমি কাস্টমারের হয়ে অর্ডার সাবমিট করতে পারো। প্রোডাক্ট, পরিমাণ, ডেলিভারি লোকেশন এবং টাইমলাইন ধাপে ধাপে সংগ্রহ করবে।
6. **লিংক:** সব সময় সঠিক প্রোডাক্ট লিংক (যেমন: /product/slug) প্রদান করবে যাতে ইউজার বিস্তারিত দেখতে পারে। লিঙ্কগুলি অবশ্যই /product/[slug] অথবা /product/[id] ফরম্যাটে হবে।

MEMORY FILES:
${memoryContext || "(কোনো মেমোরি ফাইল নেই)"}

CATALOG DATA:
${catalogContext || "(কোনো প্রোডাক্ট নেই)"}

Current query: ${message}`;


  let answer = await callLovableAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    configMap["ai_model"] || {},
  ).catch(() => null);

  if (answer === null) {
    await saveMessage("assistant", adminFallback);
    return {
      answer: adminFallback,
      links: contactLinks.length > 0 ? contactLinks : [{ label: "যোগাযোগ করুন", url: whatsappLink, variant: "success" }],
      products: [],
    };
  }

  const isInternal = /(ডেলিভারি|চার্জ|অর্ডার|কিভাবে|পদ্ধতি|পেমেন্ট|খুঁজুন|জানুন|চাই)/i.test(query);
  if (!answer || answer.includes("NO_DATA") || (answer.length < 5 && !isInternal)) {
    // If it's a specific button intent but the AI failed or returned NO_DATA, we try to be helpful
    if (query.includes("প্রোডাক্ট খুঁজুন")) {
        answer = "অবশ্যই! আমি আপনাকে সেরা প্রোডাক্টটি খুঁজে পেতে সাহায্য করতে পারি। আপনি কি ধরণের প্রোডাক্ট খুঁজছেন? আমাদের কাছে ফ্যাশন, ইলেকট্রনিক্স এবং আরও অনেক কিছু আছে। আপনার কি বিশেষ কোনো ব্র্যান্ড বা বাজেট পছন্দ আছে?";
    } else if (query.includes("প্রোডাক্ট সম্পর্কে জানুন")) {
        answer = "আপনি আমাদের যেকোনো প্রোডাক্টের গুণমান, বৈশিষ্ট্য বা স্থায়িত্ব সম্পর্কে প্রশ্ন করতে পারেন। আপনি কোন প্রোডাক্টটি সম্পর্কে জানতে চাচ্ছেন?";
    } else if (query.includes("অর্ডার করতে চাই")) {
        // Handled by handleOrderFlow, but if it reaches here:
        answer = "আমি আপনার জন্য অর্ডারটি করে দিতে পারি। আপনি কোন প্রোডাক্টটি কিনতে চাচ্ছেন এবং কতটি নিতে চান সেটি বলুন।";
    } else if (query.includes("ডেলিভারি সম্পর্কে জানুন")) {
        answer = "আমাদের ডেলিভারি চার্জ সাধারণত ৬০ টাকা। আমরা সারা বাংলাদেশে ক্যাশ অন ডেলিভারি দিয়ে থাকি। আপনার জেলা এবং থানার নাম বললে আমি আরও বিস্তারিত জানাতে পারব।";
    } else {
        const faqMatch = faqs.find(
          (f: any) =>
            f?.question &&
            (query.includes(String(f.question).toLowerCase()) ||
              String(f.question).toLowerCase().split(" ").some((w: string) => w.length > 3 && query.includes(w))),
        );
        if (faqMatch) {
          answer = faqMatch.answer;
        } else {
      // If no FAQ match, suggest top products as a helpful alternative
      const { data: topProducts } = await admin
        .from("products")
        .select(productFields)
        .eq("is_active", true)
        .order("sold_count", { ascending: false })
        .limit(4);

      const suggestions = topProducts || [];
      
      await saveMessage("assistant", "দুঃখিত, আমি আপনার প্রশ্নের সঠিক উত্তর খুঁজে পাচ্ছি না। তবে আমাদের কিছু জনপ্রিয় প্রোডাক্ট নিচে দেওয়া হলো যা আপনি দেখতে পারেন। অথবা সরাসরি এডমিনের সাথে যোগাযোগ করুন।");
      return {
        answer: "দুঃখিত, আমি আপনার প্রশ্নের সঠিক উত্তর খুঁজে পাচ্ছি না। তবে আমাদের কিছু জনপ্রিয় প্রোডাক্ট নিচে দেওয়া হলো যা আপনি দেখতে পারেন। অথবা সরাসরি এডমিনের সাথে যোগাযোগ করুন।",
        links: contactLinks.length > 0 ? contactLinks : [{ label: "যোগাযোগ করুন", url: whatsappLink, variant: "success" }],
        products: suggestions.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          original_price: p.original_price,
          discount_percent: p.discount_percent,
          image: p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null),
          link: p.slug ? `/p/${p.slug}` : `/product/${p.id}`,
          description: p.short_description
        })),
      };
    }
  }
  }

  const relevant = products
    .filter((p) => answer!.toLowerCase().includes(String(p.name).toLowerCase().slice(0, 12)))
    .slice(0, rules.product_recommendation_limit || 4);

  await saveMessage("assistant", answer);
  await logEvent("ai_answer", { query: message, products: relevant.length });

  return {
    answer,
    products: relevant.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      original_price: p.original_price,
      discount_percent: p.discount_percent,
      image: p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null),
      slug: p.slug, // Ensure slug is passed for linking
      stock: p.stock,
      description: p.short_description || (p.description ? p.description.slice(0, 60) + "..." : ""),
      link: p.slug ? `/p/${p.slug}` : `/product/${p.id}`,
    })),
  };
}

/**
 * Image-based product search: the customer uploads a photo, a vision model
 * reads it, and we search the trusted catalog with the extracted keywords.
 */
export async function handleImageQuery(
  imageDataUrl: string,
  note?: string,
  threadId?: string,
  sessionId?: string,
  userId?: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;

  const { data: configs } = await admin.from("ai_assistant_configs").select("*");
  const configMap = (configs || []).reduce((acc: any, curr: any) => {
    acc[curr.id] = curr.content;
    return acc;
  }, {});
  const settings = configMap["settings"] || {};
  const contact = configMap["contact"] || {};
  const whatsappNum = contact.whatsapp || DEFAULT_WHATSAPP;
  const whatsappLink = `https://wa.me/${whatsappNum}`;

  const contactLinks = [
    whatsappNum && { label: "WhatsApp", url: whatsappLink, variant: "success" as const },
    contact.messenger && { label: "Messenger", url: contact.messenger, variant: "primary" as const },
    contact.facebook && { label: "Facebook", url: contact.facebook, variant: "outline" as const },
  ].filter(Boolean) as { label: string; url: string; variant: "primary" | "outline" | "success" }[];

  const contactText = [
    whatsappNum && `📱 WhatsApp: ${whatsappNum}`,
    contact.imo && `📱 Imo: ${contact.imo}`,
    contact.mobile && `📞 Mobile: ${contact.mobile}`,
  ].filter(Boolean).join("\n");


  if (settings.enabled === false) {
    return { answer: `দুঃখিত, এই মুহূর্তে AI Assistant বন্ধ আছে। 🙏\n👉 ${whatsappLink}`, products: [] };
  }

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!threadId) return;
    await admin.from("ai_chat_messages").insert({ thread_id: threadId, role, content });
  };
  const logEvent = async (type: string, payload: any = {}) => {
    if (!sessionId) return;
    await admin.from("ai_assistant_analytics").insert({
      session_id: sessionId,
      event_type: type,
      payload,
      user_id: userId || null,
    });
  };

  await saveMessage("user", `🖼️ [ছবি আপলোড]${note ? " — " + note : ""}`);
  await logEvent("image_search", { note: note || null });

  const vision = await callLovableAI(
    [
      {
        role: "system",
        content:
          "You identify products in photos for a Bangladeshi e-commerce store. Reply with ONLY a JSON object: " +
          '{"keywords":["..."],"description":"short description in Bengali"}. ' +
          "keywords: 3-8 short English search terms (product type, brand, model, color, visible text).",
      },
      {
        role: "user",
        content: [
          { type: "text", text: note ? `Customer note: ${note}` : "Identify this product." },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    configMap["ai_model"] || {},
  ).catch(() => null);

  if (vision === null) {
    const answer = "দুঃখিত, ছবিটি প্রসেস করা যাচ্ছে না। দয়া করে এডমিনের সাথে যোগাযোগ করুন।";
    await saveMessage("assistant", answer);
    return {
      answer,
      links: [{ label: "যোগাযোগ করুন", url: whatsappLink, variant: "success" }],
      products: [],
    };
  }

  let terms: string[] = [];
  let description = "";
  if (vision) {
    try {
      const jsonText = vision.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText.slice(jsonText.indexOf("{"), jsonText.lastIndexOf("}") + 1));
      terms = (parsed.keywords || []).map((t: string) => String(t).trim()).filter(Boolean).slice(0, 8);
      description = String(parsed.description || "");
    } catch {
      terms = vision.split(/[\s,]+/).filter((w: string) => w.length > 2).slice(0, 6);
    }
  }

  if (terms.length === 0) {
    const answer = `দুঃখিত, ছবিটি থেকে প্রোডাক্টটি চিনতে পারলাম না। 🙏\nঅনুগ্রহ করে প্রোডাক্টের নাম লিখুন অথবা অ্যাডমিনের সাথে যোগাযোগ করুন:\n👉 ${whatsappLink}`;
    await saveMessage("assistant", answer);
    return { answer, whatsapp: whatsappLink, products: [] };
  }

  const orConditions = terms
    .map(
      (t) =>
        `name.ilike.%${t}%,description.ilike.%${t}%,short_description.ilike.%${t}%,brand.ilike.%${t}%,category_name.ilike.%${t}%,subcategory_name.ilike.%${t}%,option_name.ilike.%${t}%,tags.cs.{${t}}`,
    )
    .join(",");

  const { data: found } = await admin
    .from("products")
    .select("id, name, price, image, images, stock")
    .eq("is_active", true)
    .or(orConditions)
    .order("sold_count", { ascending: false })
    .limit(6);

  const products = (found || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    original_price: p.original_price,
    discount_percent: p.discount_percent,
    image: p.image || (Array.isArray(p.images) ? p.images[0] : null),
    stock: p.stock,
    description: p.short_description || (p.description ? p.description.slice(0, 60) + "..." : ""),
    link: p.id ? `/product/${p.slug || p.id}` : null,
  }));

  if (products.length === 0) {
    const answer =
      `🔍 ছবিতে যা দেখলাম: ${description || terms.join(", ")}\n\n` +
      `দুঃখিত, এই মুহূর্তে আমাদের ক্যাটালগে এর সাথে মিলে এমন প্রোডাক্ট পাইনি। 🙏\n` +
      `সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন:\n${contactText}`;
    await saveMessage("assistant", answer);
    await logEvent("image_search_no_match", { terms });
    return { 
      answer, 
      links: contactLinks.length > 0 ? contactLinks : [{ label: "যোগাযোগ করুন", url: whatsappLink, variant: "success" }],
      products: [] 
    };
  }

  const answer =
    `🔍 ছবিতে যা দেখলাম: ${description || terms.join(", ")}\n\n` +
    `আমাদের ক্যাটালগে মিলে যাওয়া প্রোডাক্ট (${products.length}টি) নিচে দেখুন 👇`;

  await saveMessage("assistant", answer);
  await logEvent("image_search_match", { terms, count: products.length });

  return {
    answer,
    products,
    links: [{ label: "🛒 প্রথম প্রোডাক্টটি দেখুন", url: `/product/${products[0].slug || products[0].id}`, variant: "primary" as const }],
  };
}

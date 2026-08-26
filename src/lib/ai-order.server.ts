/**
 * Conversational order-taking flow for the Bazar AI Assistant.
 * State is persisted on ai_chat_threads.metadata so the assistant can
 * collect customer details step-by-step and submit the order itself.
 */

const DELIVERY_FEE = 60;
const WHATSAPP_LINK = "https://wa.me/8801759968476";

type Stage = "offer_help" | "name" | "phone" | "district" | "thana" | "address" | "qty" | "confirm" | null;

export type OrderFlowState = {
  stage: Stage;
  product?: { id: string; name: string; price: number; image: string | null; stock: number | null };
  data?: {
    name?: string;
    phone?: string;
    district?: string;
    thana?: string;
    address?: string;
    qty?: number;
  };
};

export type OrderFlowResponse = {
  answer: string;
  products?: any[];
  /** Clickable link buttons (open a page) */
  links?: { label: string; url: string; variant?: "primary" | "outline" | "success" }[];
  /** Quick-reply chips (send text back to the assistant) */
  actions?: { label: string; send: string }[];
};

export function isOrderIntent(msg: string) {
  const q = msg.toLowerCase();
  if (/(ট্র্যাক|track|status|অবস্থা|কোথায়|জানতে চাই|#)/i.test(q)) return false;
  return /(অর্ডার|কিনতে|কিনব|কিনবো|ক্রয়|order|buy|purchase|নিতে চাই)/i.test(q);
}

export function isHelpYes(msg: string) {
  const q = msg.trim().toLowerCase();
  return /(হ্যাঁ|হা|হ্যা|জি|সাহায্য|help|yes|ok|আপনি করে দিন|করে দিন|আপনি করুন|please)/i.test(q);
}

function isCancel(msg: string) {
  return /(বাতিল|cancel|থাক|না করব|stop)/i.test(msg.trim().toLowerCase());
}

/** "নাম পরিবর্তন", "edit phone", "ঠিকানা ঠিক করব" ... */
function editTarget(msg: string): Stage | null {
  const q = msg.trim().toLowerCase();
  if (!/(পরিবর্তন|ঠিক কর|edit|change|ভুল|সংশোধন|আবার)/i.test(q)) return null;
  if (/(নাম|name)/i.test(q)) return "name";
  if (/(ফোন|মোবাইল|নম্বর|number|phone)/i.test(q)) return "phone";
  if (/(জেলা|district)/i.test(q)) return "district";
  if (/(থানা|উপজেলা|thana)/i.test(q)) return "thana";
  if (/(ঠিকানা|address)/i.test(q)) return "address";
  if (/(পরিমাণ|কয়টি|qty|quantity)/i.test(q)) return "qty";
  return null;
}

const PROMPTS: Record<Exclude<Stage, null | "offer_help" | "confirm">, string> = {
  name: "✍️ অর্ডারটি শুরু করতে আপনার **পুরো নাম** লিখুন:",
  phone: "📱 এবার আপনার **মোবাইল নম্বর** দিন (উদা: 01712345678):",
  district: "🏙️ আপনার **জেলা** (District) লিখুন:",
  thana: "🏘️ আপনার **থানা / উপজেলা** লিখুন:",
  address: "📍 আপনার **সম্পূর্ণ ঠিকানা** লিখুন (বাসা/রোড/এলাকা):",
  qty: "🔢 কতটি (**পরিমাণ**) নিতে চান? সংখ্যা লিখুন (উদা: 1):",
};

const CANCEL_ACTION = { label: "❌ বাতিল করুন", send: "বাতিল" };

export async function loadFlow(admin: any, threadId?: string): Promise<OrderFlowState | null> {
  if (!threadId) return null;
  const { data } = await admin.from("ai_chat_threads").select("metadata").eq("id", threadId).maybeSingle();
  return (data?.metadata?.order_flow as OrderFlowState) || null;
}

export async function saveFlow(admin: any, threadId: string | undefined, flow: OrderFlowState | null) {
  if (!threadId) return;
  const { data } = await admin.from("ai_chat_threads").select("metadata").eq("id", threadId).maybeSingle();
  const metadata = { ...(data?.metadata || {}), order_flow: flow };
  await admin.from("ai_chat_threads").update({ metadata }).eq("id", threadId);
}

export async function findProductForOrder(admin: any, message: string) {
  const terms = message
    .replace(/[?।,.!]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6);
  if (terms.length === 0) return null;
  const or = terms
    .map((t) => `name.ilike.%${t}%,brand.ilike.%${t}%,sku.ilike.%${t}%,category_name.ilike.%${t}%,subcategory_name.ilike.%${t}%`)
    .join(",");
  const { data } = await admin
    .from("products")
    .select("id, name, price, image, images, stock, slug")
    .eq("is_active", true)
    .or(or)
    .order("sold_count", { ascending: false })
    .limit(1);
  const p = data?.[0];
  if (!p) return null;
  return {
    id: p.id as string,
    name: p.name as string,
    price: Number(p.price),
    image: (p.image || (Array.isArray(p.images) ? p.images[0] : null)) as string | null,
    stock: p.stock as number | null,
  };
}

function productCard(p: NonNullable<OrderFlowState["product"]>) {
  return [{ id: p.id, name: p.name, price: p.price, image: p.image, stock: p.stock }];
}

function summary(flow: OrderFlowState) {
  const p = flow.product;
  const d = flow.data || {};
  const qty = d.qty || 1;
  const sub = (p?.price || 0) * qty;
  return (
    `📝 **অর্ডার সারাংশ** — সাবমিট করার আগে মিলিয়ে দেখুন:\n\n` +
    `🛍️ প্রোডাক্ট: ${p?.name}\n` +
    `🔢 পরিমাণ: ${qty}\n` +
    `👤 নাম: ${d.name}\n` +
    `📱 ফোন: ${d.phone}\n` +
    `📍 ঠিকানা: ${d.address}, ${d.thana}, ${d.district}\n\n` +
    `💵 সাবটোটাল: ৳${sub.toLocaleString("en-BD")}\n` +
    `🚚 ডেলিভারি চার্জ: ৳${DELIVERY_FEE}\n` +
    `✅ সর্বমোট (ক্যাশ অন ডেলিভারি): ৳${(sub + DELIVERY_FEE).toLocaleString("en-BD")}\n\n` +
    `সব ঠিক থাকলে **Confirm** বাটনে চাপুন। কোনো তথ্য ভুল হলে নিচের বাটন দিয়ে ঠিক করে নিন।`
  );
}

const EDIT_ACTIONS = [
  { label: "✏️ নাম পরিবর্তন", send: "নাম পরিবর্তন" },
  { label: "✏️ ফোন পরিবর্তন", send: "ফোন পরিবর্তন" },
  { label: "✏️ জেলা পরিবর্তন", send: "জেলা পরিবর্তন" },
  { label: "✏️ থানা পরিবর্তন", send: "থানা পরিবর্তন" },
  { label: "✏️ ঠিকানা পরিবর্তন", send: "ঠিকানা পরিবর্তন" },
  { label: "✏️ পরিমাণ পরিবর্তন", send: "পরিমাণ পরিবর্তন" },
];

/**
 * Returns a response when the message belongs to the order flow, otherwise null.
 */
export async function handleOrderFlow(opts: {
  admin: any;
  message: string;
  threadId?: string;
  userId?: string;
  flow: OrderFlowState | null;
}): Promise<OrderFlowResponse | null> {
  const { admin, message, threadId, userId, flow } = opts;
  const text = message.trim();

  // Active flow handling
  if (flow?.stage) {
    if (isCancel(text)) {
      await saveFlow(admin, threadId, null);
      return { answer: "ঠিক আছে, অর্ডারটি বাতিল করা হলো। আর কিছু জানতে চাইলে বলুন। 🙂" };
    }

    const data = { ...(flow.data || {}) };
    const product = flow.product;

    // Allow correcting any previously-entered field at any point
    const target = editTarget(text);
    if (target && flow.stage !== "offer_help") {
      await saveFlow(admin, threadId, { ...flow, stage: target, data });
      return { answer: PROMPTS[target as keyof typeof PROMPTS], actions: [CANCEL_ACTION] };
    }

    /** After a correction, jump straight back to the summary if everything is filled */
    const nextAfter = (current: Exclude<Stage, null>): Stage => {
      const order: Stage[] = ["name", "phone", "district", "thana", "address", "qty", "confirm"];
      const complete = data.name && data.phone && data.district && data.thana && data.address && data.qty;
      if (complete) return "confirm";
      return order[order.indexOf(current) + 1] || "confirm";
    };

    const advance = async (current: Exclude<Stage, null>) => {
      const next = nextAfter(current);
      await saveFlow(admin, threadId, { ...flow, stage: next, data });
      if (next === "confirm") {
        return {
          answer: summary({ ...flow, data }),
          products: product ? productCard(product) : [],
          actions: [{ label: "✅ Confirm — অর্ডার করুন", send: "হ্যাঁ, কনফার্ম" }, ...EDIT_ACTIONS, CANCEL_ACTION],
        } as OrderFlowResponse;
      }
      return { answer: PROMPTS[next as keyof typeof PROMPTS], actions: [CANCEL_ACTION] } as OrderFlowResponse;
    };

    switch (flow.stage) {
      case "offer_help": {
        if (isHelpYes(text)) {
          await saveFlow(admin, threadId, { ...flow, stage: "name" });
          return {
            answer: "দারুণ! আমি আপনার হয়ে অর্ডারটি করে দিচ্ছি। 🙂\n\n" + PROMPTS.name,
            actions: [CANCEL_ACTION],
          };
        }
        // not a help request — let normal AI answer
        await saveFlow(admin, threadId, null);
        return null;
      }
      case "name": {
        if (text.length < 2 || text.length > 80 || /^\d+$/.test(text)) {
          return { answer: "⚠️ নামটি সঠিক মনে হচ্ছে না। অনুগ্রহ করে আপনার পুরো নাম লিখুন:", actions: [CANCEL_ACTION] };
        }
        data.name = text;
        return advance("name");
      }
      case "phone": {
        const digits = text.replace(/\D/g, "");
        if (!/^(01\d{9}|8801\d{9})$/.test(digits)) {
          return {
            answer: "⚠️ নম্বরটি সঠিক নয়। অনুগ্রহ করে ১১ ডিজিটের মোবাইল নম্বর দিন (উদা: 01712345678):",
            actions: [CANCEL_ACTION],
          };
        }
        data.phone = digits.startsWith("880") ? "0" + digits.slice(3) : digits;
        return advance("phone");
      }
      case "district": {
        if (text.length < 3 || text.length > 40) {
          return { answer: "⚠️ জেলার নামটি সঠিকভাবে লিখুন (উদা: ঢাকা):", actions: [CANCEL_ACTION] };
        }
        data.district = text;
        return advance("district");
      }
      case "thana": {
        if (text.length < 3 || text.length > 40) {
          return { answer: "⚠️ থানা/উপজেলার নামটি সঠিকভাবে লিখুন (উদা: মিরপুর):", actions: [CANCEL_ACTION] };
        }
        data.thana = text;
        return advance("thana");
      }
      case "address": {
        if (text.length < 8) {
          return { answer: "⚠️ ঠিকানাটি একটু বিস্তারিত লিখুন (বাসা/রোড/এলাকা):", actions: [CANCEL_ACTION] };
        }
        data.address = text.slice(0, 300);
        return advance("address");
      }
      case "qty": {
        const qty = parseInt(text.replace(/\D/g, ""), 10);
        if (!qty || qty < 1 || qty > 50) {
          return { answer: "⚠️ অনুগ্রহ করে ১ থেকে ৫০ এর মধ্যে একটি সংখ্যা লিখুন (উদা: 1):", actions: [CANCEL_ACTION] };
        }
        if (product?.stock != null && qty > product.stock) {
          return {
            answer: `⚠️ দুঃখিত, বর্তমানে স্টকে আছে ${product.stock} টি। অনুগ্রহ করে কম পরিমাণ লিখুন:`,
            actions: [CANCEL_ACTION],
          };
        }
        data.qty = qty;
        return advance("qty");
      }
      case "confirm": {
        if (!/(হ্যাঁ|হা|হ্যা|জি|confirm|yes|ok|নিশ্চিত)/i.test(text)) {
          return {
            answer: "অর্ডার সাবমিট করতে **Confirm** বাটনে চাপুন, অথবা কোনো তথ্য ঠিক করতে নিচের বাটনগুলো ব্যবহার করুন।",
            actions: [{ label: "✅ Confirm — অর্ডার করুন", send: "হ্যাঁ, কনফার্ম" }, ...EDIT_ACTIONS, CANCEL_ACTION],
          };
        }
        if (!product) {
          await saveFlow(admin, threadId, null);
          return { answer: "দুঃখিত, প্রোডাক্টের তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।" };
        }
        const qty = data.qty || 1;
        const subtotal = product.price * qty;
        const total = subtotal + DELIVERY_FEE;
        const payload = {
          customer_name: data.name,
          customer_phone: data.phone,
          address: data.address,
          district: data.district,
          thana: data.thana,
          delivery_fee: DELIVERY_FEE,
          total,
          payment_method: "cod",
          notes: userId ? "AI Assistant order" : "AI Assistant order (guest)",
          items: [
            { product_id: product.id, name: product.name, price: product.price, qty, image: product.image },
          ],
        };
        const { data: result, error } = await admin.rpc("place_order", { _payload: payload });
        await saveFlow(admin, threadId, null);
        if (error) {
          return {
            answer:
              `দুঃখিত, অর্ডারটি সম্পন্ন করা যায়নি (${error.message}).\n` +
              `অনুগ্রহ করে WhatsApp-এ অ্যাডমিনের সাথে যোগাযোগ করুন।`,
            links: [{ label: "💬 WhatsApp-এ যোগাযোগ", url: WHATSAPP_LINK, variant: "success" }],
          };
        }
        const orderId = (result as any).id as string;
        const orderNumber = (result as any).order_number as string;

        // Mark this order as placed by the Bazar AI Assistant on behalf of the customer
        await admin
          .from("orders")
          .update({
            source: "ai_assistant",
            ai_thread_id: threadId || null,
            ...(userId ? { user_id: userId } : {}),
          })
          .eq("id", orderId);

        // Persist chat context + notify admin panel
        let chatContext: any[] = [];
        if (threadId) {
          const { data: msgs } = await admin
            .from("ai_chat_messages")
            .select("role, content, created_at")
            .eq("thread_id", threadId)
            .order("created_at", { ascending: false })
            .limit(30);
          chatContext = (msgs || []).reverse();

          const { data: t } = await admin.from("ai_chat_threads").select("metadata").eq("id", threadId).maybeSingle();
          await admin
            .from("ai_chat_threads")
            .update({
              metadata: {
                ...(t?.metadata || {}),
                order_flow: null,
                last_order: { id: orderId, order_number: orderNumber, total, placed_at: new Date().toISOString() },
              },
            })
            .eq("id", threadId);
        }

        await admin.from("admin_notifications").insert({
          type: "order",
          title: `🤖 নতুন COD অর্ডার (AI Assistant) — ${orderNumber}`,
          message: `${data.name} (${data.phone}) — ${product.name} × ${qty} — ৳${total.toLocaleString("en-BD")}`,
          content: `ঠিকানা: ${data.address}, ${data.thana}, ${data.district}`,
          details: {
            order_id: orderId,
            order_number: orderNumber,
            source: "ai_assistant",
            payment_method: "cod",
            customer: { name: data.name, phone: data.phone, district: data.district, thana: data.thana, address: data.address },
            item: { product_id: product.id, name: product.name, price: product.price, qty },
            amounts: { subtotal, delivery_fee: DELIVERY_FEE, total },
            chat_context: chatContext,
          },
          metadata: { thread_id: threadId || null, user_id: userId || null },
        });

        await admin.rpc("log_order_event", {
          _order_id: orderId,
          _event_type: "ai_assistant_order",
          _description: "Order placed through Bazar AI Assistant chat",
          _metadata: { thread_id: threadId || null, chat_messages: chatContext.length },
          _order_number: orderNumber,
        });

        return {
          answer:
            `🎉 স্বাগতম! আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে।\n\n` +
            `📦 অর্ডার নম্বর: **${orderNumber}**\n` +
            `💵 মোট: ৳${total.toLocaleString("en-BD")} (ক্যাশ অন ডেলিভারি)\n\n` +
            `আপনার অর্ডারটি কনফার্ম করা হয়েছে। আপনি নিচে থেকে অর্ডার স্লিপ ডাউনলোড করতে পারবেন।`,
          links: [
            { label: "🚚 অর্ডার ট্র্যাক করুন", url: `/order/${orderId}`, variant: "primary" },
            { label: "📥 স্লিপ ডাউনলোড করুন", url: `/order/${orderId}?download=true`, variant: "success" }
          ],
          actions: [{ label: "📋 স্ট্যাটাস দেখুন", send: `অর্ডার #${orderNumber} স্ট্যাটাস` }],
        };
      }
    }
  }

  // New order intent → send clickable product link + offer help
  if (isOrderIntent(text)) {
    const product = await findProductForOrder(admin, text);
    if (!product) return null;
    await saveFlow(admin, threadId, { stage: "offer_help", product, data: {} });
    return {
      answer:
        `আপনি "${product.name}" অর্ডার করতে চাচ্ছেন — দাম ৳${product.price.toLocaleString("en-BD")}।\n\n` +
        `👉 নিচের বাটনে ক্লিক করে সরাসরি অর্ডার ফর্মে যান।\n` +
        `আর যদি নিজে অর্ডার করতে না পারেন, আমাকে বলুন — আমি আপনার হয়ে অর্ডারটি করে দেব। 🙂`,
      products: productCard(product),
      links: [
        { label: "🛒 এই প্রোডাক্টটি অর্ডার করুন", url: `/product/${product.id}`, variant: "primary" },
        { label: "🧾 চেকআউট পেজে যান", url: "/checkout", variant: "outline" },
      ],
      actions: [{ label: "🙋 হ্যাঁ, আপনি করে দিন", send: "হ্যাঁ, সাহায্য করুন" }, CANCEL_ACTION],
    };
  }

  return null;
}

// Helpers for sending order status updates to customers over WhatsApp.

export type WhatsAppTemplate = { status: string; message: string; is_active: boolean };

export const DEFAULT_TEMPLATES: Record<string, string> = {
  pending: "প্রিয় {{name}}, আপনার অর্ডার #{{order_number}} (৳{{total}}) আমরা পেয়েছি ✅ শীঘ্রই কনফার্ম করা হবে। ট্র্যাক করুন: {{track_url}}",
  processing: "প্রিয় {{name}}, আপনার অর্ডার #{{order_number}} কনফার্ম হয়েছে এবং প্রসেসিং চলছে 📦 ট্র্যাক করুন: {{track_url}}",
  shipped: "প্রিয় {{name}}, আপনার অর্ডার #{{order_number}} কুরিয়ারে পাঠানো হয়েছে 🚚 কুরিয়ার: {{courier}} | ট্র্যাকিং: {{tracking}} | {{track_url}}",
  delivered: "প্রিয় {{name}}, আপনার অর্ডার #{{order_number}} ডেলিভারি সম্পন্ন হয়েছে 🎉 ধন্যবাদ! ইনভয়েস: {{track_url}}",
  cancelled: "প্রিয় {{name}}, দুঃখিত — আপনার অর্ডার #{{order_number}} বাতিল করা হয়েছে ❌ বিস্তারিত জানতে যোগাযোগ করুন।",
};

export const TEMPLATE_VARS = [
  "{{name}}", "{{order_number}}", "{{status}}", "{{total}}",
  "{{courier}}", "{{tracking}}", "{{track_url}}", "{{phone}}", "{{note}}",
];

/** Converts a Bangladeshi phone number to WhatsApp international format (8801XXXXXXXXX). */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("880")) return d;
  if (d.startsWith("0")) return `88${d}`;
  if (d.length === 10 && d.startsWith("1")) return `880${d}`;
  return d;
}

export type OrderLike = {
  id?: string;
  order_number: string;
  status: string;
  total: number | string;
  customer_name?: string | null;
  customer_phone?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

export function renderTemplate(tpl: string, order: OrderLike, note?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const trackUrl = order.tracking_url || (order.id ? `${origin}/order/${order.id}` : `${origin}/orders`);
  const map: Record<string, string> = {
    name: order.customer_name || "গ্রাহক",
    order_number: order.order_number,
    status: order.status,
    total: Number(order.total || 0).toLocaleString("en-BD"),
    courier: order.courier_name || "—",
    tracking: order.tracking_number || "—",
    track_url: trackUrl,
    phone: order.customer_phone || "",
    note: note || "",
  };
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => map[k] ?? "");
}

export function buildWhatsAppLink(order: OrderLike, message: string) {
  const num = toWhatsAppNumber(order.customer_phone);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

/* ---------- Cancel / revision request status notifications ---------- */

export type RequestStatus = "pending" | "reviewed" | "approved" | "rejected";

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  reviewed: "রিভিউ করা হয়েছে",
  approved: "অনুমোদিত",
  rejected: "বাতিল",
};

export const REQUEST_STATUS_TEMPLATES: Record<string, string> = {
  reviewed:
    "প্রিয় {{name}}, আপনার অর্ডার #{{order_number}}-এর {{req_type}} রিভিউ করা হচ্ছে 🔎 আমরা শীঘ্রই চূড়ান্ত সিদ্ধান্ত জানাব। {{note}} ট্র্যাক করুন: {{track_url}}",
  approved:
    "প্রিয় {{name}}, আপনার অর্ডার #{{order_number}}-এর {{req_type}} অনুমোদিত হয়েছে ✅ {{note}} ট্র্যাক করুন: {{track_url}}",
  rejected:
    "প্রিয় {{name}}, দুঃখিত — আপনার অর্ডার #{{order_number}}-এর {{req_type}} গ্রহণ করা যায়নি ❌ {{note}} বিস্তারিত জানতে যোগাযোগ করুন। {{track_url}}",
};

export function buildRequestStatusMessage(opts: {
  orderNumber: string;
  customerName?: string | null;
  type: string;
  status: string;
  note?: string | null;
  trackUrl?: string | null;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const tpl = REQUEST_STATUS_TEMPLATES[opts.status] ?? REQUEST_STATUS_TEMPLATES["reviewed"]!;
  const map: Record<string, string> = {
    name: opts.customerName || "গ্রাহক",
    order_number: opts.orderNumber,
    req_type: opts.type === "cancel" ? "বাতিলের অনুরোধ" : "পরিবর্তনের অনুরোধ",
    status: REQUEST_STATUS_LABELS[opts.status] ?? opts.status,
    note: opts.note ? `নোট: ${opts.note}` : "",
    track_url: opts.trackUrl || `${origin}/orders`,
  };
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => map[k] ?? "").replace(/\s{2,}/g, " ").trim();
}

export function buildWhatsAppLinkForPhone(phone: string | null | undefined, message: string) {
  const num = toWhatsAppNumber(phone);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

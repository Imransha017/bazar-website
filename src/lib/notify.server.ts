// Server-only: builds and delivers order notifications to customer, vendor and dropshipper.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Recipient = {
  userId: string | null;
  email: string | null;
  name: string;
  audience: "customer" | "vendor" | "dropshipper";
  extra?: string;
};

const bdt = (n: number) => `৳${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

async function emailFor(userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return { ok: false, skipped: true, reason: "email_not_configured" };
  const from = process.env["ORDER_EMAIL_FROM"] || "Bazar BD <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) return { ok: false, error: (await res.text()).slice(0, 300) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}

export async function notifyOrderStatusChange(orderId: string, oldStatus?: string) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, customer_email, total, items, status, user_id, vendor_id, dropshipper_id, district, thana, address",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { ok: false, error: "order_not_found" };

  const recipients: Recipient[] = [];

  // 1) Customer
  recipients.push({
    userId: order.user_id ?? null,
    email: order.customer_email ?? (await emailFor(order.user_id)),
    name: order.customer_name,
    audience: "customer",
  });

  // 2) Vendor
  if (order.vendor_id) {
    const { data: v } = await supabaseAdmin
      .from("vendors")
      .select("id, user_id, store_name, email, phone")
      .eq("id", order.vendor_id)
      .maybeSingle();
    if (v) {
      recipients.push({
        userId: v.user_id,
        email: v.email ?? (await emailFor(v.user_id)),
        name: v.store_name,
        audience: "vendor",
        extra: v.phone ?? undefined,
      });
    }
  }

  // 3) Dropshipper
  if (order.dropshipper_id) {
    const { data: d } = await supabaseAdmin
      .from("dropshippers")
      .select("id, user_id, store_name, phone, notify_email")
      .eq("id", order.dropshipper_id)
      .maybeSingle();
    if (d) {
      recipients.push({
        userId: d.user_id,
        email: d.notify_email === false ? null : await emailFor(d.user_id),
        name: d.store_name,
        audience: "dropshipper",
        extra: d.phone ?? undefined,
      });
    }
  }

  const items = Array.isArray(order.items) ? (order.items as Array<Record<string, unknown>>) : [];
  const itemsHtml = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${String(i["name"] ?? "")}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${String(i["qty"] ?? 1)}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${bdt(Number(i["price"] ?? 0) * Number(i["qty"] ?? 1))}</td></tr>`,
    )
    .join("");

  const link = `/order/${order.id}`;
  const results: Array<{ audience: string; notified: boolean; emailed: boolean }> = [];

  for (const r of recipients) {
    let heading = "";
    let bodyText = "";

    // Determine notification content based on status
    if (order.status === "failed") {
      heading =
        r.audience === "customer"
          ? `দুঃখিত, আপনার অর্ডার ${order.order_number} সফল হয়নি`
          : `অর্ডার ব্যর্থ হয়েছে — ${order.order_number}`;
      bodyText =
        r.audience === "customer"
          ? `পেমেন্ট ব্যর্থ হওয়ার কারণে আপনার ${bdt(Number(order.total))} টাকার অর্ডারটি সম্পন্ন করা সম্ভব হয়নি।`
          : `অর্ডার #${order.order_number} এর পেমেন্ট ব্যর্থ হয়েছে।`;
    } else if (order.status === "cancelled") {
      heading =
        r.audience === "customer"
          ? `আপনার অর্ডার ${order.order_number} বাতিল করা হয়েছে`
          : `অর্ডার বাতিল করা হয়েছে — ${order.order_number}`;
      bodyText =
        r.audience === "customer"
          ? `আপনার ${bdt(Number(order.total))} টাকার অর্ডারটি বাতিল করা হয়েছে।`
          : `অর্ডার #${order.order_number} বাতিল করা হয়েছে।`;
    } else {
      // Default / Placement success
      heading =
        r.audience === "customer"
          ? `আপনার অর্ডার ${order.order_number} সফলভাবে সম্পন্ন হয়েছে`
          : r.audience === "vendor"
            ? `নতুন অর্ডার পেয়েছেন — ${order.order_number}`
            : `আপনার স্টোর থেকে নতুন অর্ডার — ${order.order_number}`;
      bodyText =
        r.audience === "customer"
          ? `ধন্যবাদ ${order.customer_name}! মোট ${bdt(Number(order.total))} টাকার অর্ডারটি গ্রহণ করা হয়েছে।`
          : `গ্রাহক: ${order.customer_name} (${order.customer_phone}) — মোট ${bdt(Number(order.total))}।`;
    }

    let notified = false;
    if (r.userId) {
      const { error } = await supabaseAdmin.from("notifications").insert({
        user_id: r.userId,
        audience: r.audience,
        type: "order",
        title: heading,
        body: bodyText,
        order_id: order.id,
        order_number: order.order_number,
        link,
      });
      notified = !error;
    }

    let emailed = false;
    if (r.email) {
      const html = `
        <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:620px;margin:auto">
          <h2 style="margin:0 0 4px">${heading}</h2>
          <p style="color:#555;margin:0 0 16px">${bodyText}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr>
              <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #ddd">Product</th>
              <th style="text-align:center;padding:6px 8px;border-bottom:2px solid #ddd">Qty</th>
              <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #ddd">Amount</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin:14px 0 4px"><b>Total:</b> ${bdt(Number(order.total))}</p>
          <p style="margin:0;color:#555"><b>Delivery:</b> ${order.address ?? ""}, ${order.thana ?? ""}, ${order.district ?? ""}</p>
          <p style="margin:16px 0 0;color:#888;font-size:12px">Order #${order.order_number}</p>
        </div>`;
      const res = await sendEmail(r.email, heading, html);
      emailed = !!res.ok;
    }

    results.push({ audience: r.audience, notified, emailed });
  }

  return { ok: true, results };
}

// Keep backward compatibility
export const notifyOrderPlaced = (orderId: string) => notifyOrderStatusChange(orderId);

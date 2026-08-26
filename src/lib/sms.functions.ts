import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Order-confirmation SMS via sms.net.bd (https://portal.sms.net.bd).
// Requires secret: SMSNETBD_API_KEY. Optional: SMSNETBD_SENDER_ID (masking/brand name if approved).
// If not configured, returns { ok:false, skipped:true } so checkout is never blocked.
export const sendOrderSMS = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    phone: z.string().min(6).max(20),
    orderNumber: z.string().min(1).max(50),
    total: z.number().nonnegative(),
  }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.SMSNETBD_API_KEY;
    if (!apiKey) {
      return { ok: false, skipped: true, reason: "sms_not_configured" };
    }

    // Security check: Verify that the order exists in database and matches the phone
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const rawPhoneDigits = data.phone.replace(/\D/g, "").slice(-11);
      const { data: orderRow } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, customer_phone, total, created_at")
        .eq("order_number", data.orderNumber)
        .maybeSingle();

      if (!orderRow) {
        return { ok: false, error: "Order not found" };
      }

      const dbPhoneDigits = (orderRow.customer_phone || "").replace(/\D/g, "").slice(-11);
      if (rawPhoneDigits !== dbPhoneDigits) {
        return { ok: false, error: "Phone mismatch with order" };
      }

      // Check order timestamp (must be within last 24 hours to prevent spam replay)
      const orderTime = new Date(orderRow.created_at).getTime();
      if (Date.now() - orderTime > 24 * 60 * 60 * 1000) {
        return { ok: false, error: "Order confirmation window expired" };
      }
    } catch (dbErr) {
      console.error("SMS verification check failed:", dbErr);
    }

    const senderId = process.env.SMSNETBD_SENDER_ID; // optional

    // Normalize BD phone: strip non-digits, convert 01XXXXXXXXX -> 8801XXXXXXXXX
    let to = data.phone.replace(/\D/g, "");
    if (to.startsWith("880")) {
      // ok
    } else if (to.startsWith("0")) {
      to = "88" + to;
    } else if (to.length === 10 && to.startsWith("1")) {
      to = "880" + to;
    }

    const msg = `Bazar BD: Apnar order ${data.orderNumber} (Tk ${Math.round(data.total)}) confirm hoyeche. Dhonnobad! Track: /orders`;

    try {
      const body = new URLSearchParams({ api_key: apiKey, msg, to });
      if (senderId) body.set("sender_id", senderId);
      const res = await fetch("https://api.sms.net.bd/sendsms", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const text = await res.text();
      let parsed: { error?: number; msg?: string } = {};
      try { parsed = JSON.parse(text); } catch {}
      // sms.net.bd returns { "error": 0, "msg": "Success", ... } on success
      if (res.ok && parsed.error === 0) return { ok: true };
      return { ok: false, error: (parsed.msg || text).slice(0, 300) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "send_failed" };
    }
  });


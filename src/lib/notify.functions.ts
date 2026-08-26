import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Sends order notifications (in-app + email) to customer, vendor and dropshipper on status change.
export const notifyOrderStatusChange = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ orderId: z.string().uuid(), oldStatus: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { notifyOrderStatusChange: run } = await import("./notify.server");
    try {
      return await run(data.orderId, data.oldStatus);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "notify_failed" };
    }
  });

// Keep backward compatibility
export const notifyOrderPlaced = notifyOrderStatusChange;


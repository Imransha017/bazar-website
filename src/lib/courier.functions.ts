import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CourierSubmission = {
  order_id: string;
  courier: 'steadfast' | 'pathao';
  weight: number;
  service_type: string;
  item_description?: string;
};

export const submitToCourier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => 
    z.object({
      order_id: z.string().uuid(),
      courier: z.enum(['steadfast', 'pathao']),
      weight: z.number().default(0.5),
      service_type: z.string(),
      item_description: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (!userId) throw new Error("Unauthorized");

    // Verify caller is admin or assigned vendor
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleData;

    if (!isAdmin) {
      // Check if user is the vendor for this order
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!vendorData) throw new Error("Forbidden: vendor or admin access required");

      const { data: orderData } = await supabase
        .from("orders")
        .select("vendor_id")
        .eq("id", data.order_id)
        .maybeSingle();

      if (!orderData || orderData.vendor_id !== vendorData.id) {
        throw new Error("Forbidden: cannot modify order belonging to another vendor");
      }
    }
    
    // MOCK API CALL
    console.log(`Submitting order ${data.order_id} to ${data.courier}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const trackingNumber = `TRK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const trackingUrl = data.courier === 'steadfast' 
      ? `https://steadfast.com.bd/track/${trackingNumber}`
      : `https://pathao.com/courier/track/${trackingNumber}`;

    // Update order status and tracking info
    const { error } = await (supabase as any)
      .from("orders")
      .update({
        status: 'shipped',
        courier_name: data.courier,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", data.order_id);

    if (error) throw new Error(`Failed to update order: ${error.message}`);

    return {
      success: true,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      message: `Successfully submitted to ${data.courier}`
    };
  });


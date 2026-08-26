# Fix Visibility for Dropshipper and Vendor Orders

The goal is to ensure that orders placed through a dropshipper's store are correctly visible in the Admin, Vendor, and Dropshipper panels. The primary issue is likely due to RLS policies not accounting for guest orders and potentially missing fields in the order split/attribution logic.

## Proposed Changes

### Database Schema and Logic
- Update `place_order` RPC to accept and store `dropshipper_id` and `dropshipper_code` directly.
- Add `GRANT` statements for `orders` and `dropshipper_earnings` to ensure `authenticated` and `service_role` can access them as needed.
- Update RLS policies for `orders` to allow dropshippers to view orders where they are attributed.
- Update RLS policies for `orders` to ensure vendors can view their split orders (already exists, but will verify).

### Frontend Logic (`src/lib/orders.tsx`)
- Modify the `placeOrder` function to include `dropshipper_id` and `dropshipper_code` in the payload sent to `createDBOrder` (via `place_order` RPC).
- This ensures that even if attribution happens later, the order itself is correctly linked from the start.

### Admin/Vendor/Dropshipper Orders View
- Ensure the listing queries correctly filter by the current user's role/ID.

## Technical Details

### SQL Migration
```sql
-- Update orders table to ensure dropshipper_id and code are available
-- These columns likely already exist but might not be populated during place_order

-- Add RLS policy for dropshippers to see their orders
CREATE POLICY "Dropshipper view own orders" ON public.orders
FOR SELECT TO authenticated
USING (dropshipper_id = (SELECT id FROM public.dropshippers WHERE user_id = auth.uid() LIMIT 1));

-- Ensure grants are correct
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
```

### Order Logic Fix
I will update `src/lib/orders.tsx` to pass `dropshipper_id` and `dropshipper_code` during the initial order creation if available.

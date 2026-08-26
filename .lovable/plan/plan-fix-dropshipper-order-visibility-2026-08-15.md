# Plan: Fix Dropshipper Order Visibility

Fix the issue where orders placed through a dropshipper's public store are not visible in the Admin, Vendor, or Dropshipper panels. The root cause is likely a failure in the attribution logic or RLS policies not accounting for all order types.

## Proposed Changes

### 1. Database & Security
- Review and refine the `place_order` RPC and `attribute_order_to_dropshipper` function.
- Ensure `SECURITY DEFINER` is used correctly to resolve IDs from codes even for guest orders.
- Update RLS policies on the `orders` table to ensure:
    - Admins see all orders (including those with `dropshipper_id`).
    - Vendors see orders belonging to their products, even if attributed to a dropshipper.
    - Dropshippers see orders linked to their `dropshipper_id`.

### 2. Frontend Attribution Logic
- Update `src/lib/orders.tsx` to more robustly capture and pass the `dropshipper_code` and `dropshipper_id` during the checkout/placeOrder flow.
- Ensure that if an order is placed from a dropshipper's store (`/ds/:slug`), the `ds_ref` cookie/localStorage is correctly read and applied.

### 3. Dashboard Queries
- Update `src/routes/sys-x7k9-control.orders.tsx` (Admin) to include `dropshipper` relation in the main query to ensure they appear in the list.
- Update `src/routes/vendor.orders.tsx` (Vendor) to ensure the query doesn't accidentally exclude dropshipper-attributed orders.
- Update `src/routes/dropshipping.orders.tsx` (Dropshipper) to ensure the query correctly fetches orders where they are the attributed dropshipper.

## Technical Details
- SQL migration to fix RLS and `GRANT` permissions.
- Code edits in `src/lib/orders.tsx` to handle `dropshipper_id` resolution before calling `createDBOrder`.
- Verify that `attribute_order_to_dropshipper` is called for every order containing dropshipper-linked items.

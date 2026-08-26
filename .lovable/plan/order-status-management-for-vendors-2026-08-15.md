# Order Status Management for Vendors

Allow vendors to update order statuses and display the progress to customers.

## User Review Required

> [!IMPORTANT]
> - Vendors will be able to change order statuses between: `pending`, `processing`, `shipped`, `delivered`, and `cancelled`.
> - Customers will see these updates in real-time on their order details page via an activity timeline.

## Proposed Changes

### Backend
- Ensure `order_activities` table exists and has proper RLS policies for vendors and customers.
- The `order_activities` table is already present and used by the system for status tracking.

### Frontend
- **Vendor Panel**:
  - The status update logic in `src/routes/vendor.orders.tsx` is already present but needs a small UI enhancement to ensure it's intuitive.
  - I'll verify the status transition logic to ensure vendors have full control as requested.
- **Customer View**:
  - Integrate `OrderTimeline` into `src/routes/order.$id.tsx` so customers can track their order's progress (e.g., when it moves from "processing" to "shipped").
  - Add a "Order Status Tracking" section to the customer order page.

## Technical Details
- The `OrderTimeline` component already uses Supabase Realtime to update the UI without page refreshes when a vendor updates a status.
- Status updates will trigger an entry in `order_activities` with the actor's email and metadata (like notes and new status).

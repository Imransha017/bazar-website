# Order Activity History Tracking

Enhance order activity tracking to show a detailed history of status changes, including who made the change and when.

## User Review Required

> [!IMPORTANT]
> - Admin, Vendor, and Dropshipper panels will now show a detailed "History" or "Timeline" for each order.
> - The timeline will display the actor (e.g., admin email or vendor store name), the time of update, and any optional notes provided during the status change.

## Proposed Changes

### Frontend
- **Admin Panel (`src/routes/sys-x7k9-control.orders.tsx`)**:
  - Add a "History" tab or section to the order view modal.
  - Integrate the `OrderTimeline` component to show all status transitions.
- **Vendor Panel (`src/routes/vendor.orders.tsx`)**:
  - Ensure the `OrderDetailModal` includes the `OrderTimeline` component.
  - The logic for recording status changes with notes is already implemented; this change will make the history visible to vendors.
- **Order Timeline Component (`src/components/OrderTimeline.tsx`)**:
  - Improve the display of the "Actor" to handle different types of users (Admin vs Vendor) more gracefully if metadata is available.

### Backend/Logic
- The `order_activities` table is already recording `actor_email` and `metadata` (including notes). This task is primarily about exposing that recorded data in the UI.

## Technical Details
- Status updates in all panels will now consistently prompt for a note (already implemented in `vendor.orders.tsx`, need to ensure consistency in `sys-x7k9-control.orders.tsx`).
- `OrderTimeline` will continue to use Supabase Realtime for instant updates.

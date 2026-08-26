# Plan - Admin Panel Features Implementation

Implement the requested admin panel features: Dynamic Coupons, Support Ticket System, Advanced Analytics, and Auto-Invoicing.

## User-facing changes
- **Coupons Admin**: Add "Dropshipper Exclusive" coupon type to allow dropshippers to create/manage their own marketing codes.
- **Support System**: New "Support" section in Admin, Vendor, and Dropshipper dashboards for issue tracking.
- **Advanced Analytics**: Enhanced graphs for top products, top dropshippers, and real-time sales trends.
- **Auto-Invoicing**: Generate PDF/Printable invoices that clearly show vendor cost, dropshipper profit, and platform fees.

## Technical details

### 1. Database Schema updates
- **Support Tickets**: Create `support_tickets` and `support_messages` tables.
- **Coupons**: Update `coupons` table to include `created_by` (UID) and `is_dropshipper_exclusive` (boolean).
- **Invoices**: Invoices are already partially implemented via `src/lib/print-invoice.ts`. I will enhance this to include a "Settlement Report" view for admins.

### 2. New Routes/Components
- `src/routes/sys-x7k9-control.support.tsx`: Admin support management.
- `src/routes/dropshipping.support.tsx`: Dropshipper support interface.
- `src/routes/vendor.support.tsx`: Vendor support interface.
- Enhance `src/routes/sys-x7k9-control.analytics.tsx` with more complex aggregations.

### 3. Implementation Steps
1. **Migrations**: Create tickets table and update coupons table.
2. **Coupons Enhancement**: Update the existing `coupons` route to handle dropshipper-specific permissions.
3. **Support System**: Build the ticket UI for all three roles.
4. **Analytics Overhaul**: Add "Top Dropshippers" and "Product Performance" sections to the analytics page.
5. **Invoicing**: Update the order detail view to include a "Settlement Invoice" for internal accounting.

## Security
- RLS on support tickets to ensure users only see their own tickets.
- Admin access restricted to the support management view.

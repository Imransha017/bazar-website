# Plan: Professional Vendor Dashboard Enhancements

This plan implements bulk product upload, low-stock notifications, and a vendor rating/badge system to improve vendor productivity and dropshipper trust.

## User Review Required

> [!IMPORTANT]
> - Bulk upload will support CSV format with specific headers (Name, SKU, Price, Stock, Category).
> - Low-stock alerts will be sent to the vendor's dashboard notifications.
> - "Top Vendor" badges will be automatically assigned based on sales volume and order fulfillment rate.

## Proposed Changes

### Database Schema
- Create `vendor_notifications` table to store stock alerts and system updates.
- Add `rating` and `badge` columns to the `vendors` table.
- Create a server-side function to recalculate vendor ratings periodically.

### Vendor Dashboard (`src/routes/vendor.*`)
- **Bulk Upload**: Add a "Bulk Upload" button in `vendor.products.tsx` that opens a CSV parser and importer.
- **Stock Alerts**:
    - Implement a visual "Low Stock" indicator in the product list.
    - Add a "Stock Alerts" section or tab in the vendor dashboard to list products below a threshold (e.g., < 10 units).
- **Vendor Badges**:
    - Display the vendor's badge (e.g., "Top Vendor") in the dashboard header.
    - Ensure the badge is visible on the public store page.

### Technical Details
- Use `papaparse` for client-side CSV parsing.
- Implement a Postgres trigger or server function to automatically insert into `vendor_notifications` when `product.stock` drops below a configurable threshold.
- Update the `Vendor` type definition to include `badge` and `rating` fields.

## Verification Plan

### Automated Tests
- Test CSV upload with valid/invalid data formats.
- Verify stock alert triggers when a product is sold out or stock is manually reduced.

### Manual Verification
- Log in as a vendor and upload a sample CSV of 10 products.
- Check if the "Top Vendor" badge appears after achieving a set milestone.
- Verify low-stock notifications appear in the dashboard when a product's stock is set to 5.

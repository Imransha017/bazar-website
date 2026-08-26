# Plan: Quick Status Preset Filters

Implement one-click preset filters for order statuses in the Admin, Vendor, and Dropshipper order lists to improve navigation and efficiency.

## User Review Required

> [!IMPORTANT]
> The current status labels in the UI are "Pending", "Processing", "Shipped", "Delivered", and "Cancelled". I will align the quick filters with these existing statuses.

## Proposed Changes

### 1. Admin Order List (`src/routes/sys-x7k9-control.orders.tsx`)
- Add a row of quick filter buttons (pills) for each status: All, Pending, Processing, Shipped, Delivered, Cancelled.
- Clicking a pill will update the URL search parameter `status` and trigger a re-load.
- Highlight the active status pill.

### 2. Vendor Order List (`src/routes/vendor.orders.tsx`)
- Add similar quick filter pills for vendors.
- Ensure the count for each status is displayed if possible without significant performance impact.

### 3. Dropshipper Order List (`src/routes/dropshipping.orders.tsx`)
- Enhance the existing tab-style filter to be more prominent and match the other panels.
- Add "Shipped" and "Processing" to the dropshipper's filterable statuses if they are mapped to earnings.

## Technical Details
- Use TanStack Router's `navigate` to update search parameters.
- Reuse the existing `STATUSES` and `STATUS_TONE` constants for styling.
- The filters will be responsive, wrapping to multiple lines on mobile.

## Verification Plan
- Navigate to each order list panel.
- Click various status pills and verify the list updates correctly.
- Verify the active pill is visually distinct.
- Check that the URL reflects the selected status.

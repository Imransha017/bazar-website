# Plan - Fix Product Addition Error

The user is encountering a `null value in column "vendor_id" of relation "products" violates not-null constraint` error when attempting to add a product through the admin panel. This occurs because the `products` table requires a `vendor_id`, but the admin product creation form in `src/routes/sys-x7k9-control.products.tsx` does not provide one. We will fix this by defaulting to the "System Store" vendor (ID `00000000-0000-0000-0000-000000000000`) for products added via the admin panel.

## Proposed Changes

### Frontend (Admin Panel)

- **src/routes/sys-x7k9-control.products.tsx**
    - Update the `save` function to include a default `vendor_id` when inserting new products.
    - Set the default `vendor_id` to `00000000-0000-0000-0000-000000000000` (System Store).

### Database

- Verify if a `DEFAULT` value can be set for the `vendor_id` column in the `products` table to prevent this error globally for platform-level additions, though the explicit fix in the admin UI is safer for current code logic.

## Technical Details

- The error is a standard PostgreSQL NOT NULL constraint violation.
- The platform uses a special UUID `00000000-0000-0000-0000-000000000000` for the "System Store" vendor.
- Including this ID in the `insert` payload will satisfy the database constraint.

## Verification Plan

### Manual Verification
- Attempt to add a new product via the admin dashboard (`/sys-x7k9-control/products`).
- Confirm that the product saves successfully without the "vendor_id" error.
- Verify the product appears in the product list and homepage.

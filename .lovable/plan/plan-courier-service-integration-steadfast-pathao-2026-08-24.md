# Plan: Courier Service Integration (Steadfast & Pathao)

Implement a manual order synchronization system with Steadfast and Pathao courier services for admins and vendors.

## User Review Required

> [!IMPORTANT]
> This implementation includes the UI and backend structure for courier integration. You will need to provide your API keys in the Site Settings to make it functional.

- **Admin/Vendor Access**: Do you want vendors to only see their own orders for courier submission, or should they be able to see all? (Default: vendors see only their orders).
- **Default Courier**: Should we set a default courier (e.g., Pathao) for all orders?

## Proposed Changes

### Database & Settings
- **Courier Config**: Add a new settings section in the admin panel to store API Keys and Merchant IDs for Steadfast and Pathao.
- **Order Tracking**: Use existing `courier_name`, `tracking_number`, and `tracking_url` columns in the `orders` table to store shipment info.

### Admin Panel Improvements
#### Settings (`src/routes/sys-x7k9-control.settings.tsx`)
- Add "Courier Service Integration" card.
- Fields for Steadfast (API Key, Secret) and Pathao (Client ID, Secret, Merchant ID).

#### Order Management (`src/routes/sys-x7k9-control.orders.tsx`)
- Add "Send to Courier" button in the order list and detail view.
- Create a `SendToCourierModal` component for manual detail verification (weight, area, service type).
- Display tracking info in the order list when available.

### Backend & Logic
#### Courier Integration (`src/lib/courier.functions.ts`)
- `createServerFn` for submitting orders to Steadfast/Pathao APIs.
- Logic to update order status to `shipped` and save tracking info upon successful submission.
- Mock handlers for development until real API keys are provided.

## Technical Details

### Workflow
1. Admin/Vendor clicks "Send to Courier".
2. Modal opens with pre-filled customer data.
3. User selects Courier (Pathao/Steadfast) and Service Type.
4. Server function calls the external API.
5. On success:
   - Order status -> `shipped`.
   - `courier_name`, `tracking_number` updated.
   - Audit log recorded.

### Security
- API keys stored in `app_settings` (protected by RLS/Admin role).
- Server-side execution for API calls to keep keys secret.
- Vendor-scoped submission: ensure vendors can only submit orders containing their products.

# Plan: Dropshipper Profit Ledger History

I will implement a detailed profit ledger history for dropshippers, showing every status change (Pending, Approved, Cancelled) and the reason for the change.

## User Review Required

> [!IMPORTANT]
> The ledger will automatically log reasons for status changes (e.g., "Order Delivered" or "Order Cancelled"). Does the user need the ability to manually add custom notes to these transactions from the admin panel?

## Proposed Changes

### Database (Supabase)

- **Create Migration:** Add `activity_log` (JSONB) and `metadata` (JSONB) columns to the `dropshipper_earnings` table.
- **Trigger Function:** Implement a trigger to automatically record status transitions and notes into the `activity_log`.

### Frontend (TanStack Start)

- **UI Components:**
  - Create `src/components/ProfitLedgerModal.tsx` to display the activity history for a specific earning.
- **Routes:**
  - Update `src/routes/dropshipping.earnings.tsx` to include an "Info" button on each row that opens the ledger modal.
  - Show the status change reasons clearly in the modal.

## Technical Details

- **Table Schema:** `dropshipper_earnings` will store an array of objects in `activity_log`: `[{ status: string, changed_at: string, note: string }]`.
- **Admin API:** Ensure the `DropshipperEarning` type in `src/lib/dropshipper.ts` includes the new columns.
- **RLS:** Update RLS policies if necessary to ensure dropshippers can read their own activity logs.

## Verification Plan

- **Automated Tests:** Verify that inserting an order correctly initializes the `activity_log`.
- **Manual Verification:**
  - Change an order status to 'delivered' and verify the earning status moves to 'approved' with a log entry.
  - Change an order status to 'cancelled' and verify the earning status moves to 'rejected' with a log entry.
  - Open the Earnings page as a dropshipper and verify the history modal displays correctly.

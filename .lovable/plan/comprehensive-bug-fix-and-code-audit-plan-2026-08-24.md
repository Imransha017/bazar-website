# Comprehensive Bug Fix and Code Audit Plan

This plan addresses several reported issues: products not appearing, login sessions being lost, cart page issues, and general code cleanliness/security.

## User-facing changes
- **Stable Login**: Fixed session management so users stay logged in across page refreshes.
- **Product Visibility**: Ensured all active products are visible to both guest and logged-in users.
- **Cart Reliability**: Improved cart page performance and navigation.
- **Bilingual Support**: Ensured consistent Bengali/English translations across fixed areas.

## Technical Details

### 1. Auth & Session Management
- Refactor `src/lib/auth.tsx` to handle session hydration more robustly.
- Ensure `onAuthStateChange` correctly updates state without causing infinite re-renders or hydration mismatches.
- Remove unnecessary `console.log` statements while keeping critical error tracking.

### 2. Product Catalog Fixes
- Re-verify and re-issue `GRANT SELECT` on `products`, `categories`, and `reviews` tables for `anon` and `authenticated` roles.
- Update `src/lib/live-catalog.ts` to improve error handling and logging when fetching data fails.
- Ensure `is_active = true` is the only requirement for public visibility.

### 3. Cart & Checkout Improvements
- Clean up `src/routes/cart.tsx` navigation logic, removing `window.location.assign` hacks in favor of standard `@tanstack/react-router` methods.
- Verify `CartProvider` in `src/lib/cart.tsx` correctly persists data for both guest and authenticated users.

### 4. Security Hardening (RLS & Grants)
- Audit all public tables and ensure they have `GRANT` statements for `authenticated` and `service_role`.
- Verify RLS policies don't have recursive calls (using security definer functions where needed).

### 5. Code Cleanliness
- Sweep `src/routes/index.tsx` and related components for any remaining demo product fallbacks.
- Ensure all API calls are using `supabase` client correctly.

## Implementation Steps

### Step 1: Auth Robustness
- Modify `src/lib/auth.tsx` to use a more stable hydration check.

### Step 2: Database Permissions (SQL)
- Run a migration to ensure all necessary `GRANT`s are in place.

### Step 3: Catalog Logic
- Update `src/lib/live-catalog.ts` for better resilience.

### Step 4: UI Cleanup
- Update `src/routes/cart.tsx` and `src/components/site/Header.tsx`.

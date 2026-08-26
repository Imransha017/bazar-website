# V2 System Upgrade Plan

Functional upgrade for Production-Ready features (V2) while strictly maintaining existing UI/UX and design system.

## Phase 1: Product System Upgrades
Implement robust inventory and variation management without altering the product card design.

- **Variant & SKU Logic**:
    - Update `src/integrations/supabase/types.ts` (via migration) to ensure `variants`, `colors`, and `sizes` JSONB structures are standardized.
    - Implement a variant picker in `src/routes/product.$id.tsx` and `src/routes/p.$slug.tsx` that updates SKU and stock displays within the current layout.
- **Stock visibility**: Add stock status indicators (In Stock / Low Stock / Out of Stock) to existing product pages.

## Phase 2: Advanced Search & Personalization
Improve discovery tools while keeping the search bar and header visually identical.

- **Search Engine**: Update `src/routes/search.tsx` to handle multi-criteria filtering (price range, category hierarchy, availability) and sorting (best selling, price, rating).
- **Personalization**:
    - **History**: Implement a local-storage-based "Recently Viewed" tracker.
    - **Wishlist**: Connect existing wishlist icons to a database-backed wishlist for authenticated users.
- **AI Shopping Assistant**: Add a floating, non-intrusive chat widget using Lovable AI to suggest products based on search history and popular items.

## Phase 3: Dropshipping & Personal Stores
Enhance the dropshipper store functionality while keeping the marketplace separation.

- **Store Visibility Logic**: 
    - Implement a "Marketplace vs. Private" visibility toggle. Private stores will only show products via their unique `ds.$slug` routes, not the main marketplace search.
- **AI Store Builder**: Add a tool in the dropshipper dashboard (`src/routes/dropshipping.tsx`) that uses AI to suggest store themes (color/name) and pre-fill "About" sections.
- **One-Click Imports**: Automate the import flow in `src/routes/dropshipping.products.tsx` to pre-calculate retail prices based on configurable profit margins.

## Technical Details

- **Database**: Add `visibility_mode` (enum: public, private) to `dropshippers` and `imported_products` tables.
- **Search**: Optimize `src/lib/live-catalog.ts` to support filtered queries directly instead of large client-side slices.
- **Auth**: Ensure `user_roles` are correctly handled for admin-only stock/variant overrides.

```text
Database Tables to Modify:
- products (add structured variants metadata)
- dropshippers (add visibility_mode, ai_config)
- wishlist (new table)
```

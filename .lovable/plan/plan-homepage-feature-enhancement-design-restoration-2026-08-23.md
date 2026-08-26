# Plan: Homepage Feature Enhancement & Design Restoration

Restore original homepage design elements while adding advanced admin controls for product ordering, filtering, and customization as requested.

## User Improvements
- **Design Restoration**: Fix category/subcategory menu structure and ensure the homepage matches the original "Bazar" model (circular categories with icons, specific section styling).
- **Admin Control**: New settings for "More/View All" button behavior (modal vs. page) and labels.
- **Enhanced Sorting**: Control product sort order (Popular, Price, etc.) for every section from the admin panel.
- **Product Toggles**: Admin can hide specific products from the homepage without deleting them.
- **SEO & Performance**: Optimized metadata for all dynamic pages and server-side caching for catalog queries.

## Technical Details
- **Schema Update**: Add `section_config` to `SiteSettings` to house per-section order, labels, and behavior.
- **Metadata Logic**: Update TanStack Router `head` functions in `category.$slug.tsx` and `p.$slug.tsx` to pull from product/category objects.
- **Caching**: Implement `staleTime` and `gcTime` optimizations in `useLiveCatalog` and add a simple in-memory cache for product lookups.
- **Component Refactor**:
    - `CategoriesGrid.tsx`: Restore the multi-level expand/collapse behavior.
    - `index.tsx`: Update `renderSection` to respect new sort order and visibility settings.
    - `sys-x7k9-control.site-customization.tsx`: Add UI for the new "More" button settings and sort order selection.

## Plan Rules
- **DO NOT** redesign existing components.
- Maintain the deep purple (#5200FF) brand identity.
- Ensure all Bengali/English translations are handled via `pick(text, lang)`.

# Advanced Dropshipping Marketing Features

Implement specialized marketing tools for dropshippers, including video review imports, short-link generation improvements, and a Facebook Shop auto-feed system.

## Proposed Changes

### Database & Backend
- Add `video_reviews` table to store imported video links (YouTube/Facebook) for specific products.
- Update `dropshippers` table to include `facebook_shop_config` for the auto-feed system.
- Create a new server function `importProductVideoReview` to validate and store video links.
- Create a new server route `src/routes/api/public/ds-feed.$slug.ts` to serve a real-time RSS/XML feed of a dropshipper's imported products for Facebook Shop.

### Dropshipper Dashboard
- **Marketing Page (`src/routes/dropshipping.marketing.tsx`)**:
    - Add "Video Review Import" section: Allows pasting YouTube/Facebook links for their imported products.
    - Add "Facebook Shop Auto-Feed" section: Shows the feed URL and sync status.
    - Enhance "Short-link Generator": Add a "Custom Alias" option for even cleaner links.

### Public Storefront (`src/routes/ds.$slug.tsx` and `src/routes/product.$id.tsx`)
- Display imported video reviews in a dedicated section on the product details page if viewing through a dropshipper link.

### Logic Improvements
- Refactor `buildDsShortLink` in `src/lib/dropshipper.ts` to support custom aliases.

## Technical Details
- **Video Reviews**: Stored in a new table `product_video_reviews` with `dropshipper_id`, `product_id`, `video_url`, and `platform` (youtube/facebook).
- **Facebook Feed**: Standard RSS/XML format required by Meta for product catalogs.
- **Short Links**: Use a mapping table `dropshipper_short_links` to resolve custom aliases to actual product pages.


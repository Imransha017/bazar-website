# Plan: Marketing & Domain Automation

Implement professional marketing features for dropshippers, including pixel verification, domain connection flow, affiliate tracking views, and one-click social media kits.

## Database Changes
- Create `affiliate_stats` view for performance reporting.
- Update `dropshippers` table with `domain_verified_at` and `last_pixel_test_at`.
- Add RLS policies for sub-affiliate visibility.

## Backend Improvements
- Create `src/lib/marketing-pro.functions.ts` for:
    - `verifyDomainDns`: Checks A records/CNAME for custom domains.
    - `getAffiliateReport`: Aggregates clicks, sales, and commissions for the multi-level chain.
    - `testPixelEvent`: Logs a test event to verify Pixel/GA integration.

## Frontend Enhancements
- **Dropshipper Public Store (`src/routes/ds.$slug.tsx`)**:
    - Add a "Test Event" debugger (visible only to the owner) to verify tracking IDs.
    - Enhanced tracking logic with event batching.
- **Marketing Panel (`src/routes/dropshipping.marketing.tsx`)**:
    - **Affiliate View**: Add click/sale records and commission history for sub-affiliates.
    - **One-Click Kit**: Implement actual "Copy Design" and "Download All" for assets.
- **Settings Panel (`src/routes/dropshipping.settings.tsx`)**:
    - **Domain Flow**: Add DNS verification status, instructions (A record 76.76.21.21), and a "Verify Now" button.

## Technical Details
- Using `fetch` in server functions to check DNS via public DNS-over-HTTPS APIs (like Cloudflare/Google) for domain verification.
- Affiliate tracking will leverage the existing `trackDsClick` RPC but expanded for sub-affiliate attribution.

# Product Card and Homepage Enhancement Plan

The user wants to enhance the homepage and product cards to be more "modern" and "compact", ensuring consistent spacing and professional attribution visibility.

## User Requirements
- Admin Panel: Order details must show Vendor and Dropshipper attribution (already implemented in previous turn).
- Homepage: Add Banner, Offer, Video Ad features (controllable from Admin).
- Product Cards (Homepage/Dropshipper Store): 
    - border-box style.
    - Title truncated to single line with dot-dot-dot.
    - Price, Add to Cart, Order Now buttons should be close together with minimal/no gaps.
    - Buttons should be small and horizontally aligned.
    - Consistent style for both PC and Mobile.

## Technical Details
- **Database**: The `banners` table already exists and handles `placement` ('home_video', 'home_promo_card', 'hero_slider', 'hero_side').
- **Admin Panel**: The `banners` management route (`src/routes/sys-x7k9-control.banners.tsx`) is already set up to control these.
- **Product Card Styling**: 
    - Update `src/components/site/ProductCard.tsx` to match the style implemented in `src/routes/ds.$slug.tsx`.
    - Compact layouts using `leading-none`, `gap-0.5`, `p-1`, and `truncate`.
    - Add "Order Now" button to the main `ProductCard` component to match the user's "modern multi-vendor" vision.

## Proposed Changes

### 1. Update ProductCard Component
- Modify `src/components/site/ProductCard.tsx` to include "Add to Cart" and "Order Now" buttons side-by-side.
- Ensure tight spacing between title, price, and buttons.
- Single-line title truncation.

### 2. Verify Homepage Layout
- Ensure `HomeVideos.tsx` and `HomePromoCards.tsx` are correctly integrated in `src/routes/index.tsx`.
- Review the `Hero` component to ensure it uses the dynamic banners.

### 3. Final Spacing Audit
- Use Playwright/JS to verify no excessive gaps exist in the rendered product cards across different viewports.

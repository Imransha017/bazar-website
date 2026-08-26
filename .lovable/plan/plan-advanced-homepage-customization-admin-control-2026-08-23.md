# Plan: Advanced Homepage Customization & Admin Control

Add advanced homepage management features including section drag-and-drop, manual product selection, flash sale timer customization, marketing ad analytics, and video layout controls.

## Proposed Changes

### 1. Database & Schema Enhancement
- Update `site_settings` table to include `section_order`, `flash_sale` configuration, `videos_config`, and manual product IDs for featured sections.
- Add `marketing_ads` tracking structure to store click counts.

### 2. Admin Panel UI (`src/routes/sys-x7k9-control.site-customization.tsx`)
- **Drag-and-Drop Order**: Implement `@dnd-kit` to allow reordering homepage sections (Hero, Flash Sale, Best Sellers, etc.).
- **Manual Product Selection**: Add a product selector to "Best Sellers", "Viral Products", and "Promo Cards" tabs to override automatic lists.
- **Flash Sale Settings**: Add controls for Start/End times, Countdown Toggle, and Badge customization (text, color).
- **Featured Videos Layout**: Add dropdowns for layout (Grid/Carousel), Aspect Ratio (16:9, 9:16, 1:1), and Autoplay toggle.
- **Marketing Analytics**: Display `click_count` for each ad banner in the admin UI.

### 3. Homepage Updates (`src/routes/index.tsx`)
- Refactor the render loop to follow `settings.homepage.section_order`.
- Update `FlashSale` component to respect dynamic timers and badges.
- Update `Best Sellers` and `Viral Products` to prioritize manually selected products if defined.
- Add click-tracking logic for marketing banners (using a local tracking function or API call).

### 4. Component Enhancements
- Update `src/components/site/FlashSale.tsx` to include a countdown timer.
- Update `src/components/site/HomeVideos.tsx` to respect layout and autoplay settings.

## Technical Details

- **Libraries**: `@dnd-kit/core`, `@dnd-kit/sortable` for reordering; `date-fns` for timer logic.
- **Data Persistence**: Settings saved in the `site_settings` JSONB column in Supabase.
- **Tracking**: `marketing_ads` click tracking will increment a counter in the JSONB object (optimistic updates + debounced save).
- **SEO**: Ensure dynamic sections maintain semantic HTML and don't break CLS (Cumulative Layout Shift) by providing stable containers.

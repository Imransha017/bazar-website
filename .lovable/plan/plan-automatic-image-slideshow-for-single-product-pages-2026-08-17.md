# Plan: Automatic Image Slideshow for Single Product Pages

Implement an automatic slideshow for product images on all single product pages (Main site, Vendor site, and Dropshipper site). The slideshow will cycle images every 30 seconds and allow manual navigation.

## Proposed Changes

### 1. Main Site & Vendor Site Product Page (`src/routes/p.$slug.tsx`)
- Add a `useEffect` hook to `PublicProductPage` component.
- Implement a 30-second interval that increments the `active` state index.
- Ensure the interval resets when the user manually changes the active image.
- Add logic to cycle back to the first image after the last one.

### 2. Marketplace Product Page (`src/routes/product.$id.tsx`)
- Modify the `ProductGallery` component to accept a 30-second auto-slide interval.
- Add a `useEffect` hook to manage the timer.
- Ensure manual clicks via `setActive` reset the timer to prevent immediate jumping.

### 3. Dropshipper Product Page (`src/routes/dropshipping.view.$importId.tsx`)
- Add a `useEffect` hook to the `ViewPage` component.
- Implement the 30-second timer to update the `active` state index.
- Reset the timer on manual interaction.

### 4. Dropshipper Public Store Product View
- The user mentioned "Dropshipper account's public store single product page".
- Currently, `src/routes/ds.$slug.tsx` shows a product grid but might use a modal or separate page for single products if implemented (though it seems it links to `/p/$slug` or `/product/$id`). I will verify if there's a specific "Single Product" view inside `ds.$slug.tsx` that needs this.

## Technical Details
- Use `setInterval` for the 30-second timer.
- Use `useEffect` cleanup to avoid memory leaks.
- Timer duration: 30,000ms.
- Interaction tracking: Reset timer on manual thumbnail click.

## Verification Plan
- Navigate to a product page on the main site and wait 30 seconds to observe the slide.
- Manually click a thumbnail and verify the 30-second countdown restarts.
- Repeat for Vendor and Dropshipper product views.

# Plan - Categories and Subcategories for Dropshipper Public Store

Implement a category/subcategory menu in the Dropshipper public store page (`/ds/$slug`) that mirrors the main site's functionality but filtered to only show categories and subcategories that actually contain products added by that specific dropshipper.

## User Requirements
- The dropshipper public store page should have a category and subcategory navigation similar to the main website.
- Only show categories/subcategories that have at least one product in this specific store.
- Categories and subcategories are automatically derived from the products the dropshipper has added.
- The UI should be modern and easy for customers to navigate.

## Proposed Changes

### 1. Data Logic
- Update `getPublicStore` in `src/lib/dropshipper.ts` (or derive client-side) to extract unique categories and subcategories from the store's `items`.
- Map these unique category/subcategory slugs to their full metadata (names, icons) using the existing `liveCatalog`.

### 2. UI Components
- **Category Sidebar/Menu**: Implement a responsive category navigation in `src/routes/ds.$slug.tsx`.
  - On **Desktop**: A sidebar or top bar with category dropdowns.
  - On **Mobile**: A horizontal scroll or a "Categories" button that opens a layout similar to `src/routes/categories.tsx`.
- **Filtering**: Update the product grid in `src/routes/ds.$slug.tsx` to filter products based on the selected category or subcategory.

### 3. Implementation Details
- Add state to `PublicStore` component in `src/routes/ds.$slug.tsx` for `selectedCategory` and `selectedSubcategory`.
- Filter the `items` array based on these selections.
- Extract categories: `items.map(i => i.product.category_slug)` and match with `liveCatalog.categories`.
- Extract subcategories per category: `items.filter(i => i.product.category_slug === activeCat).map(i => i.product.subcategory_slug)`.

## Technical Details
- Use `useLiveCatalog` hook in `PublicStore` to get the master list of category names/icons.
- Maintain consistency with the "Daraz-style" layout used elsewhere in the app.
- Ensure the "All Categories" logic on the homepage remains untouched as requested.

## User Review Required
- Should the category menu be a sidebar (like Daraz) or a horizontal bar below the header?
- Should the mobile categories view be a separate page or a modal/overlay?

# Plan: Move Dropshipper Dashboard Navigation to Sidebar

Move the horizontal tab-based navigation in the Dropshipper account dashboard to a responsive sidebar accessible via a three-line (hamburger) icon, consistent with the user's request for a cleaner layout.

## User Review Required

> [!IMPORTANT]
> The sidebar will appear when clicking a menu icon. In desktop view, would you prefer the sidebar to be permanently visible or also hidden behind the menu icon? I will implement it as a sliding sidebar by default (accessible via the icon) to maximize screen space for dashboard content.

## Proposed Changes

### Dropshipper Layout (`src/routes/dropshipping.tsx`)

- Add a state for sidebar visibility (`isSidebarOpen`).
- Remove the horizontal `tabs.map` horizontal scroll navigation.
- Add a "Three-line" (Menu) icon button at the top of the dashboard shell.
- Implement a `Sidebar` component (or integrated JSX) that:
  - Slides in from the left when active.
  - Lists all navigation options: Dashboard, Products, Orders, Earnings, Payouts, Marketing, Link History, Settings.
  - Uses the existing icons and labels.
  - Closes when a link is clicked or when clicking outside.
- Ensure the sidebar design is consistent with the "modern admin" look (clean borders, consistent padding).

## Technical Details

- Use a sliding `div` with a backdrop for the sidebar to ensure compatibility with the existing layout structure.
- Maintain the existing `tabs` array for the source of truth for navigation links.
- Use `lucide-react` for the Menu icon.
- Ensure `Outlet` content is not obscured when the sidebar is open on larger screens (or keep it as an overlay).

## Verification Plan

### Automated Tests
- N/A (Manual visual verification is more appropriate for UI layout changes).

### Manual Verification
1. Open the Dropshipper dashboard in the preview.
2. Confirm the horizontal scroll tabs are gone.
3. Locate and click the new "Three-line" menu icon.
4. Verify the sidebar opens and contains all expected links.
5. Click a link in the sidebar and verify navigation works and the sidebar closes.
6. Check mobile responsiveness to ensure the sidebar fits well on smaller screens.

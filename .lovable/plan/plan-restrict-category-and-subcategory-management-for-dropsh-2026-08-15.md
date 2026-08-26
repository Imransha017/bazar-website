# Plan: Restrict Category and Subcategory Management for Dropshippers

The user wants to completely block dropshippers from creating new categories or subcategories. They should only be able to use the categories and subcategories that are automatically assigned to the products they import from the admin catalog.

## Proposed Changes

### Dropshipper Dashboard
- Verify that there are no "Create Category" or "Create Subcategory" options in `src/routes/dropshipping.products.tsx` or `src/routes/dropshipping.settings.tsx`.
- Ensure the categories displayed in the dropshipper's store (`/ds/$slug`) are strictly derived from the products they have imported.

### Database / RLS (Security)
- Review RLS policies on the `categories` table.
- Ensure that only users with the `admin` role (specifically the authorized admin email) have `INSERT` or `UPDATE` permissions on the `categories` table.
- Dropshippers should only have `SELECT` access to categories.

### Technical Details
- **Role Verification:** The system already uses `has_role(auth.uid(), 'admin')` for admin gates.
- **RLS Policy:**
  ```sql
  -- Ensure only admins can modify categories
  DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
  CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

  -- Ensure everyone can read categories
  DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
  CREATE POLICY "Public can view categories"
  ON public.categories
  FOR SELECT
  TO public
  USING (true);
  ```
- **UI Audit:** I have already scanned the dropshipper routes and confirmed that there is no UI for creating categories. The dropshipper only "imports" products, which brings along their existing category associations.

## Verification Plan
- Attempt to access category management as a dropshipper (should not exist in UI).
- Verify that the `categories` table RLS prevents non-admins from inserting data.

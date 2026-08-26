# Plan: Automated Category Assignment in Product Editor

Restrict manual category/subcategory selection in the product editor for Vendors and Admins. Categories will be automatically assigned based on the selected Subcategory to ensure data integrity and simplify the product creation flow.

## User Interface Changes

- Modify `src/components/ProductEditModal.tsx`:
    - Hide the "Category" and "Option" fields/columns in both Single and Multiple selection modes.
    - Show only the "Subcategory" selection.
    - When a subcategory is selected, automatically set the corresponding parent Category in the background.
    - Keep the "Option" logic if needed, but the prompt specifically mentioned "Category and Subcategory" (ছাপ ক্যাটাগরি is likely Subcategory).
    - Update labels to clarify that categories are assigned automatically.

## Technical Details

- **Component Level**: Update `CategoryPicker` component within `ProductEditModal.tsx`.
- **Logic**:
    - For a selected subcategory slug, find its `parent_id` in the categories list.
    - Map `parent_id` to its Category slug and name.
    - Update the product state with both the subcategory and its parent category.
- **Visuals**: Use CSS `hidden` or conditional rendering to remove the Category/Option UI elements from the form.

## Verification Plan

- Open the Product Edit Modal (Add or Edit).
- Verify that only the Subcategory list/dropdown is visible.
- Select a subcategory.
- Check (via console log or temporary UI) that `category_slug` and `category_name` are correctly updated in the product object.
- Save the product and verify the mapping in the product list or database.

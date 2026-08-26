# Plan - Fix Admin Panel Access

The user is reporting that they cannot find the "Admin Panel" option. My investigation confirms that the user `emransha952@gmail.com` has the `admin` role in the `user_roles` table, but the frontend state might not be correctly reflecting this due to how the `AuthProvider` or `Header` components handle the admin check.

## Proposed Changes

### 1. Frontend: Auth Provider & Header
- Verify `isAdmin` state in `src/lib/auth.tsx` correctly updates and is accessible.
- Ensure `src/components/site/Header.tsx` correctly renders the "Admin Panel" link for users with the `isAdmin` flag.
- Add a direct "Admin Panel" link to the mobile menu and user dropdown for visibility.

### 2. Admin Route Accessibility
- Ensure `src/routes/sys-x7k9-control.tsx` (the layout/root for admin) has a clear "Access Denied" state or redirect if a user is NOT an admin, but provide a way for legitimate admins to get there.

### 3. Verification
- Use Playwright to log in as `emransha952@gmail.com` and verify the "Admin Panel" link is visible in the Header.
- Manually check the `/sys-x7k9-control` route access.

## Technical Details
- The `isAdmin` flag in `useAuth()` depends on a `SELECT` query on the `user_roles` table. 
- I will check if the `user_roles` RLS policy `Authenticated users can select everything` (qual: `true`) is actually working as expected or if it's too permissive/broken.
- I will ensure the `isAdmin` check in `AuthProvider` is triggered correctly on login and refresh.

```typescript
// Example fix in src/lib/auth.tsx to ensure isAdmin is robust
const fetchRole = async (userId: string) => {
  // ... existing logic ...
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  setIsAdmin(!!data);
};
```

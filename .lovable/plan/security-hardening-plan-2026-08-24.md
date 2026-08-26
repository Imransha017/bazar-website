# Security Hardening Plan

This plan addresses several critical security vulnerabilities identified in the recent audit, including over-permissive database grants, data exposure in sensitive tables, and insecure security helper functions.

## User Review Required

> [!IMPORTANT]
> The hardening migration will revoke `ALL` privileges from `anon` and `authenticated` roles and re-grant only the minimum necessary permissions. While this significantly improves security, it may affect any custom queries that rely on broad access.

- **PII Protection**: Sensitive columns like `phone` and `payout_number` in `dropshippers` and `vendors` tables will now be restricted at the database level.
- **AI Configs**: The `ai_model` configuration (containing API keys) will be strictly hidden from all non-admin users.
- **Security Helpers**: Functions like `is_admin()` will no longer be executable by anonymous users.

## Proposed Changes

### Database Security (Supabase)
- **Privilege Reset**: Revoke `ALL` privileges on all tables, functions, and sequences from `anon` and `authenticated` roles.
- **Granular Grants**:
    - Grant `SELECT` to `anon` only on public content (products, categories, banners, etc.).
    - Implement column-level security for `dropshippers` and `vendors` to hide PII from public view.
    - Grant `authenticated` users access only to their own data (profiles, orders, etc.).
- **RLS Policy Updates**:
    - `ai_assistant_configs`: Explicitly block access to `ai_model`, `admin_secrets`, and `payment_keys` for non-admins.
    - `user_roles`: Restrict visibility to own roles or admin view only.
    - `reviews`: Enforce `is_approved = true` for all public reads.
- **Function Hardening**: Revoke `EXECUTE` on `is_admin()` and `has_role()` from `anon`.

### Code Cleanup
- **API Removal**: Locate and remove the insecure `bootstrap-admin.ts` endpoint if it exists in the codebase (it was flagged in the report but might have been a previous version or renamed).
- **Audit Logs**: Ensure `admin_audit_logs` is enabled for sensitive table changes.

## Technical Details
- **Migration**: A new SQL migration will be applied to the `public` schema.
- **RLS**: Row-Level Security will be verified as `ENABLED` for all sensitive tables.
- **Column-Level Security**: Using Postgres `GRANT SELECT (col1, col2)` to prevent data leakage while maintaining storefront functionality.

## Verification Plan
- **Manual Verification**: Run SQL queries as `anon` and `authenticated` roles to verify that sensitive data is no longer accessible.
- **Automated Checks**: Verify that the homepage, products, and categories still load correctly for guests.
- **Admin Check**: Verify that admin users still have full access to manage the site.

-- Harden privileged database functions and views after schema import
ALTER FUNCTION public.log_order_activity() SET search_path = public;
ALTER VIEW public.affiliate_performance SET (security_invoker = on);

-- Internal trigger functions must not be callable through the API
REVOKE ALL ON FUNCTION public.prevent_vendor_status_escalation() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.grant_vendor_role_on_apply() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.sync_commission_totals() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.sync_payout_totals() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.affiliate_commissions_on_order_status() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_vendor_order_field_changes() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_dropshipper_escalation() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.grant_dropshipper_role_on_approve() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.sync_dropshipper_totals() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.sync_dropshipper_payouts() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.dropshipper_earnings_on_order_status() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_admin_email() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.restock_on_cancel_refund() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.log_status_change() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.log_order_activity() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.log_dropshipper_earning_activity() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.check_product_stock_alert() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- Admin/back-office RPCs: never callable by anonymous visitors
REVOKE ALL ON FUNCTION public.admin_adjust_dropshipper_earning(uuid, text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_user_email(uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.mark_dropshipper_payout_paid(uuid, text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.assign_vendor_badges() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.request_dropshipper_payout(numeric, text, text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.my_vendor_ids() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.my_dropshipper_ids() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_vendor_id() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.get_review_authors(uuid[]) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_dropshipper_earning(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_email(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_dropshipper_payout_paid(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_dropshipper_payout(numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_vendor_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_dropshipper_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_vendor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_authors(uuid[]) TO authenticated;
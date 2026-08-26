-- Fix Security Definer issues by setting search_path
ALTER FUNCTION public.check_product_stock_alert() SET search_path = public;

-- Function to assign badges to vendors based on performance
CREATE OR REPLACE FUNCTION public.assign_vendor_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Assign 'Top Vendor' badge to those with > 50 orders and > 4.5 rating
    UPDATE public.vendors
    SET badge = 'Top Vendor'
    WHERE total_orders >= 50 AND rating >= 4.5;
END;
$$;

-- Grant access to the badge function
GRANT EXECUTE ON FUNCTION public.assign_vendor_badges() TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_vendor_badges() TO authenticated;

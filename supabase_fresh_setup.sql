-- ============================================
-- SUPABASE DATABASE SETUP - CLEAN VERSION
-- Generated: 2026-08-26
-- INSTRUCTIONS:
-- 1. Copy ALL content from this file
-- 2. Paste into Supabase SQL Editor
-- 3. Click RUN
-- 4. Wait for completion (3-5 minutes)
-- ============================================

-- ============================================
-- STEP 0: EXTENSIONS & TYPES
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'vendor');
EXCEPTION WHEN duplicate_object THEN
  -- Add vendor if missing
  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- ============================================
-- STEP 1: HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================
-- STEP 2: CORE TABLES (no foreign key deps)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Auto-assign admin role to configured admin email (if user exists)
-- This runs after the table is created and can be safely re-run
DO $$
DECLARE
    admin_email TEXT := 'emransha952@gmail.com';
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  phone TEXT,
  address TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  commission_pct NUMERIC NOT NULL DEFAULT 10,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10,2),
  image TEXT NOT NULL DEFAULT '',
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_id UUID REFERENCES public.categories(id),
  category_slug TEXT,
  subcategory_slug TEXT,
  brand TEXT,
  stock INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  sold_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dropshippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_name TEXT NOT NULL,
  notify_email TEXT,
  phone TEXT,
  facebook_shop_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  commission_pct DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('BZ-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  dropshipper_id UUID REFERENCES public.dropshippers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  address TEXT NOT NULL,
  district TEXT,
  thana TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  coupon_code TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_type TEXT,
  txn_id TEXT,
  sender_phone TEXT,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- STEP 3: DEPENDENT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  district TEXT NOT NULL,
  thana TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  min_order NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(12,2) DEFAULT 0,
  max_discount NUMERIC,
  expires_at TIMESTAMPTZ,
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 1,
  image TEXT,
  sku TEXT,
  size TEXT,
  color TEXT,
  variant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'info',
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  order_number TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  type TEXT NOT NULL DEFAULT 'cancel',
  reason TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placement TEXT NOT NULL DEFAULT 'hero_slider',
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '',
  gradient_from TEXT NOT NULL DEFAULT 'from-violet-500',
  gradient_to TEXT NOT NULL DEFAULT 'to-fuchsia-600',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dropshipper_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  alias TEXT NOT NULL UNIQUE,
  views_count INTEGER DEFAULT 0,
  cart_adds_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.short_link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL REFERENCES public.dropshipper_short_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dropshipper_feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropshipper_id UUID NOT NULL REFERENCES public.dropshippers(id) ON DELETE CASCADE,
  item_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dropshipper_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  custom_title TEXT,
  custom_description TEXT,
  retail_price DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(dropshipper_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.dropshipper_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dropshipper_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropshipper_id UUID NOT NULL REFERENCES public.dropshippers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  method TEXT,
  account TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  admin_note TEXT,
  txn_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dropshipper_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  method TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  admin_note TEXT,
  txn_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','rejected')),
  period_start DATE,
  period_end DATE,
  note TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  change_amount INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stock_reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date TIMESTAMPTZ DEFAULT now(),
  total_products INT NOT NULL,
  mismatches_found INT DEFAULT 0,
  details JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.product_marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_video_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropshipper_id UUID REFERENCES public.dropshippers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('youtube', 'facebook')) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL DEFAULT '',
  message TEXT,
  content TEXT,
  details JSONB,
  metadata JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'low',
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'server',
  error_type TEXT,
  message TEXT NOT NULL DEFAULT '',
  stack TEXT,
  url TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recent_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.ai_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.ai_chat_threads(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'user')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_assistant_configs (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.ai_assistant_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  site_url TEXT NOT NULL,
  consumer_key TEXT NOT NULL,
  consumer_secret TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wp_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES public.wp_connections(id) ON DELETE SET NULL,
  site_label TEXT,
  pages INT NOT NULL DEFAULT 0,
  fetched INT NOT NULL DEFAULT 0,
  inserted INT NOT NULL DEFAULT 0,
  updated INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  status TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement TEXT NOT NULL DEFAULT 'top_bar',
  title TEXT,
  message TEXT NOT NULL DEFAULT '',
  link_url TEXT,
  button_label TEXT,
  bg_color TEXT DEFAULT '#7c3aed',
  text_color TEXT DEFAULT '#ffffff',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dropshipping_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body_md TEXT,
  tone TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- STEP 4: SETTINGS TABLES (singleton rows)
-- ============================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.site_settings (id, settings) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  commission_pct NUMERIC(6,2) NOT NULL DEFAULT 5,
  cookie_days INTEGER NOT NULL DEFAULT 30,
  min_payout NUMERIC(12,2) NOT NULL DEFAULT 500,
  terms TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.affiliate_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.dropshipping_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  default_commission_pct NUMERIC(6,2) NOT NULL DEFAULT 10,
  min_payout NUMERIC(12,2) NOT NULL DEFAULT 500,
  cookie_days INTEGER NOT NULL DEFAULT 30,
  auto_approve_apps BOOLEAN NOT NULL DEFAULT false,
  auto_approve_earnings BOOLEAN NOT NULL DEFAULT false,
  allowed_payout_methods TEXT[] NOT NULL DEFAULT ARRAY['bkash','nagad','bank'],
  terms_md TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.dropshipping_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 5: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

-- ============================================
-- STEP 6: STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-assets', 'vendor-assets', true) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 7: RLS ENABLE
-- ============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropshippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropshipper_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropshipper_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropshipper_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropshipper_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropshipper_short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_link_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropshipper_feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropshipping_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_video_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 8: FUNCTIONS
-- ============================================

-- Check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Get current user's vendor id
CREATE OR REPLACE FUNCTION public.get_my_vendor_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.vendors WHERE user_id = auth.uid() LIMIT 1
$$;

-- Get current user's dropshipper id
CREATE OR REPLACE FUNCTION public.get_my_dropshipper_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.dropshippers WHERE user_id = auth.uid() LIMIT 1
$$;

-- Increment short link metric
CREATE OR REPLACE FUNCTION public.increment_short_link_metric(link_id UUID, metric TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF metric = 'views_count' THEN
    UPDATE public.dropshipper_short_links SET views_count = views_count + 1, last_clicked_at = now() WHERE id = link_id;
  ELSIF metric = 'cart_adds_count' THEN
    UPDATE public.dropshipper_short_links SET cart_adds_count = cart_adds_count + 1 WHERE id = link_id;
  ELSIF metric = 'conversions_count' THEN
    UPDATE public.dropshipper_short_links SET conversions_count = conversions_count + 1 WHERE id = link_id;
  END IF;
END;
$$;

-- Auto-assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'emransha952@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================
-- STEP 9: TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER reviews_updated BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER addresses_updated BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER coupons_updated BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER vendor_payouts_updated_at BEFORE UPDATE ON public.vendor_payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER support_tickets_updated BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- STEP 10: GRANTS
-- ============================================

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT ON public.vendors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;

GRANT SELECT ON public.order_status_history TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_activities TO authenticated;
GRANT ALL ON public.order_activities TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;

GRANT SELECT ON public.order_audit_logs TO authenticated;
GRANT ALL ON public.order_audit_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;

GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;

GRANT INSERT ON public.analytics_events TO authenticated, anon;
GRANT ALL ON public.analytics_events TO service_role;

GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

GRANT SELECT ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshippers TO authenticated;
GRANT ALL ON public.dropshippers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_products TO authenticated;
GRANT ALL ON public.dropshipper_products TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_earnings TO authenticated;
GRANT ALL ON public.dropshipper_earnings TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.dropshipper_payouts TO authenticated;
GRANT ALL ON public.dropshipper_payouts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropshipper_clicks TO authenticated;
GRANT ALL ON public.dropshipper_clicks TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.dropshipper_short_links TO authenticated;
GRANT ALL ON public.dropshipper_short_links TO service_role;

GRANT SELECT, INSERT ON public.short_link_events TO authenticated, anon;
GRANT ALL ON public.short_link_events TO service_role;

GRANT SELECT, INSERT ON public.dropshipper_feed_logs TO authenticated;
GRANT ALL ON public.dropshipper_feed_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;

GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT ALL ON public.affiliate_clicks TO service_role;

GRANT SELECT, INSERT ON public.affiliate_referrals TO authenticated;
GRANT ALL ON public.affiliate_referrals TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.affiliate_commissions TO authenticated;
GRANT ALL ON public.affiliate_commissions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_payouts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_payouts TO authenticated;
GRANT ALL ON public.vendor_payouts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_notifications TO authenticated;
GRANT ALL ON public.vendor_notifications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_logs TO authenticated;
GRANT ALL ON public.stock_logs TO service_role;

GRANT SELECT ON public.product_marketing_assets TO anon, authenticated;
GRANT ALL ON public.product_marketing_assets TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.product_video_reviews TO authenticated;
GRANT ALL ON public.product_video_reviews TO service_role;

GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT ALL ON public.promotions TO service_role;

GRANT SELECT ON public.dropshipping_announcements TO anon, authenticated;
GRANT ALL ON public.dropshipping_announcements TO service_role;

GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recent_views TO authenticated;
GRANT ALL ON public.recent_views TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_threads TO authenticated;
GRANT ALL ON public.ai_chat_threads TO service_role;

GRANT SELECT, INSERT ON public.ai_chat_messages TO authenticated;
GRANT ALL ON public.ai_chat_messages TO service_role;

GRANT ALL ON public.wp_connections TO service_role;
GRANT ALL ON public.wp_sync_logs TO service_role;
GRANT ALL ON public.whatsapp_templates TO service_role;
GRANT SELECT ON public.whatsapp_templates TO authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_vendor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_dropshipper_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_short_link_metric(UUID, TEXT) TO authenticated, service_role, anon;

-- ============================================
-- STEP 11: RLS POLICIES
-- ============================================

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- categories
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- products
CREATE POLICY "Public read active products" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendor manage own products" ON public.products FOR ALL TO authenticated
  USING (vendor_id = public.get_my_vendor_id()) WITH CHECK (vendor_id = public.get_my_vendor_id());

-- vendors
CREATE POLICY "Public can view approved vendors" ON public.vendors FOR SELECT USING (status = 'approved');
CREATE POLICY "Vendor can view own row" ON public.vendors FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can view all vendors" ON public.vendors FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "User can create own vendor application" ON public.vendors FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Vendor can update own row" ON public.vendors FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can manage vendors" ON public.vendors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- orders
CREATE POLICY "Anyone can create order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Vendor view own orders" ON public.orders FOR SELECT TO authenticated USING (vendor_id = public.get_my_vendor_id());
CREATE POLICY "Dropshipper view own orders" ON public.orders FOR SELECT TO authenticated USING (dropshipper_id = public.get_my_dropshipper_id());

-- order_items
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin view order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- order_status_history
CREATE POLICY "public read history" ON public.order_status_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage history" ON public.order_status_history FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- wishlists
CREATE POLICY "own wishlist" ON public.wishlists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reviews
CREATE POLICY "public read reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (is_approved = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "user insert own review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user update own review" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user delete own review" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- addresses
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- coupons
CREATE POLICY "public read active coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage coupons" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- banners
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- notifications
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- admin_notifications
CREATE POLICY "Admin view notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update notifications" ON public.admin_notifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- support_tickets
CREATE POLICY "User view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "User create ticket" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage tickets" ON public.support_tickets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- support_messages
CREATE POLICY "View ticket messages" ON public.support_messages FOR SELECT TO authenticated USING (
  sender_id = auth.uid() OR has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Send ticket messages" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- dropshippers
CREATE POLICY "Dropshippers view own" ON public.dropshippers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Dropshippers insert own" ON public.dropshippers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Dropshippers update own" ON public.dropshippers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin manage dropshippers" ON public.dropshippers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- dropshipper_short_links
CREATE POLICY "Dropshippers manage own short links" ON public.dropshipper_short_links FOR ALL TO authenticated
  USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()))
  WITH CHECK (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));

-- short_link_events
CREATE POLICY "Short link events insertable by anyone" ON public.short_link_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Dropshippers view own events" ON public.short_link_events FOR SELECT TO authenticated
  USING (short_link_id IN (SELECT id FROM public.dropshipper_short_links WHERE dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid())));

-- dropshipper_feed_logs
CREATE POLICY "Dropshippers view own feed logs" ON public.dropshipper_feed_logs FOR SELECT TO authenticated
  USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));

-- dropshipper_products
CREATE POLICY "Dropshipper manage own products" ON public.dropshipper_products FOR ALL TO authenticated
  USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()))
  WITH CHECK (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));

-- dropshipper_earnings
CREATE POLICY "Dropshipper view own earnings" ON public.dropshipper_earnings FOR SELECT TO authenticated
  USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));
CREATE POLICY "Admin manage earnings" ON public.dropshipper_earnings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- dropshipper_payouts
CREATE POLICY "Dropshipper manage own payouts" ON public.dropshipper_payouts FOR ALL TO authenticated
  USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()))
  WITH CHECK (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));
CREATE POLICY "Admin manage dropshipper payouts" ON public.dropshipper_payouts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- affiliates
CREATE POLICY "Affiliates view own" ON public.affiliates FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Affiliates insert own" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manage affiliates" ON public.affiliates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- affiliate_commissions
CREATE POLICY "Affiliate view own commissions" ON public.affiliate_commissions FOR SELECT TO authenticated
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- affiliate_payouts
CREATE POLICY "Affiliate manage own payouts" ON public.affiliate_payouts FOR ALL TO authenticated
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()))
  WITH CHECK (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
CREATE POLICY "Admin manage affiliate payouts" ON public.affiliate_payouts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- vendor_payouts
CREATE POLICY "Vendor reads own payouts" ON public.vendor_payouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));
CREATE POLICY "Admin manages vendor payouts" ON public.vendor_payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- vendor_notifications
CREATE POLICY "Vendor view own notifications" ON public.vendor_notifications FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));
CREATE POLICY "Admin manage vendor notifications" ON public.vendor_notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_video_reviews
CREATE POLICY "Public view approved video reviews" ON public.product_video_reviews FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Dropshipper manage own video reviews" ON public.product_video_reviews FOR ALL TO authenticated
  USING (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()))
  WITH CHECK (dropshipper_id IN (SELECT id FROM public.dropshippers WHERE user_id = auth.uid()));

-- promotions
CREATE POLICY "Public read promotions" ON public.promotions FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage promotions" ON public.promotions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- dropshipping_announcements
CREATE POLICY "Public read announcements" ON public.dropshipping_announcements FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admin manage announcements" ON public.dropshipping_announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_marketing_assets
CREATE POLICY "Public view assets" ON public.product_marketing_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage assets" ON public.product_marketing_assets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- recent_views
CREATE POLICY "own recent views" ON public.recent_views FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_chat_threads
CREATE POLICY "own chat threads" ON public.ai_chat_threads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_chat_messages
CREATE POLICY "own chat messages" ON public.ai_chat_messages FOR ALL TO authenticated
  USING (thread_id IN (SELECT id FROM public.ai_chat_threads WHERE user_id = auth.uid()))
  WITH CHECK (thread_id IN (SELECT id FROM public.ai_chat_threads WHERE user_id = auth.uid()));

-- wp_connections
CREATE POLICY "Admin manage wp connections" ON public.wp_connections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- whatsapp_templates
CREATE POLICY "Admin manage whatsapp templates" ON public.whatsapp_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'products');
CREATE POLICY "Admin upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
CREATE POLICY "User upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public read banners" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'banners');
CREATE POLICY "Admin manage banners storage" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STEP 12: SEED DATA
-- ============================================

-- Default banner slides with real image URLs
INSERT INTO public.banners (placement, title, subtitle, image_url, link_url, sort_order, active, button_label, button_link, gradient_from, gradient_to) VALUES
  ('hero_slider', 'Mobile Mega Offer', 'Best deals on smartphones', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1920&q=80', '/category/electronics', 1, true, 'Shop Now', '/category/electronics', 'from-blue-600', 'to-blue-800'),
  ('hero_slider', 'Fashion Bonanza', 'Up to 70% OFF on trendy styles', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80', '/category/fashion', 2, true, 'Explore Fashion', '/category/fashion', 'from-pink-500', 'to-rose-600'),
  ('hero_slider', 'Home Essentials', 'Quality at your budget', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=80', '/category/home-kitchen', 3, true, 'Shop Home', '/category/home-kitchen', 'from-amber-500', 'to-orange-600'),
  ('hero_side', 'Audio Fest', 'From ৳499', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', '/category/audio-headphones', 1, true, 'Shop Audio', '/category/audio-headphones', 'from-violet-500', 'to-fuchsia-600'),
  ('hero_side', 'Beauty Week', 'Up to 60% OFF', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80', '/category/beauty-personal-care', 2, true, 'Shop Beauty', '/category/beauty-personal-care', 'from-rose-400', 'to-pink-600')
ON CONFLICT DO NOTHING;

-- Default categories
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Electronics', 'electronics', '📱', 1),
  ('Mobile Phones', 'mobile-phones', '📱', 2),
  ('Laptops & Computers', 'laptops-computers', '💻', 3),
  ('Audio & Headphones', 'audio-headphones', '🎧', 4),
  ('Smart Watches', 'smart-watches', '⌚', 5),
  ('Cameras', 'cameras', '📷', 6),
  ('Gaming', 'gaming', '🎮', 7),
  ('Fashion', 'fashion', '👗', 10),
  ('Men\'s Clothing', 'mens-clothing', '👔', 11),
  ('Women\'s Clothing', 'womens-clothing', '👗', 12),
  ('Shoes', 'shoes', '👟', 13),
  ('Bags & Accessories', 'bags-accessories', '👜', 14),
  ('Jewelry', 'jewelry', '💍', 15),
  ('Beauty & Personal Care', 'beauty-personal-care', '💄', 20),
  ('Skincare', 'skincare', '🧴', 21),
  ('Makeup', 'makeup', '💄', 22),
  ('Hair Care', 'hair-care', '🧴', 23),
  ('Fragrances', 'fragrances', '🌸', 24),
  ('Health & Wellness', 'health-wellness', '💊', 30),
  ('Vitamins & Supplements', 'vitamins-supplements', '💊', 31),
  ('Home & Kitchen', 'home-kitchen', '🏠', 40),
  ('Furniture', 'furniture', '🛋️', 41),
  ('Kitchen Appliances', 'kitchen-appliances', '🍳', 42),
  ('Home Decor', 'home-decor', '🕯️', 43),
  ('Bedding & Bath', 'bedding-bath', '🛏️', 44),
  ('Sports & Outdoors', 'sports-outdoors', '⚽', 50),
  ('Fitness', 'fitness', '💪', 51),
  ('Outdoor Recreation', 'outdoor-recreation', '🏕️', 52),
  ('Toys & Games', 'toys-games', '🧸', 60),
  ('Baby & Kids', 'baby-kids', '👶', 61),
  ('Automotive', 'automotive', '🚗', 70)
ON CONFLICT (slug) DO NOTHING;

-- Default WhatsApp templates
INSERT INTO public.whatsapp_templates (status, message) VALUES
  ('pending', 'আপনার অর্ডার {order_number} পাওয়া গেছে। আমরা শীঘ্রই প্রসেস করব।'),
  ('processing', 'আপনার অর্ডার {order_number} প্রসেস হচ্ছে।'),
  ('shipped', 'আপনার অর্ডার {order_number} শিপমেন্ট হয়েছে।'),
  ('delivered', 'আপনার অর্ডার {order_number} ডেলিভারি হয়েছে। ধন্যবাদ!'),
  ('cancelled', 'আপনার অর্ডার {order_number} বাতিল হয়েছে।')
ON CONFLICT (status) DO NOTHING;

-- ============================================
-- DONE!
-- ============================================
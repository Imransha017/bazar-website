-- Migration: Fix dropshipper status update error
-- Date: 2026-08-26
-- This migration adds the missing admin_note column to dropshippers table
-- to prevent trigger errors when updating dropshipper status

ALTER TABLE public.dropshippers 
  ADD COLUMN IF NOT EXISTS admin_note text;

-- Also ensure dropshipper_payouts has the admin_note column (should already exist)
ALTER TABLE public.dropshipper_payouts 
  ADD COLUMN IF NOT EXISTS admin_note text;

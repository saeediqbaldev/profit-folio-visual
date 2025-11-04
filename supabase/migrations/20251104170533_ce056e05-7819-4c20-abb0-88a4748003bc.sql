-- Fix 1: Make trade_screenshots bucket private to prevent unauthorized access
UPDATE storage.buckets 
SET public = false 
WHERE id = 'trade_screenshots';

-- Fix 2: Add missing Risk/Reward (rr) column to trades table
ALTER TABLE public.trades ADD COLUMN rr text;
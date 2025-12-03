-- Add optional trade_date column to trades table
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS trade_date DATE;
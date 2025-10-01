-- Add after_trade_screenshot_url column to trades table
ALTER TABLE public.trades
ADD COLUMN after_trade_screenshot_url TEXT;
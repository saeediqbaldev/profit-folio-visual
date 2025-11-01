-- Add strategy column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS strategy TEXT;
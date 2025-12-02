-- Add strategies column to profiles table for user custom strategies (max 5)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS strategies TEXT[] DEFAULT '{}';

-- Add check constraint to limit to max 5 strategies
ALTER TABLE public.profiles 
ADD CONSTRAINT max_5_strategies CHECK (array_length(strategies, 1) IS NULL OR array_length(strategies, 1) <= 5);
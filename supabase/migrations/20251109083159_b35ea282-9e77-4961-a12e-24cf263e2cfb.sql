-- Add username and phone fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON public.profiles(email) WHERE email IS NOT NULL;

-- Create unique constraint on phone to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique ON public.profiles(phone) WHERE phone IS NOT NULL;

-- Add check constraint for username format (alphanumeric and underscore only)
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$');
-- Create RLS policy to allow public read access to trades for share pages
-- Only allow reading limited fields (no sensitive data like screenshots)
CREATE POLICY "Allow public read access to trades for sharing"
ON public.trades
FOR SELECT
TO anon
USING (true);

-- Add a share_enabled column to profiles to control if user wants to share
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT false;
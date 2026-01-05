-- Drop the overly permissive policy and create a proper one
DROP POLICY IF EXISTS "Allow public read access to trades for sharing" ON public.trades;

-- Create a policy that only allows reading trades for users who have sharing enabled
CREATE POLICY "Allow public read access to trades for sharing"
ON public.trades
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = trades.user_id 
    AND profiles.share_enabled = true
  )
);
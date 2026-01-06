-- Ensure a non-exposed schema exists for security definer helpers
CREATE SCHEMA IF NOT EXISTS private;

-- Allow API roles to reference objects in private schema (function execution)
GRANT USAGE ON SCHEMA private TO anon, authenticated;

-- Helper used by RLS to check whether a user has enabled public sharing.
-- SECURITY DEFINER ensures it can read profiles.share_enabled without requiring public access to profiles.
CREATE OR REPLACE FUNCTION private.is_trade_sharing_enabled(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT share_enabled FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  );
$$;

-- Lock down function execution (don't grant to PUBLIC); only the API roles need it for policy evaluation.
REVOKE ALL ON FUNCTION private.is_trade_sharing_enabled(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_trade_sharing_enabled(uuid) TO anon, authenticated;

-- Replace public trades sharing policy to (1) avoid depending on profiles RLS, and (2) work for both anon + authenticated viewers.
DROP POLICY IF EXISTS "Allow public read access to trades for sharing" ON public.trades;

CREATE POLICY "Allow public read access to trades for sharing"
ON public.trades
FOR SELECT
TO anon, authenticated
USING (private.is_trade_sharing_enabled(trades.user_id));
-- Harden profiles privacy: never allow anonymous reads (even if sharing is enabled)

-- Restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly deny anonymous SELECT (defense-in-depth + scanner clarity)
DROP POLICY IF EXISTS "Deny anonymous read of profiles" ON public.profiles;
CREATE POLICY "Deny anonymous read of profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Also restrict profile mutations to authenticated only
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

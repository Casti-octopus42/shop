
-- 1) Block all direct INSERT/UPDATE on user_roles (privilege escalation fix)
CREATE POLICY "Block direct role insert"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Block direct role update"
ON public.user_roles
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 2) Lock down app_secrets explicitly (deny all client access)
CREATE POLICY "Deny all select on app_secrets"
ON public.app_secrets
FOR SELECT
TO authenticated, anon
USING (false);

CREATE POLICY "Deny all insert on app_secrets"
ON public.app_secrets
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny all update on app_secrets"
ON public.app_secrets
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all delete on app_secrets"
ON public.app_secrets
FOR DELETE
TO authenticated, anon
USING (false);

-- 3) Rotate the hardcoded admin bootstrap key to a random secret value
UPDATE public.app_secrets
SET value = encode(gen_random_bytes(24), 'hex'),
    updated_at = now()
WHERE key = 'admin_bootstrap_key'
  AND value = 'TIPAZA-ADMIN-2026-CHANGE-ME';

-- 4) Secure function so existing admins can grant roles to other users
CREATE OR REPLACE FUNCTION public.grant_role(_target_user uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user, _role)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- 5) Restrict storage bucket: prevent listing/enumeration
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- Make bucket private (files served via direct URL still works through public CDN if public=true,
-- but listing is gated). We'll keep it public for direct access but restrict list operations
-- by requiring an explicit name (non-null). Supabase list uses SELECT with name prefix filter.
-- Safer: keep public=true for direct GET, no SELECT policy needed for public buckets.
UPDATE storage.buckets SET public = true WHERE id = 'product-images';

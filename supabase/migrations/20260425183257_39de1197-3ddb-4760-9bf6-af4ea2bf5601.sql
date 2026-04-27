CREATE OR REPLACE FUNCTION public.can_claim_first_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'::public.app_role
  );
$$;

CREATE UNIQUE INDEX IF NOT EXISTS one_admin_role_only
ON public.user_roles (role)
WHERE role = 'admin'::public.app_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'First user can claim admin role'
  ) THEN
    CREATE POLICY "First user can claim admin role"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = user_id
      AND role = 'admin'::public.app_role
      AND public.can_claim_first_admin()
    );
  END IF;
END $$;
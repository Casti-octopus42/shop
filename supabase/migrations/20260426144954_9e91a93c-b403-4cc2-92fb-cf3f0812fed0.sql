DROP POLICY IF EXISTS "Prevent admin self-deletion" ON public.user_roles;

CREATE POLICY "Admins can delete roles except own admin"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND NOT (role = 'admin'::public.app_role AND user_id = auth.uid())
);
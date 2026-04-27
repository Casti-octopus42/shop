-- 1) Retirer la politique trop permissive
DROP POLICY IF EXISTS "First user can claim admin role" ON public.user_roles;

-- 2) Empêcher un admin de retirer son propre rôle
DROP POLICY IF EXISTS "Prevent admin self-deletion" ON public.user_roles;
CREATE POLICY "Prevent admin self-deletion"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  NOT (role = 'admin'::public.app_role AND user_id = auth.uid())
);

-- 3) Table privée pour stocker la clé admin (jamais exposée via API)
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
-- Aucune policy = personne ne peut lire/écrire via PostgREST. Seules les fonctions SECURITY DEFINER y accèdent.

-- Insérer la clé par défaut (à changer ensuite)
INSERT INTO public.app_secrets (key, value)
VALUES ('admin_bootstrap_key', 'TIPAZA-ADMIN-2026-CHANGE-ME')
ON CONFLICT (key) DO NOTHING;

-- 4) Fonction RPC : exige la clé pour devenir admin
CREATE OR REPLACE FUNCTION public.claim_admin_with_key(_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected_key text;
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  SELECT value INTO expected_key
  FROM public.app_secrets
  WHERE key = 'admin_bootstrap_key';

  IF expected_key IS NULL OR length(expected_key) < 8 THEN
    RAISE EXCEPTION 'Clé admin non configurée';
  END IF;

  IF _key IS NULL OR _key <> expected_key THEN
    RAISE EXCEPTION 'Clé admin invalide';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'admin'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_with_key(text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_admin_with_key(text) TO authenticated;

-- 5) Fonction pour permettre à un admin existant de changer la clé
CREATE OR REPLACE FUNCTION public.rotate_admin_key(_new_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs';
  END IF;

  IF _new_key IS NULL OR length(_new_key) < 8 THEN
    RAISE EXCEPTION 'La clé doit faire au moins 8 caractères';
  END IF;

  UPDATE public.app_secrets
  SET value = _new_key, updated_at = now()
  WHERE key = 'admin_bootstrap_key';

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_admin_key(text) FROM public;
GRANT EXECUTE ON FUNCTION public.rotate_admin_key(text) TO authenticated;
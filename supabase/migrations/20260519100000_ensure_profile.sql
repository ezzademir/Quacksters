-- Ensure every authenticated user has a profile row (fixes sign-in without profile)
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user auth.users%ROWTYPE;
  v_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.profiles (id, full_name, access_role)
  VALUES (
    auth.uid(),
    COALESCE(v_user.raw_user_meta_data->>'full_name', split_part(v_user.email, '@', 1), ''),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated;

-- Fix infinite RLS recursion: policies on profiles must not query profiles under RLS.

CREATE OR REPLACE FUNCTION public.current_access_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT access_role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_assigned_outlet()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT assigned_outlet FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.can_manage_users_for_me()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT public.can_manage_users(
    (SELECT access_role FROM public.profiles WHERE id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_registrations_for_me()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT public.can_manage_registrations(
    (SELECT access_role FROM public.profiles WHERE id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_access_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT (SELECT access_role FROM public.profiles WHERE id = auth.uid()) = 'admin';
$$;

-- Profiles: replace policies that caused recursion
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_select_outlet ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;

CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT USING (
    public.can_manage_users_for_me()
    OR public.current_access_role() = 'exco'
  );

CREATE POLICY profiles_select_outlet ON public.profiles
  FOR SELECT USING (
    public.current_access_role() = 'supervisor'
    AND assigned_outlet IS NOT NULL
    AND assigned_outlet = public.get_my_assigned_outlet()
  );

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (public.is_admin_access_role())
  WITH CHECK (public.is_admin_access_role());

-- Other tables: remove inline profiles subqueries
DROP POLICY IF EXISTS hire_profiles_select_outlet ON public.hire_profiles;
CREATE POLICY hire_profiles_select_outlet ON public.hire_profiles
  FOR SELECT USING (
    public.current_access_role() IN ('supervisor', 'gm')
    AND outlet = public.get_my_assigned_outlet()
  );

DROP POLICY IF EXISTS onboarding_progress_select_outlet ON public.onboarding_progress;
CREATE POLICY onboarding_progress_select_outlet ON public.onboarding_progress
  FOR SELECT USING (
    public.current_access_role() IN ('supervisor', 'gm')
    AND user_id IN (
      SELECT hp.user_id FROM public.hire_profiles hp
      WHERE hp.outlet = public.get_my_assigned_outlet()
    )
  );

DROP POLICY IF EXISTS pending_registrations_select_admin ON public.pending_registrations;
CREATE POLICY pending_registrations_select_admin ON public.pending_registrations
  FOR SELECT USING (public.can_manage_registrations_for_me());

DROP POLICY IF EXISTS pending_registrations_update_admin ON public.pending_registrations;
CREATE POLICY pending_registrations_update_admin ON public.pending_registrations
  FOR UPDATE USING (public.can_manage_registrations_for_me());

DROP POLICY IF EXISTS hire_profiles_select_admin ON public.hire_profiles;
CREATE POLICY hire_profiles_select_admin ON public.hire_profiles
  FOR SELECT USING (public.can_manage_users_for_me());

DROP POLICY IF EXISTS hire_profiles_insert_admin ON public.hire_profiles;
CREATE POLICY hire_profiles_insert_admin ON public.hire_profiles
  FOR INSERT WITH CHECK (public.can_manage_registrations_for_me());

DROP POLICY IF EXISTS hire_profiles_update_admin ON public.hire_profiles;
CREATE POLICY hire_profiles_update_admin ON public.hire_profiles
  FOR UPDATE USING (public.can_manage_registrations_for_me());

DROP POLICY IF EXISTS onboarding_progress_select_admin ON public.onboarding_progress;
CREATE POLICY onboarding_progress_select_admin ON public.onboarding_progress
  FOR SELECT USING (public.can_manage_users_for_me());

GRANT EXECUTE ON FUNCTION public.get_my_assigned_outlet() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_users_for_me() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_registrations_for_me() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_access_role() TO authenticated;

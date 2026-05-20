-- PostgreSQL does not allow CREATE OR REPLACE when RETURNS TABLE (...) columns change (42P13).
-- admin_list_users gained password_reset_required; drop and recreate cleanly.

DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  access_role text,
  assigned_outlet text,
  last_login timestamptz,
  created_at timestamptz,
  job_role text,
  hire_outlet text,
  start_date date,
  buddy text,
  hire_supervisor text,
  confirmed_at timestamptz,
  password_reset_required boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_role text;
  v_outlet text;
BEGIN
  v_role := public.current_access_role();
  v_outlet := public.get_my_assigned_outlet();

  IF NOT (public.can_manage_users(v_role) OR v_role = 'exco') THEN
    RAISE EXCEPTION 'Insufficient permissions to list users';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    p.full_name,
    p.access_role,
    p.assigned_outlet,
    p.last_login,
    p.created_at,
    hp.job_role,
    hp.outlet,
    hp.start_date,
    hp.buddy,
    hp.supervisor,
    hp.confirmed_at,
    p.password_reset_required
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.hire_profiles hp ON hp.user_id = p.id
  WHERE
    v_role IN ('admin', 'hr_ops', 'exco')
    OR (v_role = 'gm' AND (p.assigned_outlet = v_outlet OR hp.outlet = v_outlet))
    OR (v_role = 'supervisor' AND (p.assigned_outlet = v_outlet OR hp.outlet = v_outlet))
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

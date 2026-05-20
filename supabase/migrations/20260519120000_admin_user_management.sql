-- Admin user management RPCs (bypass RLS safely with permission checks)

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
  confirmed_at timestamptz
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
    hp.confirmed_at
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

CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_access_role text DEFAULT NULL,
  p_assigned_outlet text DEFAULT NULL,
  p_job_role text DEFAULT NULL,
  p_hire_outlet text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_buddy text DEFAULT NULL,
  p_hire_supervisor text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_role text;
  v_target_role text;
BEGIN
  v_role := public.current_access_role();

  IF v_role NOT IN ('admin', 'hr_ops') THEN
    RAISE EXCEPTION 'Only admin or HR ops can update users';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User id is required';
  END IF;

  IF p_access_role IS NOT NULL AND NOT public.is_valid_access_role(p_access_role) THEN
    RAISE EXCEPTION 'Invalid access role';
  END IF;

  IF p_job_role IS NOT NULL AND NOT public.is_valid_job_role(p_job_role) THEN
    RAISE EXCEPTION 'Invalid job role';
  END IF;

  SELECT access_role INTO v_target_role FROM public.profiles WHERE id = p_user_id;
  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_target_role := COALESCE(p_access_role, v_target_role);

  IF v_target_role = 'supervisor' AND COALESCE(p_assigned_outlet, (
    SELECT assigned_outlet FROM public.profiles WHERE id = p_user_id
  )) IS NULL THEN
    RAISE EXCEPTION 'Supervisor role requires an assigned outlet';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(NULLIF(trim(p_full_name), ''), full_name),
    access_role = COALESCE(p_access_role, access_role),
    assigned_outlet = CASE
      WHEN p_assigned_outlet IS NOT NULL THEN NULLIF(p_assigned_outlet, '')
      ELSE assigned_outlet
    END,
    updated_at = now()
  WHERE id = p_user_id;

  IF v_target_role = 'hire' THEN
    IF NOT EXISTS (SELECT 1 FROM public.hire_profiles WHERE user_id = p_user_id) THEN
      IF p_job_role IS NULL OR p_hire_outlet IS NULL OR p_start_date IS NULL THEN
        RAISE EXCEPTION 'Hire users require job role, outlet, and start date';
      END IF;
    END IF;

    INSERT INTO public.hire_profiles (
      user_id, job_role, outlet, start_date, buddy, supervisor
    )
    VALUES (
      p_user_id,
      COALESCE(p_job_role, (SELECT job_role FROM public.hire_profiles WHERE user_id = p_user_id)),
      COALESCE(p_hire_outlet, (SELECT outlet FROM public.hire_profiles WHERE user_id = p_user_id)),
      COALESCE(p_start_date, (SELECT start_date FROM public.hire_profiles WHERE user_id = p_user_id)),
      COALESCE(
        NULLIF(trim(p_buddy), ''),
        (SELECT buddy FROM public.hire_profiles WHERE user_id = p_user_id),
        'Assigned on Day 1'
      ),
      COALESCE(
        NULLIF(trim(p_hire_supervisor), ''),
        (SELECT supervisor FROM public.hire_profiles WHERE user_id = p_user_id),
        'Outlet Supervisor'
      )
    )
    ON CONFLICT (user_id) DO UPDATE SET
      job_role = COALESCE(EXCLUDED.job_role, public.hire_profiles.job_role),
      outlet = COALESCE(EXCLUDED.outlet, public.hire_profiles.outlet),
      start_date = COALESCE(EXCLUDED.start_date, public.hire_profiles.start_date),
      buddy = COALESCE(EXCLUDED.buddy, public.hire_profiles.buddy),
      supervisor = COALESCE(EXCLUDED.supervisor, public.hire_profiles.supervisor),
      updated_at = now();

    INSERT INTO public.onboarding_progress (user_id, completed_task_ids, last_updated)
    VALUES (p_user_id, '[]'::jsonb, now())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user TO authenticated;

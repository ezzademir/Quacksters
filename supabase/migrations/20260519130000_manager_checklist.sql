-- Manager checklist progress + outlet-scoped hire listing

CREATE TABLE IF NOT EXISTS public.manager_checklist_progress (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  outlet text,
  completed_task_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manager_checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY manager_checklist_select_own ON public.manager_checklist_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY manager_checklist_insert_own ON public.manager_checklist_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY manager_checklist_update_own ON public.manager_checklist_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY manager_checklist_select_admin ON public.manager_checklist_progress
  FOR SELECT TO authenticated
  USING (public.is_admin_access_role());

GRANT SELECT, INSERT, UPDATE ON public.manager_checklist_progress TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_outlet_hires(p_outlet text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  job_role text,
  outlet text,
  start_date date,
  progress_pct integer,
  completed_tasks integer,
  total_hire_tasks integer
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
  v_scope_outlet text;
BEGIN
  v_role := public.current_access_role();
  v_outlet := public.get_my_assigned_outlet();
  v_scope_outlet := COALESCE(NULLIF(trim(p_outlet), ''), v_outlet);

  IF v_role NOT IN ('admin', 'hr_ops', 'gm', 'exco', 'supervisor') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  IF v_role IN ('gm', 'supervisor', 'exco', 'hr_ops') THEN
    IF v_outlet IS NULL THEN
      RAISE EXCEPTION 'An assigned outlet is required for your role';
    END IF;
    IF v_scope_outlet IS DISTINCT FROM v_outlet THEN
      RAISE EXCEPTION 'You can only view hires for your assigned outlet';
    END IF;
  END IF;

  IF v_scope_outlet IS NULL THEN
    RAISE EXCEPTION 'Outlet is required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    hp.job_role,
    hp.outlet,
    hp.start_date,
    0::integer,
    COALESCE(jsonb_array_length(op.completed_task_ids), 0)::integer,
    0::integer
  FROM public.profiles p
  JOIN public.hire_profiles hp ON hp.user_id = p.id
  LEFT JOIN public.onboarding_progress op ON op.user_id = p.id
  WHERE p.access_role = 'hire'
    AND hp.outlet = v_scope_outlet
  ORDER BY hp.start_date DESC;
END;
$$;

-- Tighten user listing: EXCO and HR ops respect assigned_outlet when set
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
    v_role = 'admin'
    OR (v_role = 'hr_ops' AND (
      v_outlet IS NULL
      OR p.assigned_outlet = v_outlet
      OR hp.outlet = v_outlet
    ))
    OR (v_role = 'exco' AND (
      v_outlet IS NULL
      OR p.assigned_outlet = v_outlet
      OR hp.outlet = v_outlet
    ))
    OR (v_role = 'gm' AND (p.assigned_outlet = v_outlet OR hp.outlet = v_outlet))
    OR (v_role = 'supervisor' AND (p.assigned_outlet = v_outlet OR hp.outlet = v_outlet))
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_outlet_hires(text) TO authenticated;

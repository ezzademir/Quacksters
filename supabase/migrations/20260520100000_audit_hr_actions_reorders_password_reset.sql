-- Audit visibility for HR Ops; richer audit RPC; approve/reject/user update auditing;
-- programme list reorder RPCs; password reset toggle on profiles.

-- ---------------------------------------------------------------------------
-- Expand audit SELECT to admin + HR Ops; allow both roles to write audit rows via log_admin_action.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_log_select_admin ON public.admin_audit_log;

CREATE POLICY audit_log_select_auditors ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.current_access_role() IN ('admin', 'hr_ops'));

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF public.current_access_role() NOT IN ('admin', 'hr_ops') THEN
    RETURN;
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_audit_log(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  action text,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz,
  actor_id uuid,
  actor_name text,
  actor_email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF public.current_access_role() NOT IN ('admin', 'hr_ops') THEN
    RAISE EXCEPTION 'Insufficient permissions to view audit log';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.action,
    a.entity_type,
    a.entity_id,
    a.details,
    a.created_at,
    a.actor_id,
    COALESCE(p.full_name, ''::text) AS actor_name,
    COALESCE(au.email::text, ''::text) AS actor_email
  FROM public.admin_audit_log a
  LEFT JOIN public.profiles p ON p.id = a.actor_id
  LEFT JOIN auth.users au ON au.id = a.actor_id
  ORDER BY a.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_audit_log(integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- Approve / reject registration — audit trail
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_registration(
  p_registration_id uuid,
  p_access_role text,
  p_assigned_outlet text DEFAULT NULL,
  p_job_role text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_buddy text DEFAULT '',
  p_supervisor text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_reviewer_role text;
  v_user_id uuid;
BEGIN
  v_reviewer_role := public.current_access_role();
  IF NOT public.can_manage_registrations(v_reviewer_role) THEN
    RAISE EXCEPTION 'Insufficient permissions to approve registrations';
  END IF;

  IF NOT public.is_valid_access_role(p_access_role) OR p_access_role = 'pending' THEN
    RAISE EXCEPTION 'Invalid access role for approval';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.pending_registrations
  WHERE id = p_registration_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Registration not found or already reviewed';
  END IF;

  UPDATE public.profiles
  SET
    access_role = p_access_role,
    assigned_outlet = p_assigned_outlet,
    updated_at = now()
  WHERE id = v_user_id;

  IF p_access_role = 'hire' THEN
    IF p_job_role IS NULL OR p_start_date IS NULL OR p_assigned_outlet IS NULL THEN
      RAISE EXCEPTION 'Hire approval requires job role, outlet, and start date';
    END IF;

    INSERT INTO public.hire_profiles (user_id, job_role, outlet, start_date, buddy, supervisor)
    VALUES (v_user_id, p_job_role, p_assigned_outlet, p_start_date, COALESCE(p_buddy, ''), COALESCE(p_supervisor, ''))
    ON CONFLICT (user_id) DO UPDATE SET
      job_role = EXCLUDED.job_role,
      outlet = EXCLUDED.outlet,
      start_date = EXCLUDED.start_date,
      buddy = EXCLUDED.buddy,
      supervisor = EXCLUDED.supervisor,
      updated_at = now();

    INSERT INTO public.onboarding_progress (user_id, completed_task_ids, last_updated)
    VALUES (v_user_id, '[]'::jsonb, now())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  UPDATE public.pending_registrations
  SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_registration_id;

  PERFORM public.log_admin_action(
    'approve',
    'registration',
    p_registration_id::text,
    jsonb_build_object(
      'user_id', v_user_id,
      'access_role', p_access_role,
      'assigned_outlet', p_assigned_outlet,
      'job_role', p_job_role,
      'start_date', p_start_date
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_registration(
  p_registration_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_reviewer_role text;
  v_user_id uuid;
BEGIN
  v_reviewer_role := public.current_access_role();
  IF NOT public.can_manage_registrations(v_reviewer_role) THEN
    RAISE EXCEPTION 'Insufficient permissions to reject registrations';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.pending_registrations
  WHERE id = p_registration_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Registration not found or already reviewed';
  END IF;

  UPDATE public.pending_registrations
  SET
    status = 'rejected',
    rejection_reason = p_reason,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_registration_id;

  PERFORM public.log_admin_action(
    'reject',
    'registration',
    p_registration_id::text,
    jsonb_build_object('user_id', v_user_id, 'reason', p_reason)
  );
END;
$$;

-- admin_list_users is recreated in 20260520100500_fix_admin_list_users_signature.sql

-- ---------------------------------------------------------------------------
-- admin_update_user (password_reset_required + audit)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_update_user(uuid, text, text, text, text, text, date, text, text);

CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_access_role text DEFAULT NULL,
  p_assigned_outlet text DEFAULT NULL,
  p_job_role text DEFAULT NULL,
  p_hire_outlet text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_buddy text DEFAULT NULL,
  p_hire_supervisor text DEFAULT NULL,
  p_password_reset_required boolean DEFAULT NULL
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
    password_reset_required = CASE
      WHEN p_password_reset_required IS NULL THEN password_reset_required
      ELSE p_password_reset_required
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

  PERFORM public.log_admin_action(
    'update_user',
    'profile',
    p_user_id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'full_name', NULLIF(trim(p_full_name), ''),
      'access_role', p_access_role,
      'assigned_outlet', p_assigned_outlet,
      'job_role', p_job_role,
      'hire_outlet', p_hire_outlet,
      'start_date', p_start_date::text,
      'password_reset_required', p_password_reset_required
    ))
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Programme reorder: phases, resources, contacts, feedback
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reorder_phases(p_phase_ids text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  i int;
BEGIN
  PERFORM public.assert_admin_role();

  IF p_phase_ids IS NULL OR array_length(p_phase_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Phase ids required';
  END IF;

  FOR i IN 1 .. array_length(p_phase_ids, 1)
  LOOP
    UPDATE public.onboarding_phases
    SET sort_order = i - 1, updated_at = now()
    WHERE id = p_phase_ids[i];
  END LOOP;

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reorder_resources(p_resource_ids text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  i int;
BEGIN
  PERFORM public.assert_admin_role();

  IF p_resource_ids IS NULL OR array_length(p_resource_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Resource ids required';
  END IF;

  FOR i IN 1 .. array_length(p_resource_ids, 1)
  LOOP
    UPDATE public.onboarding_resources
    SET sort_order = i - 1
    WHERE id = p_resource_ids[i];
  END LOOP;

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reorder_contacts(p_contact_ids text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  i int;
BEGIN
  PERFORM public.assert_admin_role();

  IF p_contact_ids IS NULL OR array_length(p_contact_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Contact ids required';
  END IF;

  FOR i IN 1 .. array_length(p_contact_ids, 1)
  LOOP
    UPDATE public.onboarding_contacts
    SET sort_order = i - 1
    WHERE id = p_contact_ids[i];
  END LOOP;

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reorder_feedback_schedule(p_feedback_ids text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  i int;
BEGIN
  PERFORM public.assert_admin_role();

  IF p_feedback_ids IS NULL OR array_length(p_feedback_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Feedback ids required';
  END IF;

  FOR i IN 1 .. array_length(p_feedback_ids, 1)
  LOOP
    UPDATE public.onboarding_feedback_schedule
    SET sort_order = i - 1
    WHERE id = p_feedback_ids[i];
  END LOOP;

  RETURN public.get_programme();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reorder_phases(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reorder_resources(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reorder_contacts(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reorder_feedback_schedule(text[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- Re-grant admin_update_user (signature expanded)
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid, text, text, text, text, text, date, text, text, boolean) TO authenticated;

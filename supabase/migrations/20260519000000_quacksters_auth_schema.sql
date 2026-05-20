-- Quacksters auth, registration, and onboarding schema

-- Access roles aligned to QT-HR-OPS-001 stakeholder codes
CREATE OR REPLACE FUNCTION public.is_valid_access_role(role text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT role = ANY (ARRAY[
    'pending', 'hire', 'supervisor', 'gm', 'exco', 'hr_ops', 'admin'
  ]::text[]);
$$;

CREATE OR REPLACE FUNCTION public.is_valid_job_role(role text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT role = ANY (ARRAY['cook', 'cashier', 'supervisor']::text[]);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_users(role text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT role = ANY (ARRAY['admin', 'hr_ops', 'gm']::text[]);
$$;

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  access_role text NOT NULL DEFAULT 'pending',
  assigned_outlet text,
  last_login timestamptz,
  password_reset_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_access_role_check CHECK (public.is_valid_access_role(access_role)),
  CONSTRAINT profiles_supervisor_requires_outlet CHECK (
    access_role <> 'supervisor' OR assigned_outlet IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS profiles_access_role_idx ON public.profiles(access_role);
CREATE INDEX IF NOT EXISTS profiles_assigned_outlet_idx ON public.profiles(assigned_outlet);

-- Pending self-registrations awaiting HR approval
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  requested_outlet text,
  requested_job_role text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pending_registrations_status_check CHECK (
    status = ANY (ARRAY['pending', 'approved', 'rejected']::text[])
  ),
  CONSTRAINT pending_registrations_job_role_check CHECK (
    requested_job_role IS NULL OR public.is_valid_job_role(requested_job_role)
  )
);

CREATE INDEX IF NOT EXISTS pending_registrations_status_idx ON public.pending_registrations(status);

-- HR-assigned hire onboarding profile
CREATE TABLE IF NOT EXISTS public.hire_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  job_role text NOT NULL,
  outlet text NOT NULL,
  start_date date NOT NULL,
  buddy text NOT NULL DEFAULT '',
  supervisor text NOT NULL DEFAULT '',
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hire_profiles_job_role_check CHECK (public.is_valid_job_role(job_role))
);

CREATE INDEX IF NOT EXISTS hire_profiles_outlet_idx ON public.hire_profiles(outlet);

-- Server-synced onboarding task progress
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_task_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.current_access_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT access_role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_role(role text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT role = ANY (ARRAY['admin', 'hr_ops', 'gm', 'exco', 'supervisor']::text[]);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_registrations(role text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT role = ANY (ARRAY['admin', 'hr_ops']::text[]);
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, access_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pending_registrations_updated_at ON public.pending_registrations;
CREATE TRIGGER pending_registrations_updated_at
  BEFORE UPDATE ON public.pending_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS hire_profiles_updated_at ON public.hire_profiles;
CREATE TRIGGER hire_profiles_updated_at
  BEFORE UPDATE ON public.hire_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Approve registration (atomic)
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
END;
$$;

-- Reject registration
CREATE OR REPLACE FUNCTION public.reject_registration(
  p_registration_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
END;
$$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT USING (
    public.can_manage_users(public.current_access_role())
    OR public.current_access_role() = 'exco'
  );

CREATE POLICY profiles_select_outlet ON public.profiles
  FOR SELECT USING (
    public.current_access_role() = 'supervisor'
    AND assigned_outlet IS NOT NULL
    AND assigned_outlet = (SELECT assigned_outlet FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE USING (public.current_access_role() = 'admin')
  WITH CHECK (public.current_access_role() = 'admin');

-- Pending registrations policies
CREATE POLICY pending_registrations_insert_own ON public.pending_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY pending_registrations_select_own ON public.pending_registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY pending_registrations_select_admin ON public.pending_registrations
  FOR SELECT USING (public.can_manage_registrations(public.current_access_role()));

CREATE POLICY pending_registrations_update_admin ON public.pending_registrations
  FOR UPDATE USING (public.can_manage_registrations(public.current_access_role()));

-- Hire profiles policies
CREATE POLICY hire_profiles_select_own ON public.hire_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY hire_profiles_select_admin ON public.hire_profiles
  FOR SELECT USING (public.can_manage_users(public.current_access_role()));

CREATE POLICY hire_profiles_select_outlet ON public.hire_profiles
  FOR SELECT USING (
    public.current_access_role() IN ('supervisor', 'gm')
    AND outlet = (SELECT assigned_outlet FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY hire_profiles_select_exco ON public.hire_profiles
  FOR SELECT USING (public.current_access_role() = 'exco');

CREATE POLICY hire_profiles_update_own ON public.hire_profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY hire_profiles_insert_admin ON public.hire_profiles
  FOR INSERT WITH CHECK (public.can_manage_registrations(public.current_access_role()));

CREATE POLICY hire_profiles_update_admin ON public.hire_profiles
  FOR UPDATE USING (public.can_manage_registrations(public.current_access_role()));

-- Onboarding progress policies
CREATE POLICY onboarding_progress_select_own ON public.onboarding_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY onboarding_progress_select_admin ON public.onboarding_progress
  FOR SELECT USING (public.can_manage_users(public.current_access_role()));

CREATE POLICY onboarding_progress_select_outlet ON public.onboarding_progress
  FOR SELECT USING (
    public.current_access_role() IN ('supervisor', 'gm')
    AND user_id IN (
      SELECT hp.user_id FROM public.hire_profiles hp
      WHERE hp.outlet = (SELECT assigned_outlet FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY onboarding_progress_select_exco ON public.onboarding_progress
  FOR SELECT USING (public.current_access_role() = 'exco');

CREATE POLICY onboarding_progress_insert_own ON public.onboarding_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY onboarding_progress_update_own ON public.onboarding_progress
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pending_registrations TO authenticated;
GRANT SELECT, UPDATE ON public.hire_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.onboarding_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_registration TO authenticated;

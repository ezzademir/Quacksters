-- Programme content CMS: normalized onboarding content tables

CREATE TABLE IF NOT EXISTS public.onboarding_phases (
  id text PRIMARY KEY,
  number integer NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  day_range text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_phase_role_copy (
  phase_id text NOT NULL REFERENCES public.onboarding_phases (id) ON DELETE CASCADE,
  role text NOT NULL,
  description text NOT NULL DEFAULT '',
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (phase_id, role)
);

CREATE TABLE IF NOT EXISTS public.onboarding_sections (
  id text PRIMARY KEY,
  phase_id text NOT NULL REFERENCES public.onboarding_phases (id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id text PRIMARY KEY,
  section_id text NOT NULL REFERENCES public.onboarding_sections (id) ON DELETE CASCADE,
  title text NOT NULL,
  why_it_matters text,
  how_to text,
  owner text NOT NULL,
  roles text[] NOT NULL DEFAULT '{all}',
  audience text NOT NULL DEFAULT 'hire',
  title_hire text,
  why_it_matters_hire text,
  how_to_hire text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.onboarding_resources (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  reference text,
  url text,
  owner text,
  roles text[] NOT NULL DEFAULT '{all}',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.onboarding_contacts (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  owner_code text NOT NULL,
  responsibility text NOT NULL DEFAULT '',
  contact_hint text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.onboarding_feedback_schedule (
  id text PRIMARY KEY,
  day_label text NOT NULL,
  day_number integer NOT NULL,
  method text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.onboarding_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_phase_role_copy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_feedback_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_phases_select ON public.onboarding_phases
  FOR SELECT TO authenticated USING (true);
CREATE POLICY onboarding_phase_role_copy_select ON public.onboarding_phase_role_copy
  FOR SELECT TO authenticated USING (true);
CREATE POLICY onboarding_sections_select ON public.onboarding_sections
  FOR SELECT TO authenticated USING (true);
CREATE POLICY onboarding_tasks_select ON public.onboarding_tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY onboarding_resources_select ON public.onboarding_resources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY onboarding_contacts_select ON public.onboarding_contacts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY onboarding_feedback_schedule_select ON public.onboarding_feedback_schedule
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.onboarding_phases TO authenticated;
GRANT SELECT ON public.onboarding_phase_role_copy TO authenticated;
GRANT SELECT ON public.onboarding_sections TO authenticated;
GRANT SELECT ON public.onboarding_tasks TO authenticated;
GRANT SELECT ON public.onboarding_resources TO authenticated;
GRANT SELECT ON public.onboarding_contacts TO authenticated;
GRANT SELECT ON public.onboarding_feedback_schedule TO authenticated;

CREATE OR REPLACE FUNCTION public.assert_admin_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_access_role() <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.task_id_in_use(p_task_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.onboarding_progress op
    WHERE op.completed_task_ids ? p_task_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.manager_checklist_progress mcp
    WHERE mcp.completed_task_ids ? p_task_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_programme()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_phases jsonb;
  v_resources jsonb;
  v_contacts jsonb;
  v_feedback jsonb;
  v_updated timestamptz;
BEGIN
  SELECT COALESCE(
    jsonb_agg(phase_row ORDER BY phase_row->>'sortOrder'),
    '[]'::jsonb
  )
  INTO v_phases
  FROM (
    SELECT jsonb_build_object(
      'id', p.id,
      'number', p.number,
      'title', p.title,
      'subtitle', p.subtitle,
      'dayRange', p.day_range,
      'description', p.description,
      'milestones', p.milestones,
      'descriptionByRole', COALESCE((
        SELECT jsonb_object_agg(rc.role, rc.description)
        FROM public.onboarding_phase_role_copy rc
        WHERE rc.phase_id = p.id
      ), '{}'::jsonb),
      'milestonesByRole', COALESCE((
        SELECT jsonb_object_agg(rc.role, rc.milestones)
        FROM public.onboarding_phase_role_copy rc
        WHERE rc.phase_id = p.id AND jsonb_array_length(rc.milestones) > 0
      ), '{}'::jsonb),
      'sortOrder', p.sort_order,
      'sections', COALESCE((
        SELECT jsonb_agg(section_row ORDER BY section_row->>'sortOrder')
        FROM (
          SELECT jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'subtitle', s.subtitle,
            'sortOrder', s.sort_order,
            'tasks', COALESCE((
              SELECT jsonb_agg(task_row ORDER BY task_row->>'sortOrder')
              FROM (
                SELECT jsonb_build_object(
                  'id', t.id,
                  'title', t.title,
                  'whyItMatters', t.why_it_matters,
                  'howTo', t.how_to,
                  'owner', t.owner,
                  'roles', to_jsonb(t.roles),
                  'audience', t.audience,
                  'titleHire', t.title_hire,
                  'whyItMattersHire', t.why_it_matters_hire,
                  'howToHire', t.how_to_hire,
                  'sortOrder', t.sort_order
                ) AS task_row
                FROM public.onboarding_tasks t
                WHERE t.section_id = s.id
              ) tasks_sub
            ), '[]'::jsonb)
          ) AS section_row
          FROM public.onboarding_sections s
          WHERE s.phase_id = p.id
        ) sections_sub
      ), '[]'::jsonb)
    ) AS phase_row
    FROM public.onboarding_phases p
  ) phases_sub;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'title', r.title,
        'description', r.description,
        'category', r.category,
        'reference', r.reference,
        'url', r.url,
        'owner', r.owner,
        'roles', to_jsonb(r.roles),
        'sortOrder', r.sort_order
      )
      ORDER BY r.sort_order
    ),
    '[]'::jsonb
  )
  INTO v_resources
  FROM public.onboarding_resources r;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'role', c.role,
        'ownerCode', c.owner_code,
        'responsibility', c.responsibility,
        'contactHint', c.contact_hint,
        'sortOrder', c.sort_order
      )
      ORDER BY c.sort_order
    ),
    '[]'::jsonb
  )
  INTO v_contacts
  FROM public.onboarding_contacts c;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', f.id,
        'day', f.day_label,
        'dayNumber', f.day_number,
        'method', f.method,
        'owner', f.owner,
        'sortOrder', f.sort_order
      )
      ORDER BY f.sort_order
    ),
    '[]'::jsonb
  )
  INTO v_feedback
  FROM public.onboarding_feedback_schedule f;

  SELECT GREATEST(
    COALESCE((SELECT MAX(updated_at) FROM public.onboarding_phases), 'epoch'::timestamptz),
    now()
  )
  INTO v_updated;

  RETURN jsonb_build_object(
    'phases', v_phases,
    'resources', v_resources,
    'contacts', v_contacts,
    'feedbackSchedule', v_feedback,
    'updatedAt', to_char(v_updated, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_programme() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assert_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.task_id_in_use(text) TO authenticated;

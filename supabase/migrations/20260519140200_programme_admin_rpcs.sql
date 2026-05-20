-- Admin programme CMS write RPCs (admin role only)

CREATE OR REPLACE FUNCTION public.admin_upsert_phase(
  p_id text,
  p_number integer,
  p_title text,
  p_subtitle text DEFAULT '',
  p_day_range text DEFAULT '',
  p_description text DEFAULT '',
  p_milestones jsonb DEFAULT '[]'::jsonb,
  p_sort_order integer DEFAULT 0,
  p_description_by_role jsonb DEFAULT '{}'::jsonb,
  p_milestones_by_role jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();

  INSERT INTO public.onboarding_phases (
    id, number, title, subtitle, day_range, description, milestones, sort_order, updated_at
  )
  VALUES (
    p_id, p_number, p_title, p_subtitle, p_day_range, p_description, p_milestones, p_sort_order, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    number = EXCLUDED.number,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    day_range = EXCLUDED.day_range,
    description = EXCLUDED.description,
    milestones = EXCLUDED.milestones,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

  DELETE FROM public.onboarding_phase_role_copy WHERE phase_id = p_id;

  INSERT INTO public.onboarding_phase_role_copy (phase_id, role, description, milestones)
  SELECT
    p_id,
    key,
    COALESCE(value #>> '{}', ''),
    COALESCE(p_milestones_by_role -> key, '[]'::jsonb)
  FROM jsonb_each(COALESCE(p_description_by_role, '{}'::jsonb))
  WHERE key IN ('cook', 'cashier', 'supervisor');

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_phase(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_task_id text;
BEGIN
  PERFORM public.assert_admin_role();

  FOR v_task_id IN
    SELECT t.id
    FROM public.onboarding_tasks t
    JOIN public.onboarding_sections s ON s.id = t.section_id
    WHERE s.phase_id = p_id
  LOOP
    IF public.task_id_in_use(v_task_id) THEN
      RAISE EXCEPTION 'Cannot delete phase: task % is referenced in user progress', v_task_id;
    END IF;
  END LOOP;

  DELETE FROM public.onboarding_phases WHERE id = p_id;
  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_section(
  p_id text,
  p_phase_id text,
  p_title text,
  p_subtitle text DEFAULT '',
  p_sort_order integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();

  INSERT INTO public.onboarding_sections (id, phase_id, title, subtitle, sort_order)
  VALUES (p_id, p_phase_id, p_title, p_subtitle, p_sort_order)
  ON CONFLICT (id) DO UPDATE SET
    phase_id = EXCLUDED.phase_id,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    sort_order = EXCLUDED.sort_order;

  UPDATE public.onboarding_phases SET updated_at = now() WHERE id = p_phase_id;
  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_section(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_task_id text;
  v_phase_id text;
BEGIN
  PERFORM public.assert_admin_role();

  SELECT phase_id INTO v_phase_id FROM public.onboarding_sections WHERE id = p_id;

  FOR v_task_id IN
    SELECT id FROM public.onboarding_tasks WHERE section_id = p_id
  LOOP
    IF public.task_id_in_use(v_task_id) THEN
      RAISE EXCEPTION 'Cannot delete section: task % is referenced in user progress', v_task_id;
    END IF;
  END LOOP;

  DELETE FROM public.onboarding_sections WHERE id = p_id;
  IF v_phase_id IS NOT NULL THEN
    UPDATE public.onboarding_phases SET updated_at = now() WHERE id = v_phase_id;
  END IF;
  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reorder_sections(
  p_phase_id text,
  p_section_ids text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  i integer;
BEGIN
  PERFORM public.assert_admin_role();

  FOR i IN 1..COALESCE(array_length(p_section_ids, 1), 0) LOOP
    UPDATE public.onboarding_sections
    SET sort_order = i - 1
    WHERE id = p_section_ids[i] AND phase_id = p_phase_id;
  END LOOP;

  UPDATE public.onboarding_phases SET updated_at = now() WHERE id = p_phase_id;
  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_task(
  p_id text,
  p_section_id text,
  p_title text,
  p_why_it_matters text DEFAULT NULL,
  p_how_to text DEFAULT NULL,
  p_owner text DEFAULT 'SUP',
  p_roles text[] DEFAULT '{all}',
  p_audience text DEFAULT 'hire',
  p_title_hire text DEFAULT NULL,
  p_why_it_matters_hire text DEFAULT NULL,
  p_how_to_hire text DEFAULT NULL,
  p_sort_order integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_phase_id text;
BEGIN
  PERFORM public.assert_admin_role();

  INSERT INTO public.onboarding_tasks (
    id, section_id, title, why_it_matters, how_to, owner, roles, audience,
    title_hire, why_it_matters_hire, how_to_hire, sort_order
  )
  VALUES (
    p_id, p_section_id, p_title, p_why_it_matters, p_how_to, p_owner, p_roles, p_audience,
    p_title_hire, p_why_it_matters_hire, p_how_to_hire, p_sort_order
  )
  ON CONFLICT (id) DO UPDATE SET
    section_id = EXCLUDED.section_id,
    title = EXCLUDED.title,
    why_it_matters = EXCLUDED.why_it_matters,
    how_to = EXCLUDED.how_to,
    owner = EXCLUDED.owner,
    roles = EXCLUDED.roles,
    audience = EXCLUDED.audience,
    title_hire = EXCLUDED.title_hire,
    why_it_matters_hire = EXCLUDED.why_it_matters_hire,
    how_to_hire = EXCLUDED.how_to_hire,
    sort_order = EXCLUDED.sort_order;

  SELECT s.phase_id INTO v_phase_id
  FROM public.onboarding_sections s
  WHERE s.id = p_section_id;

  IF v_phase_id IS NOT NULL THEN
    UPDATE public.onboarding_phases SET updated_at = now() WHERE id = v_phase_id;
  END IF;

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_task(p_id text, p_force boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_phase_id text;
BEGIN
  PERFORM public.assert_admin_role();

  IF NOT p_force AND public.task_id_in_use(p_id) THEN
    RAISE EXCEPTION 'Task % is referenced in user progress. Remove from progress first or use force delete.', p_id;
  END IF;

  SELECT s.phase_id INTO v_phase_id
  FROM public.onboarding_tasks t
  JOIN public.onboarding_sections s ON s.id = t.section_id
  WHERE t.id = p_id;

  DELETE FROM public.onboarding_tasks WHERE id = p_id;

  IF v_phase_id IS NOT NULL THEN
    UPDATE public.onboarding_phases SET updated_at = now() WHERE id = v_phase_id;
  END IF;

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reorder_tasks(
  p_section_id text,
  p_task_ids text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  i integer;
  v_phase_id text;
BEGIN
  PERFORM public.assert_admin_role();

  FOR i IN 1..COALESCE(array_length(p_task_ids, 1), 0) LOOP
    UPDATE public.onboarding_tasks
    SET sort_order = i - 1
    WHERE id = p_task_ids[i] AND section_id = p_section_id;
  END LOOP;

  SELECT phase_id INTO v_phase_id FROM public.onboarding_sections WHERE id = p_section_id;
  IF v_phase_id IS NOT NULL THEN
    UPDATE public.onboarding_phases SET updated_at = now() WHERE id = v_phase_id;
  END IF;

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_resource(
  p_id text,
  p_title text,
  p_description text DEFAULT '',
  p_category text DEFAULT 'document',
  p_reference text DEFAULT NULL,
  p_url text DEFAULT NULL,
  p_owner text DEFAULT NULL,
  p_roles text[] DEFAULT '{all}',
  p_sort_order integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();

  INSERT INTO public.onboarding_resources (
    id, title, description, category, reference, url, owner, roles, sort_order
  )
  VALUES (
    p_id, p_title, p_description, p_category, p_reference, p_url, p_owner, p_roles, p_sort_order
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    reference = EXCLUDED.reference,
    url = EXCLUDED.url,
    owner = EXCLUDED.owner,
    roles = EXCLUDED.roles,
    sort_order = EXCLUDED.sort_order;

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_resource(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();
  DELETE FROM public.onboarding_resources WHERE id = p_id;
  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_contact(
  p_id text,
  p_name text,
  p_role text DEFAULT '',
  p_owner_code text DEFAULT 'SUP',
  p_responsibility text DEFAULT '',
  p_contact_hint text DEFAULT '',
  p_sort_order integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();

  INSERT INTO public.onboarding_contacts (
    id, name, role, owner_code, responsibility, contact_hint, sort_order
  )
  VALUES (
    p_id, p_name, p_role, p_owner_code, p_responsibility, p_contact_hint, p_sort_order
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    owner_code = EXCLUDED.owner_code,
    responsibility = EXCLUDED.responsibility,
    contact_hint = EXCLUDED.contact_hint,
    sort_order = EXCLUDED.sort_order;

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_contact(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();
  DELETE FROM public.onboarding_contacts WHERE id = p_id;
  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_feedback_item(
  p_id text,
  p_day_label text,
  p_day_number integer,
  p_method text DEFAULT '',
  p_owner text DEFAULT '',
  p_sort_order integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();

  INSERT INTO public.onboarding_feedback_schedule (
    id, day_label, day_number, method, owner, sort_order
  )
  VALUES (
    p_id, p_day_label, p_day_number, p_method, p_owner, p_sort_order
  )
  ON CONFLICT (id) DO UPDATE SET
    day_label = EXCLUDED.day_label,
    day_number = EXCLUDED.day_number,
    method = EXCLUDED.method,
    owner = EXCLUDED.owner,
    sort_order = EXCLUDED.sort_order;

  RETURN public.get_programme();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_feedback_item(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();
  DELETE FROM public.onboarding_feedback_schedule WHERE id = p_id;
  RETURN public.get_programme();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_phase(text, integer, text, text, text, text, jsonb, integer, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_phase(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_section(text, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_section(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reorder_sections(text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_task(text, text, text, text, text, text, text[], text, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_task(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reorder_tasks(text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_resource(text, text, text, text, text, text, text, text[], integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_resource(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_contact(text, text, text, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_contact(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_feedback_item(text, text, integer, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_feedback_item(text) TO authenticated;

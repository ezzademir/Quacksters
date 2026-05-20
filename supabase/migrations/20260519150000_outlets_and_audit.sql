-- Outlets configuration + admin audit log

CREATE TABLE IF NOT EXISTS public.outlets (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;

CREATE POLICY outlets_select ON public.outlets
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON public.outlets TO authenticated;

INSERT INTO public.outlets (id, name, sort_order) VALUES
  ('outlet-ttdi', 'TTDI', 0),
  ('outlet-1utama', '1 Utama', 1),
  ('outlet-merdeka', 'Merdeka', 2),
  ('outlet-pj', 'PJ', 3),
  ('outlet-hartamas', 'Hartamas', 4)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_select_admin ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.current_access_role() = 'admin');

GRANT SELECT ON public.admin_audit_log TO authenticated;

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
AS $$
BEGIN
  IF public.current_access_role() <> 'admin' THEN
    RETURN;
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_outlets()
RETURNS TABLE (id text, name text, sort_order integer, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT id, name, sort_order, is_active
  FROM public.outlets
  WHERE is_active = true
  ORDER BY sort_order, name;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_outlets()
RETURNS TABLE (id text, name text, sort_order integer, is_active boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();
  RETURN QUERY
  SELECT o.id, o.name, o.sort_order, o.is_active
  FROM public.outlets o
  ORDER BY o.sort_order, o.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_outlet(
  p_id text,
  p_name text,
  p_sort_order integer DEFAULT 0,
  p_is_active boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();

  INSERT INTO public.outlets (id, name, sort_order, is_active)
  VALUES (p_id, p_name, p_sort_order, p_is_active)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

  PERFORM public.log_admin_action(
    'upsert', 'outlet', p_id,
    jsonb_build_object('name', p_name, 'sort_order', p_sort_order, 'is_active', p_is_active)
  );

  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', o.id, 'name', o.name, 'sortOrder', o.sort_order, 'isActive', o.is_active
    ) ORDER BY o.sort_order), '[]'::jsonb)
    FROM public.outlets o
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_outlet(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  PERFORM public.assert_admin_role();

  UPDATE public.outlets SET is_active = false WHERE id = p_id;

  PERFORM public.log_admin_action('deactivate', 'outlet', p_id, '{}'::jsonb);

  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', o.id, 'name', o.name, 'sortOrder', o.sort_order, 'isActive', o.is_active
    ) ORDER BY o.sort_order), '[]'::jsonb)
    FROM public.outlets o
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_outlets() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_outlets() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_outlet(text, text, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_outlet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) TO authenticated;

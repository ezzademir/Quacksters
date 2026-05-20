-- Audit log filtering + paging (single RPC with defaulted params replaces integer-only overload).
-- Self-service clear of password_reset_required via SECURITY DEFINER + audit row insert.

DROP FUNCTION IF EXISTS public.admin_list_audit_log(integer);

CREATE OR REPLACE FUNCTION public.admin_list_audit_log(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_action text DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_since timestamptz DEFAULT NULL,
  p_until timestamptz DEFAULT NULL,
  p_search text DEFAULT NULL
)
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
DECLARE
  v_action text := NULLIF(trim(p_action), '');
  v_entity_type text := NULLIF(trim(p_entity_type), '');
  v_search text := NULLIF(trim(p_search), '');
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
  WHERE
    (v_action IS NULL OR a.action ILIKE '%' || v_action || '%')
    AND (v_entity_type IS NULL OR a.entity_type ILIKE '%' || v_entity_type || '%')
    AND (p_since IS NULL OR a.created_at >= p_since)
    AND (p_until IS NULL OR a.created_at <= p_until)
    AND (
      v_search IS NULL
      OR COALESCE(a.entity_id, '') ILIKE '%' || v_search || '%'
      OR a.details::text ILIKE '%' || v_search || '%'
    )
  ORDER BY a.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

-- Thin overload for callers that only pass limit (matches pre-migration RPC shape).
CREATE OR REPLACE FUNCTION public.admin_list_audit_log(p_limit integer)
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT *
  FROM public.admin_list_audit_log(
    p_limit,
    0::integer,
    NULL::text,
    NULL::text,
    NULL::timestamptz,
    NULL::timestamptz,
    NULL::text
  );
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_audit_log(integer, integer, text, text, timestamptz, timestamptz, text)
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_audit_log(integer)
  TO authenticated;

-- Caller clears own flag after auth.updateUser(password); audited for HR visibility.
CREATE OR REPLACE FUNCTION public.complete_password_change()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET
    password_reset_required = false,
    updated_at = now()
  WHERE id = auth.uid();

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'complete_password_change',
    'profile',
    auth.uid()::text,
    jsonb_build_object('source', 'self')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_password_change() TO authenticated;

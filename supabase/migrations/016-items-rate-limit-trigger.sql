-- Enforce the post rate limit in the database.
-- check_post_rate_limit() was only called by the frontend, so any
-- authenticated user could bypass it by inserting into items directly.
-- This BEFORE INSERT trigger applies the same limit (3/hour, 10/day)
-- to every insert. Service-role inserts are exempt.

CREATE OR REPLACE FUNCTION public.items_enforce_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF (select auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  v_result := public.check_post_rate_limit((select auth.uid()));

  IF NOT (v_result ->> 'allowed')::boolean THEN
    RAISE EXCEPTION 'RATE_LIMITED'
      USING HINT = 'Post limit reached: 3 per hour, 10 per day.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER items_rate_limit
BEFORE INSERT ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.items_enforce_rate_limit();

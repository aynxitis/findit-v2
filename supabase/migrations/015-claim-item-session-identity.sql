-- claim_item: derive claimer identity from the session (auth.uid()),
-- never from caller-supplied parameters. Previously any authenticated
-- user could call the RPC directly and claim items as someone else.
-- p_claimer_id / p_claimer_email / p_claimer_name are kept in the
-- signature only so existing client calls don't break; they are ignored.

CREATE OR REPLACE FUNCTION public.claim_item(
  p_item_id uuid,
  p_claimer_id uuid,
  p_claimer_email text,
  p_claimer_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_item          record;
  v_notif_key     text;
  v_recent_claims integer;
  v_max_hourly    constant integer := 5;
  v_caller        uuid := (select auth.uid());
  v_email         text;
  v_name          text;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT email, name INTO v_email, v_name
  FROM public.users
  WHERE id = v_caller;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_PROFILE');
  END IF;

  SELECT count(*) INTO v_recent_claims
  FROM public.claims
  WHERE claimed_by = v_caller
    AND created_at > now() - interval '1 hour';

  IF v_recent_claims >= v_max_hourly THEN
    RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED');
  END IF;

  SELECT * INTO v_item
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND');
  END IF;

  IF v_item.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED');
  END IF;

  IF v_item.created_at < now() - interval '90 days' THEN
    RETURN jsonb_build_object('success', false, 'error', 'LISTING_EXPIRED');
  END IF;

  IF v_item.user_id = v_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'SELF_CLAIM');
  END IF;

  INSERT INTO public.claims (item_id, item_type, item_category, claimed_by, claimed_email, claimed_name, poster_uid, poster_email)
  VALUES (p_item_id, v_item.type, v_item.category, v_caller, v_email, v_name, v_item.user_id, v_item.user_email);

  IF v_item.user_id IS NOT NULL AND v_item.user_id != v_caller THEN
    v_notif_key := CASE WHEN v_item.type = 'found' THEN 'claim.found' ELSE 'claim.lost' END;

    INSERT INTO public.notifications (to_uid, item_id, item_type, category, message, claimer_name, claimer_uid, claimer_email, read)
    VALUES (v_item.user_id, p_item_id, v_item.type, v_item.category, v_notif_key, v_name, v_caller, v_email, false);
  END IF;

  UPDATE public.items SET status = 'claimed' WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'poster_email', v_item.user_email,
    'poster_name', v_item.user_name
  );
END;
$function$;

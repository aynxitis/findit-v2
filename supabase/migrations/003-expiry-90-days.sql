-- ============================================================================
-- Migration 003 — Change item expiry from 30 days to 90 days
-- Run once in Supabase SQL Editor.
-- ============================================================================
--
-- Numbered 002 originally, colliding with 002-performance-fixes.sql. Renamed
-- to 003 in P0-5 to match the order the two were actually applied in
-- production (performance fixes first, then expiry). Superseded by migration
-- 005, which replaces claim_item again to add the claim rate limit.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.claim_item(
  p_item_id       uuid,
  p_claimer_id    uuid,
  p_claimer_email text,
  p_claimer_name  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item        record;
  v_category_icon text;
  v_category_label text;
  v_notif_message text;
BEGIN
  -- 1. Lock the item row
  SELECT * INTO v_item
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  -- 2. Check item exists
  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND');
  END IF;

  -- 3. Check item is open
  IF v_item.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED');
  END IF;

  -- 4. Check item not expired (90 days)
  IF v_item.created_at < now() - interval '90 days' THEN
    RETURN jsonb_build_object('success', false, 'error', 'LISTING_EXPIRED');
  END IF;

  -- 5. Check claimer is not poster
  IF v_item.user_id = p_claimer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'SELF_CLAIM');
  END IF;

  -- 6. Create claim record
  INSERT INTO public.claims (item_id, item_type, item_category, claimed_by, claimed_email, claimed_name, poster_uid, poster_email)
  VALUES (p_item_id, v_item.type, v_item.category, p_claimer_id, p_claimer_email, p_claimer_name, v_item.user_id, v_item.user_email);

  -- 7. Create notification for poster
  IF v_item.user_id IS NOT NULL AND v_item.user_id != p_claimer_id THEN
    v_category_icon := CASE v_item.category
      WHEN 'keys' THEN '🔑' WHEN 'card' THEN '🪪' WHEN 'phone' THEN '📱'
      WHEN 'bag' THEN '🎒' WHEN 'clothing' THEN '👕' WHEN 'electronics' THEN '💻'
      ELSE '📦'
    END;
    v_category_label := CASE v_item.category
      WHEN 'keys' THEN 'Keys' WHEN 'card' THEN 'Card / ID' WHEN 'phone' THEN 'Phone'
      WHEN 'bag' THEN 'Bag' WHEN 'clothing' THEN 'Clothing' WHEN 'electronics' THEN 'Electronics'
      ELSE 'Other'
    END;

    IF v_item.type = 'found' THEN
      v_notif_message := v_category_icon || ' Someone thinks your ' || v_category_label || ' is theirs and wants to claim it.';
    ELSE
      v_notif_message := v_category_icon || ' Someone found your ' || v_category_label || ' and reached out!';
    END IF;

    INSERT INTO public.notifications (to_uid, item_id, item_type, category, message, claimer_name, claimer_uid, claimer_email, read)
    VALUES (v_item.user_id, p_item_id, v_item.type, v_item.category, v_notif_message, p_claimer_name, p_claimer_id, p_claimer_email, false);
  END IF;

  -- 8. Update item status
  UPDATE public.items SET status = 'claimed' WHERE id = p_item_id;

  -- 9. Return success with poster contact info
  RETURN jsonb_build_object(
    'success', true,
    'poster_email', v_item.user_email,
    'poster_name', v_item.user_name
  );
END;
$$;

-- Re-apply permissions (CREATE OR REPLACE resets them)
REVOKE EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text) TO authenticated;

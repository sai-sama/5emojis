-- ╔══════════════════════════════════════════════════════════════╗
-- ║  5Emojis — Functions & Triggers (final versions)           ║
-- ║  Merged from dev migrations 001–017                        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── Helper: auto-update updated_at ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- ─── Auto-compute PostGIS geography from lat/lng ───────────────
CREATE OR REPLACE FUNCTION public.profiles_set_location()
RETURNS trigger AS $$
BEGIN
  new.location = extensions.st_setsrid(
    extensions.st_makepoint(new.longitude, new.latitude), 4326
  )::extensions.geography;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_location_trigger
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_set_location();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Calculate emoji match count between two users ─────────────
CREATE OR REPLACE FUNCTION public.calc_emoji_match_count(uid1 uuid, uid2 uuid)
RETURNS smallint AS $$
  SELECT count(*)::smallint
  FROM public.profile_emojis e1
  JOIN public.profile_emojis e2 ON e1.emoji = e2.emoji
  WHERE e1.user_id = uid1 AND e2.user_id = uid2;
$$ LANGUAGE sql STABLE;

-- ─── Radius search: find profiles within N miles ───────────────
-- Final version: includes gender filter + excludes suspended users
CREATE OR REPLACE FUNCTION public.nearby_profiles(
  user_lat double precision,
  user_lng double precision,
  radius_miles integer,
  current_user_id uuid,
  gender_filter text DEFAULT NULL
)
RETURNS SETOF public.profiles AS $$
BEGIN
  RETURN QUERY
    SELECT p.*
    FROM public.profiles p
    WHERE p.id != current_user_id
      AND NOT p.is_suspended
      AND extensions.st_dwithin(
        p.location,
        extensions.st_setsrid(extensions.st_makepoint(user_lng, user_lat), 4326)::extensions.geography,
        radius_miles * 1609.34
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = current_user_id AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = current_user_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.swipes s
        WHERE s.swiper_id = current_user_id AND s.swiped_id = p.id
      )
      AND (
        gender_filter IS NULL
        OR p.gender = gender_filter
      )
    ORDER BY p.location <-> extensions.st_setsrid(extensions.st_makepoint(user_lng, user_lat), 4326)::extensions.geography;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Auto-create match on mutual right swipe ───────────────────
-- Final version: assigns random icebreaker question
CREATE OR REPLACE FUNCTION public.handle_new_swipe()
RETURNS trigger AS $$
DECLARE
  match_count smallint;
  uid_low uuid;
  uid_high uuid;
  random_question_id uuid;
BEGIN
  IF new.direction != 'right' THEN
    RETURN new;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swiper_id = new.swiped_id
      AND swiped_id = new.swiper_id
      AND direction = 'right'
  ) THEN
    IF new.swiper_id < new.swiped_id THEN
      uid_low := new.swiper_id;
      uid_high := new.swiped_id;
    ELSE
      uid_low := new.swiped_id;
      uid_high := new.swiper_id;
    END IF;

    match_count := public.calc_emoji_match_count(uid_low, uid_high);

    -- Pick a random icebreaker not yet used by either user
    SELECT id INTO random_question_id
    FROM public.icebreaker_questions
    WHERE id NOT IN (
      SELECT m.icebreaker_question_id
      FROM public.matches m
      WHERE m.icebreaker_question_id IS NOT NULL
        AND (m.user1_id IN (uid_low, uid_high) OR m.user2_id IN (uid_low, uid_high))
    )
    ORDER BY random()
    LIMIT 1;

    -- Fallback: allow repeats if all questions exhausted
    IF random_question_id IS NULL THEN
      SELECT id INTO random_question_id
      FROM public.icebreaker_questions
      ORDER BY random()
      LIMIT 1;
    END IF;

    INSERT INTO public.matches (
      user1_id, user2_id, emoji_match_count, is_emoji_perfect, icebreaker_question_id
    )
    VALUES (uid_low, uid_high, match_count, match_count = 5, random_question_id)
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_swipe
  AFTER INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_swipe();

-- ─── Auto-suspend on 3+ unique reporters ───────────────────────
CREATE OR REPLACE FUNCTION public.check_auto_suspend()
RETURNS trigger AS $$
DECLARE
  unique_reporters INTEGER;
BEGIN
  SELECT COUNT(DISTINCT reporter_id) INTO unique_reporters
  FROM public.reports
  WHERE reported_id = NEW.reported_id
    AND status = 'pending';

  IF unique_reporters >= 3 THEN
    UPDATE public.profiles
    SET is_suspended      = true,
        suspended_at      = now(),
        suspended_until   = now() + interval '30 days',
        suspension_reason = 'auto: 3+ unique reports'
    WHERE id = NEW.reported_id
      AND is_suspended = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_auto_suspend
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.check_auto_suspend();

-- ─── Delete own account (profile + auth user) ──────────────────
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- ─── Atomic swipe count increments (from 016) ─────────────────
CREATE OR REPLACE FUNCTION increment_right_swipe(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_swipe_counts (user_id, swipe_date, right_count, super_like_count)
  VALUES (p_user_id, CURRENT_DATE, 1, 0)
  ON CONFLICT (user_id, swipe_date)
  DO UPDATE SET right_count = daily_swipe_counts.right_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_super_like_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_swipe_counts (user_id, swipe_date, right_count, super_like_count)
  VALUES (p_user_id, CURRENT_DATE, 0, 1)
  ON CONFLICT (user_id, swipe_date)
  DO UPDATE SET super_like_count = daily_swipe_counts.super_like_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

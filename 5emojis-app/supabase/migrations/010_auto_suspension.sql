-- ╔══════════════════════════════════════════════════════════════╗
-- ║  010 — Auto-Suspension System                              ║
-- ║  3 unique reporters → 30-day suspension                    ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── 1. Add suspension columns to profiles ────────────────────
ALTER TABLE public.profiles
  ADD COLUMN is_suspended       BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN suspended_at       TIMESTAMPTZ,
  ADD COLUMN suspended_until    TIMESTAMPTZ,
  ADD COLUMN suspension_reason  TEXT;

CREATE INDEX profiles_suspended_idx ON public.profiles (is_suspended)
  WHERE is_suspended = true;

-- ─── 2. Auto-suspend trigger function ─────────────────────────
--    Fires after each new report. If the reported user has
--    3+ unique reporters with pending reports, auto-suspend
--    for 30 days.
CREATE OR REPLACE FUNCTION public.check_auto_suspend()
RETURNS trigger AS $$
DECLARE
  unique_reporters INTEGER;
BEGIN
  -- Count unique reporters for this reported user (pending reports only)
  SELECT COUNT(DISTINCT reporter_id) INTO unique_reporters
  FROM public.reports
  WHERE reported_id = NEW.reported_id
    AND status = 'pending';

  -- Auto-suspend if 3+ unique reporters
  IF unique_reporters >= 3 THEN
    UPDATE public.profiles
    SET is_suspended      = true,
        suspended_at      = now(),
        suspended_until   = now() + interval '30 days',
        suspension_reason = 'auto: 3+ unique reports'
    WHERE id = NEW.reported_id
      AND is_suspended = false;  -- don't overwrite existing suspension
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_auto_suspend
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.check_auto_suspend();

-- ─── 3. Exclude suspended users from discovery ───────────────
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

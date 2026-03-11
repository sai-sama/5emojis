-- Add onboarding_complete check to nearby_profiles so incomplete profiles
-- (no photo/location/emojis) don't appear in discovery.

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
      AND p.onboarding_complete = true
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

-- Add intent column to profiles (friends, dating, or both)
ALTER TABLE public.profiles
  ADD COLUMN intent text NOT NULL DEFAULT 'both'
  CHECK (intent IN ('friends', 'dating', 'both'));

CREATE INDEX profiles_intent_idx ON public.profiles (intent);

-- Update nearby_profiles to support optional intent filtering
CREATE OR REPLACE FUNCTION public.nearby_profiles(
  user_lat double precision,
  user_lng double precision,
  radius_miles integer,
  current_user_id uuid,
  intent_filter text DEFAULT NULL
)
RETURNS SETOF public.profiles AS $$
BEGIN
  RETURN QUERY
    SELECT p.*
    FROM public.profiles p
    WHERE p.id != current_user_id
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
        intent_filter IS NULL
        OR p.intent = intent_filter
        OR p.intent = 'both'
        OR intent_filter = 'both'
      )
    ORDER BY p.location <-> extensions.st_setsrid(extensions.st_makepoint(user_lng, user_lat), 4326)::extensions.geography;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

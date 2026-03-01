-- ╔══════════════════════════════════════════════════════════════╗
-- ║  004 — Friendship Pivot                                     ║
-- ║  Add gender to profiles + icebreaker question system        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── 1. Add gender column to profiles ───────────────────────
ALTER TABLE public.profiles
  ADD COLUMN gender text NOT NULL DEFAULT 'male'
  CHECK (gender IN ('male', 'female', 'nonbinary'));

CREATE INDEX profiles_gender_idx ON public.profiles (gender);

-- ─── 2. Icebreaker questions table ──────────────────────────
CREATE TABLE public.icebreaker_questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.icebreaker_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Icebreakers readable by all authenticated"
  ON public.icebreaker_questions FOR SELECT
  TO authenticated
  USING (true);

-- ─── 3. Link matches to icebreaker questions ────────────────
ALTER TABLE public.matches
  ADD COLUMN icebreaker_question_id UUID
  REFERENCES public.icebreaker_questions(id);

-- ─── 4. Update match trigger to assign random icebreaker ────
CREATE OR REPLACE FUNCTION public.handle_new_swipe()
RETURNS trigger AS $$
DECLARE
  match_count smallint;
  uid_low uuid;
  uid_high uuid;
  random_question_id uuid;
BEGIN
  -- Only check for match on right swipes
  IF new.direction != 'right' THEN
    RETURN new;
  END IF;

  -- Check if the other person already swiped right on us
  IF EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swiper_id = new.swiped_id
      AND swiped_id = new.swiper_id
      AND direction = 'right'
  ) THEN
    -- Canonical ordering: smaller UUID first
    IF new.swiper_id < new.swiped_id THEN
      uid_low := new.swiper_id;
      uid_high := new.swiped_id;
    ELSE
      uid_low := new.swiped_id;
      uid_high := new.swiper_id;
    END IF;

    -- Calculate emoji overlap
    match_count := public.calc_emoji_match_count(uid_low, uid_high);

    -- Pick a random icebreaker question not yet used by either user
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

    -- Fallback: if all ~450 questions exhausted, allow repeats
    IF random_question_id IS NULL THEN
      SELECT id INTO random_question_id
      FROM public.icebreaker_questions
      ORDER BY random()
      LIMIT 1;
    END IF;

    -- Create match with icebreaker question
    INSERT INTO public.matches (
      user1_id, user2_id, emoji_match_count, is_emoji_perfect, icebreaker_question_id
    )
    VALUES (
      uid_low, uid_high, match_count, match_count = 5, random_question_id
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. Update nearby_profiles to support gender filter ─────
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

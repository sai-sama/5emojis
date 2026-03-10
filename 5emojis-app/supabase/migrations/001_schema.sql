-- ╔══════════════════════════════════════════════════════════════╗
-- ║  5Emojis — Consolidated Schema (Tables, Indexes, Storage)  ║
-- ║  Merged from dev migrations 001–017                        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- ═══════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  dob                   date NOT NULL,
  gender                text NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female', 'nonbinary')),
  race                  text,
  religion              text,
  profession            text,
  life_stage            text,
  friendship_style      text,
  pronouns              text,
  is_new_to_city        boolean NOT NULL DEFAULT false,
  city                  text NOT NULL,
  state                 text,
  zip                   text,
  latitude              double precision NOT NULL,
  longitude             double precision NOT NULL,
  location              extensions.geography(Point, 4326),
  search_radius_miles   integer NOT NULL DEFAULT 50,
  -- Profile fields (005)
  personality_type      text CHECK (personality_type IN ('introvert', 'extrovert', 'ambivert')),
  preferred_age_min     integer CHECK (preferred_age_min >= 18),
  preferred_age_max     integer CHECK (preferred_age_max <= 99),
  communication_style   text CHECK (communication_style IN ('texter', 'caller', 'in_person', 'all_of_the_above')),
  kids                  text CHECK (kids IN ('has_kids', 'no_kids', 'expecting')),
  relationship_status   text CHECK (relationship_status IN ('single', 'in_a_relationship', 'married', 'its_complicated')),
  work_style            text CHECK (work_style IN ('remote', 'hybrid', 'in_office')),
  -- Emoji cooldown (006)
  emoji_last_edited_at  timestamptz,
  -- Push notifications (008)
  push_token            text,
  -- Suspension (010)
  is_suspended          boolean NOT NULL DEFAULT false,
  suspended_at          timestamptz,
  suspended_until       timestamptz,
  suspension_reason     text,
  -- Admin (011)
  is_admin              boolean NOT NULL DEFAULT false,
  -- Premium (014)
  is_premium            boolean NOT NULL DEFAULT false,
  premium_until         timestamptz,
  revenucat_customer_id text,
  hidden_emojis         text[] NOT NULL DEFAULT '{}',
  -- Timestamps
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- Constraints
  CONSTRAINT profiles_min_age_18 CHECK (dob <= current_date - interval '18 years'),
  CONSTRAINT age_range_valid CHECK (preferred_age_max IS NULL OR preferred_age_min IS NULL OR preferred_age_max >= preferred_age_min)
);

CREATE INDEX profiles_location_idx ON public.profiles USING gist (location);
CREATE INDEX profiles_city_idx ON public.profiles (city);
CREATE INDEX profiles_gender_idx ON public.profiles (gender);
CREATE INDEX profiles_suspended_idx ON public.profiles (is_suspended) WHERE is_suspended = true;
CREATE INDEX profiles_push_token_idx ON public.profiles (push_token) WHERE push_token IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- PROFILE EMOJIS (5 per user)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profile_emojis (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji     text NOT NULL,
  position  smallint NOT NULL CHECK (position BETWEEN 1 AND 5),
  UNIQUE (user_id, position)
);

CREATE INDEX profile_emojis_user_idx ON public.profile_emojis (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE PHOTOS (up to 5, position 1 = primary)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profile_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url         text NOT NULL,
  position    smallint NOT NULL CHECK (position BETWEEN 1 AND 5),
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, position)
);

CREATE INDEX profile_photos_user_idx ON public.profile_photos (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE INTERESTS (3-5 tags)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profile_interests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_tag text NOT NULL,
  UNIQUE (user_id, interest_tag)
);

CREATE INDEX profile_interests_user_idx ON public.profile_interests (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE LANGUAGES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profile_languages (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language  text NOT NULL,
  UNIQUE (user_id, language)
);

CREATE INDEX profile_languages_user_idx ON public.profile_languages (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE REVEALS (4 hidden descriptions, unlocked on match)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profile_reveals (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content   text NOT NULL,
  position  smallint NOT NULL CHECK (position BETWEEN 1 AND 4),
  UNIQUE (user_id, position)
);

CREATE INDEX profile_reveals_user_idx ON public.profile_reveals (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE AVAILABILITY (multi-select, from 005)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profile_availability (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot    text NOT NULL CHECK (slot IN (
    'weekday_mornings', 'weekday_afternoons', 'weekday_evenings',
    'weekend_mornings', 'weekend_afternoons', 'weekend_evenings',
    'anytime'
  )),
  UNIQUE (user_id, slot)
);

CREATE INDEX profile_availability_user_idx ON public.profile_availability (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE PETS (multi-select, from 005)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profile_pets (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet     text NOT NULL CHECK (pet IN ('dog', 'cat', 'other', 'none')),
  UNIQUE (user_id, pet)
);

CREATE INDEX profile_pets_user_idx ON public.profile_pets (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE DIETARY (multi-select, from 005)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profile_dietary (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preference text NOT NULL CHECK (preference IN (
    'vegan', 'vegetarian', 'gluten_free', 'halal', 'kosher', 'no_restrictions'
  )),
  UNIQUE (user_id, preference)
);

CREATE INDEX profile_dietary_user_idx ON public.profile_dietary (user_id);

-- ═══════════════════════════════════════════════════════════════
-- ICEBREAKER QUESTIONS (from 004)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.icebreaker_questions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question   text NOT NULL,
  category   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- SWIPES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.swipes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swiped_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction     text NOT NULL CHECK (direction IN ('left', 'right')),
  is_super_like boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (swiper_id, swiped_id)
);

CREATE INDEX swipes_swiper_idx ON public.swipes (swiper_id);
CREATE INDEX swipes_swiped_idx ON public.swipes (swiped_id);
CREATE INDEX swipes_mutual_lookup_idx ON public.swipes (swiped_id, swiper_id, direction);

-- ═══════════════════════════════════════════════════════════════
-- MATCHES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.matches (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id                uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id                uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji_match_count       smallint NOT NULL DEFAULT 0,
  is_emoji_perfect        boolean NOT NULL DEFAULT false,
  icebreaker_question_id  uuid REFERENCES public.icebreaker_questions(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

CREATE INDEX matches_user1_idx ON public.matches (user1_id);
CREATE INDEX matches_user2_idx ON public.matches (user2_id);

-- ═══════════════════════════════════════════════════════════════
-- MESSAGES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       text NOT NULL,
  is_emoji_only boolean NOT NULL DEFAULT false,
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_match_idx ON public.messages (match_id, created_at);
CREATE INDEX messages_sender_idx ON public.messages (sender_id);

-- ═══════════════════════════════════════════════════════════════
-- MESSAGE REACTIONS (from 009)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.message_reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX message_reactions_message_id_idx ON public.message_reactions (message_id);

-- ═══════════════════════════════════════════════════════════════
-- BLOCKS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX blocks_blocker_idx ON public.blocks (blocker_id);
CREATE INDEX blocks_blocked_idx ON public.blocks (blocked_id);

-- ═══════════════════════════════════════════════════════════════
-- REPORTS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  details     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reports_status_idx ON public.reports (status);

-- ═══════════════════════════════════════════════════════════════
-- DAILY SWIPE COUNTS (from 014)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.daily_swipe_counts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swipe_date       date NOT NULL DEFAULT CURRENT_DATE,
  right_count      integer NOT NULL DEFAULT 0,
  super_like_count integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, swipe_date)
);

CREATE INDEX idx_daily_swipe_counts_user_date ON public.daily_swipe_counts (user_id, swipe_date);

-- ═══════════════════════════════════════════════════════════════
-- (super_likes table removed — super like flag lives on swipes.is_super_like)
-- ═══════════════════════════════════════════════════════════════
-- AI CONTENT (daily batch — serves all users)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.ai_content (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content    jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- WELLNESS TIPS (from 003)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.wellness_tips (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  week_start  date NOT NULL,
  tip         text NOT NULL,
  emoji       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_tips_week ON public.wellness_tips (week_start, day_of_week);

-- ═══════════════════════════════════════════════════════════════
-- ERROR LOGS (from 007)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.error_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message   text NOT NULL,
  error_stack     text,
  component_stack text,
  screen          text,
  platform        text,
  app_version     text,
  extra           jsonb,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX error_logs_created_at_idx ON public.error_logs (created_at DESC);
CREATE INDEX error_logs_user_id_idx ON public.error_logs (user_id);

-- ═══════════════════════════════════════════════════════════════
-- APP SETTINGS (from 015 — admin-controlled key-value store)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKET for profile photos
-- ═══════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- REALTIME — enable for messages (chat) and matches (notifications)
-- ═══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

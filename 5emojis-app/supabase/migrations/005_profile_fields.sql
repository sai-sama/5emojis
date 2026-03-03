-- ════════════════════════════════════════════════════════════════
-- Migration 005: Expanded profile fields for premium filtering
-- ════════════════════════════════════════════════════════════════

-- ─── New columns on profiles ────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN personality_type text
    CHECK (personality_type IN ('introvert', 'extrovert', 'ambivert')),
  ADD COLUMN preferred_age_min integer
    CHECK (preferred_age_min >= 18),
  ADD COLUMN preferred_age_max integer
    CHECK (preferred_age_max <= 99),
  ADD COLUMN communication_style text
    CHECK (communication_style IN ('texter', 'caller', 'in_person', 'all_of_the_above')),
  ADD COLUMN kids text
    CHECK (kids IN ('has_kids', 'no_kids', 'expecting')),
  ADD COLUMN relationship_status text
    CHECK (relationship_status IN ('single', 'in_a_relationship', 'married', 'its_complicated')),
  ADD COLUMN work_style text
    CHECK (work_style IN ('remote', 'hybrid', 'in_office'));

ALTER TABLE public.profiles
  ADD CONSTRAINT age_range_valid
    CHECK (preferred_age_max IS NULL OR preferred_age_min IS NULL OR preferred_age_max >= preferred_age_min);


-- ═══ Availability (multi-select, max 3) ═════════════════════════
CREATE TABLE public.profile_availability (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot    TEXT NOT NULL CHECK (slot IN (
    'weekday_mornings', 'weekday_afternoons', 'weekday_evenings',
    'weekend_mornings', 'weekend_afternoons', 'weekend_evenings',
    'anytime'
  )),
  UNIQUE (user_id, slot)
);

CREATE INDEX profile_availability_user_idx ON public.profile_availability (user_id);

ALTER TABLE public.profile_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability viewable by authenticated"
  ON public.profile_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own availability"
  ON public.profile_availability FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own availability"
  ON public.profile_availability FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ═══ Pets (multi-select) ════════════════════════════════════════
CREATE TABLE public.profile_pets (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet     TEXT NOT NULL CHECK (pet IN ('dog', 'cat', 'other', 'none')),
  UNIQUE (user_id, pet)
);

CREATE INDEX profile_pets_user_idx ON public.profile_pets (user_id);

ALTER TABLE public.profile_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pets viewable by authenticated"
  ON public.profile_pets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own pets"
  ON public.profile_pets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own pets"
  ON public.profile_pets FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ═══ Dietary Preferences (multi-select) ═════════════════════════
CREATE TABLE public.profile_dietary (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preference TEXT NOT NULL CHECK (preference IN (
    'vegan', 'vegetarian', 'gluten_free', 'halal', 'kosher', 'no_restrictions'
  )),
  UNIQUE (user_id, preference)
);

CREATE INDEX profile_dietary_user_idx ON public.profile_dietary (user_id);

ALTER TABLE public.profile_dietary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietary viewable by authenticated"
  ON public.profile_dietary FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own dietary"
  ON public.profile_dietary FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own dietary"
  ON public.profile_dietary FOR DELETE TO authenticated USING (user_id = auth.uid());

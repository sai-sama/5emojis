-- ═══════════════════════════════════════════════════════════════
-- 005: Friendship Streaks
-- ═══════════════════════════════════════════════════════════════

-- Tracks consecutive days both users in a match have messaged each other.
-- Updated by the client after sending a message.
CREATE TABLE public.friendship_streaks (
  match_id           uuid PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  current_streak     smallint NOT NULL DEFAULT 0,
  longest_streak     smallint NOT NULL DEFAULT 0,
  last_user1_msg_date date,       -- last date user1 sent a message
  last_user2_msg_date date,       -- last date user2 sent a message
  last_streak_date   date,        -- last date both users messaged (streak day)
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS Policies ──────────────────────────────────────────────
ALTER TABLE public.friendship_streaks ENABLE ROW LEVEL SECURITY;

-- Users can read streaks for their own matches
CREATE POLICY "Users can view own match streaks"
  ON public.friendship_streaks FOR SELECT
  USING (
    match_id IN (
      SELECT id FROM public.matches
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Users can update streaks for their own matches
CREATE POLICY "Users can update own match streaks"
  ON public.friendship_streaks FOR UPDATE
  USING (
    match_id IN (
      SELECT id FROM public.matches
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Users can insert streaks for their own matches
CREATE POLICY "Users can insert streaks for own matches"
  ON public.friendship_streaks FOR INSERT
  WITH CHECK (
    match_id IN (
      SELECT id FROM public.matches
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Enable realtime for streaks (so both users see updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendship_streaks;

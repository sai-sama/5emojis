-- ============================================================
-- Migration 014: Premium subscription + super likes + swipe limits
-- ============================================================

-- 1. Add subscription fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_until timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS revenucat_customer_id text DEFAULT NULL;

-- 2. Daily swipe counts (tracks right swipes per user per day)
CREATE TABLE IF NOT EXISTS daily_swipe_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swipe_date date NOT NULL DEFAULT CURRENT_DATE,
  right_count integer NOT NULL DEFAULT 0,
  super_like_count integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, swipe_date)
);

-- RLS for daily_swipe_counts
ALTER TABLE daily_swipe_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swipe counts"
  ON daily_swipe_counts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swipe counts"
  ON daily_swipe_counts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own swipe counts"
  ON daily_swipe_counts FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Super likes table (records who super-liked whom)
CREATE TABLE IF NOT EXISTS super_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- RLS for super_likes
ALTER TABLE super_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view super likes involving them"
  ON super_likes FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert own super likes"
  ON super_likes FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 4. Add is_super_like column to swipes for discovery feed priority
ALTER TABLE swipes
ADD COLUMN IF NOT EXISTS is_super_like boolean NOT NULL DEFAULT false;

-- 5. Index for fast daily count lookups
CREATE INDEX IF NOT EXISTS idx_daily_swipe_counts_user_date
  ON daily_swipe_counts(user_id, swipe_date);

-- 6. Index for super likes receiver lookup (priority in feed)
CREATE INDEX IF NOT EXISTS idx_super_likes_receiver
  ON super_likes(receiver_id, created_at DESC);

-- 7. Hidden emojis filter (emojis user doesn't want to see in discovery)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS hidden_emojis text[] NOT NULL DEFAULT '{}';

-- 8. Allow admins to update premium status
CREATE POLICY "Admins can update premium status"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

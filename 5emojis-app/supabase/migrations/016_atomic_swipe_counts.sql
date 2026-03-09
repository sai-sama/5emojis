-- Atomic swipe count increment functions to prevent TOCTOU race conditions.
-- Instead of read-then-write from the client, these do server-side upsert+increment.

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

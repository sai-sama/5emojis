-- Add emoji edit cooldown tracking
ALTER TABLE public.profiles
  ADD COLUMN emoji_last_edited_at timestamptz;

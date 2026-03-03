-- Add push token column to profiles for Expo Push Notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Index for looking up tokens when sending notifications
CREATE INDEX IF NOT EXISTS profiles_push_token_idx ON public.profiles (push_token)
  WHERE push_token IS NOT NULL;

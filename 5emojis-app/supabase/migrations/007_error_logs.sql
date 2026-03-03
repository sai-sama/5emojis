-- Error logging table — free crash reporting via Supabase
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  screen TEXT,
  platform TEXT,
  app_version TEXT,
  extra JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying recent errors
CREATE INDEX error_logs_created_at_idx ON public.error_logs (created_at DESC);
CREATE INDEX error_logs_user_id_idx ON public.error_logs (user_id);

-- RLS: users can insert their own errors, only service role can read all
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own error logs"
  ON public.error_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Auto-cleanup: delete error logs older than 30 days (run via pg_cron or manual)
-- SELECT cron.schedule('cleanup-error-logs', '0 3 * * *', $$DELETE FROM public.error_logs WHERE created_at < now() - interval '30 days'$$);

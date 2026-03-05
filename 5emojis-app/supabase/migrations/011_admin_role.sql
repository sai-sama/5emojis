-- ─── Admin role ──────────────────────────────────────────────
-- Add is_admin column to profiles (default false, set manually via SQL)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- ─── RLS: let admins read error_logs ─────────────────────────
-- Drop existing policy if any, then create admin read policy
CREATE POLICY "Admins can read all error logs"
  ON public.error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- ─── RLS: let admins read and update reports ─────────────────
CREATE POLICY "Admins can read all reports"
  ON public.reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update report status"
  ON public.reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- NOTE: No admin-specific SELECT policy needed on profiles because
-- 001_initial_schema.sql already has "Profiles are viewable by authenticated users"
-- with USING (true). A self-referencing policy here would cause infinite recursion.

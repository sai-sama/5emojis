-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Enforce 18+ age requirement at the database level         ║
-- ║  Run this in Supabase Dashboard → SQL Editor               ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Reject any profile INSERT or UPDATE where the user is under 18
alter table public.profiles
  add constraint profiles_min_age_18
  check (dob <= current_date - interval '18 years');

-- ============================================================
-- Migration 015: App settings table for admin-controlled premium gate
-- ============================================================

-- 1. App settings table (key-value store for global config)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- RLS: anyone can read settings, only admins can write
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings"
  ON app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update app settings"
  ON app_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert app settings"
  ON app_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 2. Seed the premium_gate setting
-- value schema: { "enabled": false, "mode": "global", "gated_cities": [] }
-- enabled=false means everyone gets premium free (launch mode)
-- When enabled=true and mode="global", premium is gated for ALL users
-- When enabled=true and mode="per_city", only users in gated_cities are gated
INSERT INTO app_settings (key, value)
VALUES ('premium_gate', '{"enabled": false, "mode": "global", "gated_cities": []}')
ON CONFLICT (key) DO NOTHING;

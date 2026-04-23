-- City Promotion Automation Layer
-- Additive tables for manual overrides and audit trails

CREATE TABLE IF NOT EXISTS city_automation_overrides (
  city_key TEXT PRIMARY KEY, -- normalized city name
  forced_policy_status TEXT, -- monitor, accelerating, recovering, intervening
  forced_maturity_state TEXT, -- strong, growing, imported_fallback
  suppress_promotion BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by_user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS city_automation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_key TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  previous_promotion_status TEXT,
  new_promotion_status TEXT,
  policy_applied TEXT,
  automation_status TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  triggered_by TEXT DEFAULT 'system' -- 'system' or user_id
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_city_automation_audit_city ON city_automation_audit(city_key);
CREATE INDEX IF NOT EXISTS idx_city_automation_audit_triggered_at ON city_automation_audit(triggered_at);

-- RLS
ALTER TABLE city_automation_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_automation_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can manage overrides and view audit
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'city_automation_overrides' AND policyname = 'Admins can manage city overrides'
  ) THEN
    CREATE POLICY "Admins can manage city overrides" ON city_automation_overrides
      FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data ->> 'role' = 'admin') OR (auth.jwt() ->> 'email' LIKE '%@evntszn.com'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'city_automation_audit' AND policyname = 'Admins can view city audit'
  ) THEN
    CREATE POLICY "Admins can view city audit" ON city_automation_audit
      FOR SELECT USING (auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data ->> 'role' = 'admin') OR (auth.jwt() ->> 'email' LIKE '%@evntszn.com'));
  END IF;
END $$;

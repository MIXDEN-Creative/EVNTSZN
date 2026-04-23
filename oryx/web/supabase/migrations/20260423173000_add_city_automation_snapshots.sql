-- Durable city automation snapshots + richer audit detail

CREATE TABLE IF NOT EXISTS city_automation_snapshots (
  city_key TEXT PRIMARY KEY,
  city_label TEXT NOT NULL,
  maturity_state TEXT NOT NULL,
  automation_status TEXT NOT NULL,
  promotion_status TEXT NOT NULL,
  next_maturity_state TEXT,
  policy_label TEXT NOT NULL,
  policy_reason TEXT NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  override_active BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  forced_policy_status TEXT,
  forced_maturity_state TEXT,
  suppress_promotion BOOLEAN NOT NULL DEFAULT FALSE,
  last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_evaluation_at TIMESTAMPTZ,
  total_usable_inventory INTEGER NOT NULL DEFAULT 0,
  trend_direction TEXT NOT NULL DEFAULT 'flat',
  trend_delta_percent INTEGER NOT NULL DEFAULT 0,
  source_mix JSONB NOT NULL DEFAULT '{}'::jsonb,
  momentum_source_mix JSONB NOT NULL DEFAULT '{}'::jsonb,
  top_slots JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_city_automation_snapshots_next_eval
  ON city_automation_snapshots(next_evaluation_at);

CREATE INDEX IF NOT EXISTS idx_city_automation_snapshots_maturity
  ON city_automation_snapshots(maturity_state, automation_status);

ALTER TABLE city_automation_audit
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS previous_policy_label TEXT,
  ADD COLUMN IF NOT EXISTS new_policy_label TEXT,
  ADD COLUMN IF NOT EXISTS previous_automation_status TEXT,
  ADD COLUMN IF NOT EXISTS new_automation_status TEXT,
  ADD COLUMN IF NOT EXISTS previous_override_active BOOLEAN,
  ADD COLUMN IF NOT EXISTS new_override_active BOOLEAN;

ALTER TABLE city_automation_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'city_automation_snapshots'
      AND policyname = 'Admins can view city automation snapshots'
  ) THEN
    CREATE POLICY "Admins can view city automation snapshots" ON city_automation_snapshots
      FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
          SELECT email FROM auth.users WHERE raw_user_meta_data ->> 'role' = 'admin'
        )
        OR (auth.jwt() ->> 'email' LIKE '%@evntszn.com')
      );
  END IF;
END $$;

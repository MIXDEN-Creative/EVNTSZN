-- 1) Ensure org_code exists
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS org_code TEXT;

-- 2) Make it unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_org_code_key'
  ) THEN
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_org_code_key UNIQUE (org_code);
  END IF;
END $$;

-- 3) Backfill any missing org_code with a short code
-- Format: ORX-XXXXXX (no confusing chars)
UPDATE organizations
SET org_code = 'ORX-' || (
  SELECT string_agg(substr(chars, (random()*length(chars)+1)::int, 1), '')
  FROM (
    SELECT 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' AS chars
  ) s,
  generate_series(1,6)
)
WHERE org_code IS NULL OR org_code = '';

-- 4) Verify
SELECT id, name, org_code
FROM organizations
ORDER BY created_at DESC;
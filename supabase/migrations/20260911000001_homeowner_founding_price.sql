-- Founding household $1 plan for the homeowner landing.

ALTER TABLE landing.pricing
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'agent';

ALTER TABLE landing.pricing
  DROP CONSTRAINT IF EXISTS pricing_audience_check;

ALTER TABLE landing.pricing
  ADD CONSTRAINT pricing_audience_check
  CHECK (audience IN ('agent', 'homeowner'));

ALTER TABLE landing.pricing
  DROP CONSTRAINT IF EXISTS pricing_package_key_check;

ALTER TABLE landing.pricing
  ADD CONSTRAINT pricing_package_key_check
  CHECK (package_key IN ('one', 'three', 'five', 'household'));

UPDATE landing.pricing
SET audience = 'agent'
WHERE package_key IN ('one', 'three', 'five');

INSERT INTO landing.pricing (
  package_key, transaction_count, display_name, tagline, display_price, is_active, audience
) VALUES (
  'household', 1, 'Founding Household', 'Your entire first year', 1, true, 'homeowner'
)
ON CONFLICT (package_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';

-- Homeowner founding-household waitlist. Separate from paid agent reservations.

CREATE TABLE IF NOT EXISTS landing.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL CHECK (audience IN ('homeowner', 'agent')),
  email text NOT NULL,
  phone text,
  market text,
  buying_timeline text CHECK (
    buying_timeline IS NULL
    OR buying_timeline IN ('in_contract', 'within_a_year', 'already_home')
  ),
  sms_consent boolean NOT NULL DEFAULT false,
  sms_consent_at timestamptz,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audience, email)
);

CREATE INDEX IF NOT EXISTS waitlist_audience_idx
  ON landing.waitlist (audience);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx
  ON landing.waitlist (created_at DESC);

DROP TRIGGER IF EXISTS waitlist_updated_at ON landing.waitlist;
CREATE TRIGGER waitlist_updated_at
  BEFORE UPDATE ON landing.waitlist
  FOR EACH ROW EXECUTE FUNCTION landing.set_updated_at();

ALTER TABLE landing.waitlist ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE landing.waitlist FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE landing.waitlist TO service_role;

NOTIFY pgrst, 'reload schema';

-- Landing-page waitlist only. Not part of the Opsy CRM.
-- Later removal: run supabase/drop_landing.sql

CREATE SCHEMA IF NOT EXISTS landing;
COMMENT ON SCHEMA landing IS
  'Landing-page waitlist. Remove with supabase/drop_landing.sql';

CREATE TABLE IF NOT EXISTS landing.pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key text NOT NULL UNIQUE CHECK (package_key IN ('one', 'three', 'five')),
  transaction_count integer NOT NULL CHECK (transaction_count > 0),
  display_name text NOT NULL,
  tagline text NOT NULL,
  stripe_price_id text,
  display_price integer NOT NULL CHECK (display_price >= 0), -- USD dollars, not cents
  stripe_amount integer,
  stripe_currency text NOT NULL DEFAULT 'usd',
  is_active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS landing.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text,
  email text NOT NULL,
  phone text,
  package text NOT NULL CHECK (package IN ('one', 'three', 'five')),
  quantity_reserved integer NOT NULL CHECK (quantity_reserved > 0),
  quantity_used integer NOT NULL DEFAULT 0 CHECK (quantity_used >= 0),
  amount_paid integer,
  payment_status text NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  stripe_customer_id text,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  purchased_at timestamptz,
  first_documents_received_at timestamptz,
  refunded_at timestamptz,
  internal_notes text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS landing.stripe_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_email_idx
  ON landing.reservations (email);
CREATE INDEX IF NOT EXISTS reservations_status_idx
  ON landing.reservations (payment_status);
CREATE INDEX IF NOT EXISTS reservations_purchased_at_idx
  ON landing.reservations (purchased_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS reservations_payment_intent_idx
  ON landing.reservations (stripe_payment_intent_id);

CREATE OR REPLACE FUNCTION landing.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = landing
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pricing_updated_at ON landing.pricing;
CREATE TRIGGER pricing_updated_at
  BEFORE UPDATE ON landing.pricing
  FOR EACH ROW EXECUTE FUNCTION landing.set_updated_at();

DROP TRIGGER IF EXISTS reservations_updated_at ON landing.reservations;
CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON landing.reservations
  FOR EACH ROW EXECUTE FUNCTION landing.set_updated_at();

ALTER TABLE landing.pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing.stripe_events ENABLE ROW LEVEL SECURITY;

REVOKE USAGE ON SCHEMA landing FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA landing FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA landing FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA landing FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA landing TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA landing TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA landing TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA landing TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landing
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landing
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landing
  REVOKE ALL ON ROUTINES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landing
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landing
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landing
  GRANT ALL ON ROUTINES TO service_role;

DO $$
BEGIN
  IF to_regclass('public.founding_pricing') IS NOT NULL THEN
    INSERT INTO landing.pricing (
      id, package_key, transaction_count, display_name, tagline, stripe_price_id,
      display_price, stripe_amount, stripe_currency, is_active, last_synced_at,
      created_at, updated_at
    )
    SELECT
      id, package_key, transaction_count, display_name, tagline, stripe_price_id,
      display_price, stripe_amount, stripe_currency, is_active, last_synced_at,
      created_at, updated_at
    FROM public.founding_pricing
    ON CONFLICT (package_key) DO NOTHING;
  END IF;

  IF to_regclass('public.founding_reservations') IS NOT NULL THEN
    INSERT INTO landing.reservations (
      id, agent_name, email, phone, package, quantity_reserved, quantity_used,
      amount_paid, payment_status, stripe_customer_id, stripe_checkout_session_id,
      stripe_payment_intent_id, purchased_at, first_documents_received_at,
      refunded_at, internal_notes, utm_source, utm_medium, utm_campaign, referrer,
      created_at, updated_at
    )
    SELECT
      id, agent_name, email, phone, package, quantity_reserved, quantity_used,
      amount_paid, payment_status, stripe_customer_id, stripe_checkout_session_id,
      stripe_payment_intent_id, purchased_at, first_documents_received_at,
      refunded_at, internal_notes, utm_source, utm_medium, utm_campaign, referrer,
      created_at, updated_at
    FROM public.founding_reservations
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF to_regclass('public.founding_stripe_events') IS NOT NULL THEN
    INSERT INTO landing.stripe_events (id, event_type, processed_at)
    SELECT id, event_type, processed_at
    FROM public.founding_stripe_events
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

INSERT INTO landing.pricing (
  package_key, transaction_count, display_name, tagline, display_price, is_active
) VALUES
  ('one', 1, 'One Transaction', 'For your next closing', 99, true),
  ('three', 3, 'Three Transactions', 'Most popular', 267, true),
  ('five', 5, 'Five Transactions', 'Best value', 395, true)
ON CONFLICT (package_key) DO NOTHING;

DROP TABLE IF EXISTS public.founding_pricing CASCADE;
DROP TABLE IF EXISTS public.founding_reservations CASCADE;
DROP TABLE IF EXISTS public.founding_stripe_events CASCADE;
DROP FUNCTION IF EXISTS public.founding_set_updated_at();

-- Keep public first so the Opsy CRM Data API is unchanged.
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, landing';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

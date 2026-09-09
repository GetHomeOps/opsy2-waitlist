-- Historical: first waitlist tables in public. Replaced by landing schema
-- in 20260909000001_landing_schema.sql. Do not apply this on a fresh Opsy DB.

CREATE TABLE IF NOT EXISTS public.founding_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key text NOT NULL UNIQUE CHECK (package_key IN ('one', 'three', 'five')),
  transaction_count integer NOT NULL CHECK (transaction_count > 0),
  display_name text NOT NULL,
  tagline text NOT NULL,
  stripe_price_id text,
  display_price integer NOT NULL CHECK (display_price >= 0),
  stripe_amount integer,
  stripe_currency text NOT NULL DEFAULT 'usd',
  is_active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.founding_reservations (
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

CREATE TABLE IF NOT EXISTS public.founding_stripe_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS founding_reservations_email_idx
  ON public.founding_reservations (email);
CREATE INDEX IF NOT EXISTS founding_reservations_status_idx
  ON public.founding_reservations (payment_status);
CREATE INDEX IF NOT EXISTS founding_reservations_purchased_at_idx
  ON public.founding_reservations (purchased_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS founding_reservations_payment_intent_idx
  ON public.founding_reservations (stripe_payment_intent_id);

CREATE OR REPLACE FUNCTION public.founding_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS founding_pricing_updated_at ON public.founding_pricing;
CREATE TRIGGER founding_pricing_updated_at
  BEFORE UPDATE ON public.founding_pricing
  FOR EACH ROW EXECUTE FUNCTION public.founding_set_updated_at();

DROP TRIGGER IF EXISTS founding_reservations_updated_at ON public.founding_reservations;
CREATE TRIGGER founding_reservations_updated_at
  BEFORE UPDATE ON public.founding_reservations
  FOR EACH ROW EXECUTE FUNCTION public.founding_set_updated_at();

ALTER TABLE public.founding_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_stripe_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.founding_pricing FROM anon, authenticated;
REVOKE ALL ON TABLE public.founding_reservations FROM anon, authenticated;
REVOKE ALL ON TABLE public.founding_stripe_events FROM anon, authenticated;

INSERT INTO public.founding_pricing (
  package_key, transaction_count, display_name, tagline, display_price, is_active
) VALUES
  ('one', 1, 'One Transaction', 'For your next closing', 9900, true),
  ('three', 3, 'Three Transactions', 'Most popular', 26700, true),
  ('five', 5, 'Five Transactions', 'Best value', 39500, true)
ON CONFLICT (package_key) DO NOTHING;

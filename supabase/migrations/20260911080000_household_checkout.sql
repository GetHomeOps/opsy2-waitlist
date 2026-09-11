-- Collect the $1 founding household payment through Stripe Checkout.

ALTER TABLE landing.waitlist
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid'
    CHECK (payment_status IN ('pending', 'paid', 'canceled')),
  ADD COLUMN IF NOT EXISTS amount_paid integer,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS purchased_at timestamptz;

CREATE INDEX IF NOT EXISTS waitlist_payment_status_idx
  ON landing.waitlist (payment_status);

ALTER TABLE landing.waitlist
  ALTER COLUMN payment_status SET DEFAULT 'pending';

NOTIFY pgrst, 'reload schema';

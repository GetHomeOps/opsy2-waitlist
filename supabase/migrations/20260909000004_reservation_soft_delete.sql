-- Admin deletes stay gone even if Stripe sync or webhooks see the original checkout.

ALTER TABLE landing.reservations
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS reservations_deleted_at_idx
  ON landing.reservations (deleted_at)
  WHERE deleted_at IS NULL;

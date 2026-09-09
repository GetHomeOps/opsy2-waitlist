-- Refunded waitlist users stay on the dashboard, flagged as canceled.

ALTER TABLE landing.reservations
  DROP CONSTRAINT IF EXISTS reservations_payment_status_check;

UPDATE landing.reservations
SET payment_status = 'canceled'
WHERE payment_status = 'refunded';

ALTER TABLE landing.reservations
  ADD CONSTRAINT reservations_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'canceled'));

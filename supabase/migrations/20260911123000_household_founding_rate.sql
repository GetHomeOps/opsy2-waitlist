-- Founding household website price is $99/yr. Stripe still collects a $1 signup deposit.

UPDATE landing.pricing
SET display_price = 99,
    tagline = 'Your entire first year'
WHERE package_key = 'household'
  AND display_price IN (1, 100);

NOTIFY pgrst, 'reload schema';

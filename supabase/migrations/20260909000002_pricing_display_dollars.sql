-- display_price is USD dollars on the website (99 / 267 / 395), not Stripe cents.

UPDATE landing.pricing
SET display_price = 99
WHERE package_key = 'one' AND display_price IN (99, 9900);

UPDATE landing.pricing
SET display_price = 267
WHERE package_key = 'three' AND display_price IN (267, 26700);

UPDATE landing.pricing
SET display_price = 395
WHERE package_key = 'five' AND display_price IN (395, 39500);

COMMENT ON COLUMN landing.pricing.display_price IS
  'Website display price in USD dollars, not cents.';

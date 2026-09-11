-- One welcome email for agents and homeowners when they join the waitlist.

INSERT INTO landing.email_templates (
  slug, name, audience, trigger, subject, body, is_system
) VALUES (
  'waitlist-welcome',
  'Waitlist welcome',
  'all',
  'registration',
  'You''re on the list',
  E'Hi {{firstName}},\n\nYour spot on the founding list is reserved. We''ll be in touch before launch with next steps.\n\nIf you need a refund, email kino@heyopsy.com. We''ll take care of it.\n\n— The Opsy team',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  audience = EXCLUDED.audience,
  trigger = EXCLUDED.trigger,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  is_system = true,
  updated_at = now();

DELETE FROM landing.email_templates
WHERE slug IN ('homeowner-welcome', 'agent-welcome');

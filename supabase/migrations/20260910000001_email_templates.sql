-- Editable waitlist emails. Sent through Amazon SES from the landing API.

CREATE TABLE IF NOT EXISTS landing.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('homeowner', 'agent', 'all')),
  trigger text NOT NULL CHECK (trigger IN ('registration', 'manual')),
  subject text NOT NULL,
  body text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS landing.email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES landing.email_templates (id) ON DELETE SET NULL,
  trigger text NOT NULL CHECK (trigger IN ('registration', 'test', 'broadcast')),
  recipient_email text NOT NULL,
  waitlist_id uuid REFERENCES landing.waitlist (id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES landing.reservations (id) ON DELETE SET NULL,
  ses_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_sends_template_idx
  ON landing.email_sends (template_id, created_at DESC);
CREATE INDEX IF NOT EXISTS email_sends_created_at_idx
  ON landing.email_sends (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS email_sends_registration_waitlist_idx
  ON landing.email_sends (waitlist_id)
  WHERE trigger = 'registration' AND waitlist_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS email_sends_registration_reservation_idx
  ON landing.email_sends (reservation_id)
  WHERE trigger = 'registration' AND reservation_id IS NOT NULL;

DROP TRIGGER IF EXISTS email_templates_updated_at ON landing.email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON landing.email_templates
  FOR EACH ROW EXECUTE FUNCTION landing.set_updated_at();

ALTER TABLE landing.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing.email_sends ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE landing.email_templates FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE landing.email_sends FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE landing.email_templates TO service_role;
GRANT ALL ON TABLE landing.email_sends TO service_role;

INSERT INTO landing.email_templates (
  slug, name, audience, trigger, subject, body, is_system
) VALUES
(
  'waitlist-welcome',
  'Waitlist welcome',
  'all',
  'registration',
  'You''re on the list',
  E'Hi {{firstName}},\n\nYour spot on the founding list is reserved. We''ll be in touch before launch with next steps.\n\nIf you need a refund, email kino@heyopsy.com. We''ll take care of it.\n\n— The Opsy team',
  true
)
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';

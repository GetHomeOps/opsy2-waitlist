-- Removes the landing-page waitlist from Opsy.
-- Run this in the Opsy SQL editor when the campaign is over.

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

DROP SCHEMA IF EXISTS landing CASCADE;

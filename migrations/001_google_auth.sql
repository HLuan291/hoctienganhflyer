ALTER TABLE users ADD COLUMN google_sub TEXT;
ALTER TABLE users ADD COLUMN google_email_hash TEXT;
CREATE UNIQUE INDEX users_google_sub_idx ON users(google_sub) WHERE google_sub IS NOT NULL;
CREATE UNIQUE INDEX users_google_email_hash_idx ON users(google_email_hash) WHERE google_email_hash IS NOT NULL;


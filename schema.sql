CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('parent','child')),
  parent_id TEXT REFERENCES users(id),
  display_name TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  google_sub TEXT,
  google_email_hash TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS users_parent_idx ON users(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_single_parent_idx ON users(role) WHERE role='parent';
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_idx ON users(google_sub) WHERE google_sub IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_email_hash_idx ON users(google_email_hash) WHERE google_email_hash IS NOT NULL;
CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  data_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS auth_throttle (
  username TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS speech_usage (
  user_id TEXT NOT NULL REFERENCES users(id),
  day_utc TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id,day_utc)
);


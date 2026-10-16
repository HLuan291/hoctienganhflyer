CREATE TABLE IF NOT EXISTS speech_usage (
  user_id TEXT NOT NULL REFERENCES users(id),
  day_utc TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id,day_utc)
);


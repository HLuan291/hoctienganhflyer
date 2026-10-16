CREATE TABLE IF NOT EXISTS solo_links (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS solo_links_user_idx ON solo_links(user_id);


CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  mode_key TEXT NOT NULL,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  date_text TEXT NOT NULL,
  seconds INTEGER NOT NULL,
  flips INTEGER NOT NULL,
  pairs INTEGER NOT NULL,
  opponent TEXT,
  extra TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_mode_key ON scores(mode_key);

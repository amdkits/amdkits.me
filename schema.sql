CREATE TABLE IF NOT EXISTS guestbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  website TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS guestbook_created_at ON guestbook(created_at);

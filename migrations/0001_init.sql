-- Listings: one row per business. Live content is in the main columns.
-- An edit to an already-approved listing is held in pending_json until approved.
CREATE TABLE listings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  token_ver     INTEGER NOT NULL DEFAULT 1, -- bump to invalidate old edit links
  status        TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  hidden        INTEGER NOT NULL DEFAULT 0,        -- owner paused the listing
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  contact_name  TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  website       TEXT NOT NULL DEFAULT '',
  photos        TEXT NOT NULL DEFAULT '[]',        -- JSON array of R2 keys, first = cover
  pending_json  TEXT,                              -- proposed edit (JSON) or NULL
  pending_at    TEXT,
  admin_note    TEXT NOT NULL DEFAULT '',          -- reason shown to the owner on rejection
  ack_version   TEXT NOT NULL DEFAULT '',
  ack_at        TEXT,
  created_at    TEXT NOT NULL,
  approved_at   TEXT,
  updated_at    TEXT NOT NULL
);
CREATE INDEX idx_listings_status ON listings(status, hidden);
CREATE INDEX idx_listings_email ON listings(email);

-- Very small rate limiter (per hashed IP and action, per hour)
CREATE TABLE rate_limits (
  k      TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  n      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (k, bucket)
);

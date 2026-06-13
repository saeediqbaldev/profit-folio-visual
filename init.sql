-- Trading Journal schema (self-hosted, single admin)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profile (single row, id = 'admin')
CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  username TEXT,
  avatar_url TEXT,
  share_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  strategies TEXT[] NOT NULL DEFAULT ARRAY['Strategy 1','Strategy 2','Strategy 3'],
  theme_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep existing deployed databases compatible when new profile fields are added.
ALTER TABLE profile ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS strategies TEXT[] NOT NULL DEFAULT ARRAY['Strategy 1','Strategy 2','Strategy 3'];
ALTER TABLE profile ADD COLUMN IF NOT EXISTS theme_settings JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE profile ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

INSERT INTO profile (id, full_name, username, email)
VALUES ('admin', 'Admin', 'Saeeddev', 'admin@local')
ON CONFLICT (id) DO NOTHING;

-- Forex trades
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sno SERIAL,
  strategy TEXT,
  entry TEXT,
  reason TEXT,
  tp TEXT,
  sl TEXT,
  result TEXT,
  learning TEXT,
  asset_pair TEXT,
  rr TEXT,
  session TEXT,
  screenshot_url TEXT,
  after_trade_screenshot_url TEXT,
  trade_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep existing deployed databases compatible when trade fields are added.
ALTER TABLE trades ADD COLUMN IF NOT EXISTS sno SERIAL;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS strategy TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS tp TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS sl TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS learning TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS asset_pair TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS rr TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS session TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS after_trade_screenshot_url TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_date DATE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE SEQUENCE IF NOT EXISTS trades_sno_seq OWNED BY trades.sno;
ALTER TABLE trades ALTER COLUMN sno SET DEFAULT nextval('trades_sno_seq');
UPDATE trades SET sno = nextval('trades_sno_seq') WHERE sno IS NULL;
SELECT setval('trades_sno_seq', GREATEST((SELECT COALESCE(MAX(sno), 0) FROM trades), 1), (SELECT COALESCE(MAX(sno), 0) FROM trades) > 0);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);

-- Drop legacy PSX table if present
DROP TABLE IF EXISTS psx_trades;

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at DESC);

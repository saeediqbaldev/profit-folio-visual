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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  screenshot_url TEXT,
  after_trade_screenshot_url TEXT,
  trade_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);

-- PSX trades
CREATE TABLE IF NOT EXISTS psx_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sno SERIAL,
  strategy TEXT,
  stock_symbol TEXT NOT NULL,
  shares_purchased INTEGER NOT NULL,
  entry_price NUMERIC(18,4) NOT NULL,
  trade_logic TEXT,
  tp_exit_price NUMERIC(18,4),
  profit_loss NUMERIC(18,4),
  result TEXT DEFAULT 'pending',
  trade_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_psx_created_at ON psx_trades(created_at DESC);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at DESC);

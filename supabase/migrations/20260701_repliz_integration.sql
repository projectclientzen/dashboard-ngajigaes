-- Repliz integration: kolom sinkronisasi schedule + engagement di contents
-- Apply via Supabase SQL Editor atau MCP apply_migration

ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS repliz_schedule_id text,
  ADD COLUMN IF NOT EXISTS repliz_account_id text,
  ADD COLUMN IF NOT EXISTS repliz_status text,
  ADD COLUMN IF NOT EXISTS likes integer,
  ADD COLUMN IF NOT EXISTS comments integer,
  ADD COLUMN IF NOT EXISTS shares integer,
  ADD COLUMN IF NOT EXISTS engagement_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS contents_repliz_schedule_idx
  ON contents (repliz_schedule_id) WHERE repliz_schedule_id IS NOT NULL;

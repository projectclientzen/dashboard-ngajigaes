-- Repliz integration: metric tambahan (reach, saved, views, interaction)
-- Apply via Supabase SQL Editor atau MCP apply_migration

ALTER TABLE contents
  ADD COLUMN IF NOT EXISTS reach integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saved integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interaction integer DEFAULT 0;

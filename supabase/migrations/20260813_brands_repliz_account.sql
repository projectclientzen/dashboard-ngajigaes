-- Mapping brand → akun IG Repliz, dipakai untuk auto-sync account insight
-- (instagram_account_insights) dari Repliz statistic API.

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS repliz_ig_account_id text;

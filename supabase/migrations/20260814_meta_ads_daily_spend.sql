-- Meta Ads daily spend — untuk P&L dashboard (jalankan di Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS public.meta_ads_daily_spend (
  id uuid primary key default gen_random_uuid(),
  spend_date date,
  brand_id uuid references public.brands(id),
  spend numeric,
  purchases integer,
  purchase_value numeric,
  roas numeric,
  leads integer,
  campaign_count integer,
  synced_at timestamptz default now(),
  UNIQUE(spend_date, brand_id)
);

CREATE INDEX IF NOT EXISTS meta_ads_daily_spend_brand_date_idx ON public.meta_ads_daily_spend(brand_id, spend_date);

ALTER TABLE public.meta_ads_daily_spend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_spend_select_auth" ON public.meta_ads_daily_spend FOR SELECT TO authenticated USING (true);

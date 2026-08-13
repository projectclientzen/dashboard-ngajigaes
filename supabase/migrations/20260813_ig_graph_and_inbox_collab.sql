-- Bagian B: kolom follows/unfollows dari IG Graph API + IG user id per brand
ALTER TABLE public.instagram_account_insights
  ADD COLUMN IF NOT EXISTS follows_count integer,
  ADD COLUMN IF NOT EXISTS unfollows_count integer;

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS ig_user_id text;

UPDATE public.brands SET ig_user_id = '27526919080342086' WHERE slug = 'ngajigaes' AND ig_user_id IS NULL;

-- Perlu unique constraint biar upsert(onConflict: 'content_id,insight_date') dari sync IG Graph API bisa jalan
ALTER TABLE public.instagram_content_insights
  ADD CONSTRAINT instagram_content_insights_content_date_unique UNIQUE (content_id, insight_date);

-- account_insight_view: tambah follows_count/unfollows_count (append di akhir —
-- CREATE OR REPLACE VIEW tidak boleh ubah urutan/nama kolom existing)
CREATE OR REPLACE VIEW public.account_insight_view AS
 SELECT id,
    insight_date,
    followers,
    reach,
    impressions,
    profile_visits,
    link_clicks,
    dm_count,
    total_likes,
    total_comments,
    total_saves,
    total_shares,
    notes,
    brand_id,
    created_at,
    updated_at,
    (followers - lag(followers) OVER (PARTITION BY brand_id ORDER BY insight_date)) AS follower_growth,
        CASE
            WHEN (COALESCE(reach, 0) > 0) THEN ((((((COALESCE(total_likes, 0) + COALESCE(total_comments, 0)) + COALESCE(total_saves, 0)) + COALESCE(total_shares, 0)))::numeric / (reach)::numeric) * (100)::numeric)
            WHEN (COALESCE(impressions, 0) > 0) THEN ((((((COALESCE(total_likes, 0) + COALESCE(total_comments, 0)) + COALESCE(total_saves, 0)) + COALESCE(total_shares, 0)))::numeric / (impressions)::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END AS engagement_rate,
    follows_count,
    unfollows_count
   FROM instagram_account_insights i;

-- Bagian C: kolaborasi inbox — assignment & riwayat resolve komentar/chat Repliz
-- (komentar/chat sendiri live di Repliz, bukan tabel lokal — meta ini nempel via id text)
CREATE TABLE IF NOT EXISTS public.repliz_comment_meta (
  comment_id text primary key,
  assignee_id uuid references public.users(id) on delete set null,
  resolved_by uuid references public.users(id) on delete set null,
  resolved_at timestamptz,
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.repliz_chat_meta (
  chat_id text primary key,
  assignee_id uuid references public.users(id) on delete set null,
  updated_at timestamptz default now()
);

ALTER TABLE public.repliz_comment_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repliz_chat_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY repliz_comment_meta_select ON public.repliz_comment_meta FOR SELECT TO authenticated USING (true);
CREATE POLICY repliz_comment_meta_insert ON public.repliz_comment_meta FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY repliz_comment_meta_update ON public.repliz_comment_meta FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY repliz_chat_meta_select ON public.repliz_chat_meta FOR SELECT TO authenticated USING (true);
CREATE POLICY repliz_chat_meta_insert ON public.repliz_chat_meta FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY repliz_chat_meta_update ON public.repliz_chat_meta FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

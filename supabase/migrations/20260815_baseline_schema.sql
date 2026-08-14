-- P-7: Baseline schema — snapshot skema produksi (adslab-ngajigaes / xnfnbfqtskgiutvhhjjo)
-- diambil 15 Agu 2026 via introspeksi SQL read-only (information_schema + pg_catalog),
-- BUKAN via `supabase db dump` (tidak ada connection string/psql akses langsung dari
-- sesi ini — hanya lewat Supabase MCP). Semua definisi di bawah diverifikasi ada di
-- database live saat file ini ditulis.
--
-- Tujuan file ini: dokumentasi, BUKAN untuk dijalankan ulang. Skema sudah ada di
-- produksi — ini "starting point" supaya migration berikutnya (termasuk 12+ tabel dan
-- semua policy anon yang sebelumnya cuma komentar di 20260626_ngajigaes_full_schema.sql)
-- akhirnya ter-review lewat PR, bukan menghilang di SQL Editor (akar masalah K-1/P-7).
--
-- Sudah termasuk migration s/d 20260815_view_security_invoker.sql (M1 read-only,
-- M2 scalev_pii, M5 scalev_store_id, M6 view security_invoker + tasks_team_select).
-- BELUM termasuk: 20260815_fix_anon_write.sql (M1 tulis — masih ditahan, lihat file itu).

-- ── Extensions yang dipakai (terdeteksi dari default kolom) ──────────────
-- uuid-ossp (uuid_generate_v4), pgcrypto/pgcore (gen_random_uuid) — sudah aktif di
-- proyek Supabase ini secara default, tidak perlu CREATE EXTENSION eksplisit di sini.

-- ══════════════════════════════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.action_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  weekly_review_id uuid,
  title text NOT NULL,
  description text,
  pic_id uuid NOT NULL,
  deadline timestamp with time zone,
  priority text NOT NULL DEFAULT 'medium'::text,
  status text NOT NULL DEFAULT 'todo'::text,
  converted_task_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ads_detail (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  library_id text NOT NULL,
  advertiser_name text,
  ad_copy text,
  creative_type text,
  cta_button text,
  destination_url text,
  date_active timestamp with time zone,
  funnel_type text,
  funnel_override text,
  campaign_stage text,
  stage_confidence double precision,
  stage_override text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alert_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  alert_key text NOT NULL,
  brand text NOT NULL,
  type text NOT NULL,
  campaign_id text,
  message_text text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  dry_run boolean NOT NULL DEFAULT false,
  telegram_message_id text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid
);

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  color text,
  logo_url text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  repliz_ig_account_id text,
  ig_user_id text,
  scalev_store_id text
);

CREATE TABLE IF NOT EXISTS public.campaign_kpi_targets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  brand text NOT NULL,
  campaign_id text NOT NULL,
  kpi_type text NOT NULL,
  target_value numeric(12,4) NOT NULL,
  set_by text,
  created_at timestamp with time zone DEFAULT now(),
  brand_id uuid
);

CREATE TABLE IF NOT EXISTS public.campaign_snapshots (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  brand text NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  adset_id text NOT NULL DEFAULT ''::text,
  adset_name text,
  ad_id text NOT NULL DEFAULT ''::text,
  ad_name text,
  level text NOT NULL,
  date_start date NOT NULL,
  date_stop date NOT NULL,
  spend numeric(12,2),
  reach integer,
  impressions integer,
  clicks integer,
  ctr numeric(6,4),
  cpm numeric(10,2),
  frequency numeric(6,4),
  purchases integer,
  purchase_value numeric(12,2),
  leads integer,
  roas numeric(8,4),
  cpl numeric(10,2),
  cpp numeric(10,2),
  status text,
  fetched_at timestamp with time zone DEFAULT now(),
  brand_id uuid
);

CREATE TABLE IF NOT EXISTS public.contents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  format text NOT NULL,
  theme text,
  objective text NOT NULL,
  status text NOT NULL DEFAULT 'idea'::text,
  pic_id uuid NOT NULL,
  publish_date timestamp with time zone,
  asset_link text,
  post_link text,
  caption text,
  hook text,
  cta text,
  curator_notes text,
  validation_status text NOT NULL DEFAULT 'not_needed'::text,
  task_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  repliz_schedule_id text,
  repliz_status text,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  engagement_synced_at timestamp with time zone,
  brand_id uuid NOT NULL,
  reach integer DEFAULT 0,
  saved integer DEFAULT 0,
  views integer DEFAULT 0,
  interaction integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.daily_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date NOT NULL,
  plan_today text,
  completed_work text,
  unfinished_work text,
  blockers text,
  ideas_insights text,
  notes text,
  work_link text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  kpi_entries jsonb DEFAULT '[]'::jsonb,
  proof_url text,
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.extra_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  note text,
  assignee_id uuid NOT NULL,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  description text,
  leader_url text,
  reply text,
  reply_url text,
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fetch_status (
  brand text NOT NULL,
  last_fetched_at timestamp with time zone,
  status text,
  error_message text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid
);

CREATE TABLE IF NOT EXISTS public.instagram_account_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  insight_date date NOT NULL,
  followers integer,
  reach integer,
  impressions integer,
  profile_visits integer,
  link_clicks integer,
  dm_count integer,
  total_likes integer,
  total_comments integer,
  total_saves integer,
  total_shares integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL,
  engagement_rate numeric,
  follows_count integer,
  unfollows_count integer
);

CREATE TABLE IF NOT EXISTS public.instagram_content_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  insight_date date NOT NULL,
  reach integer,
  impressions integer,
  likes integer,
  comments integer,
  saves integer,
  shares integer,
  profile_visits integer,
  link_clicks integer,
  dm_generated integer,
  performance_status text,
  evaluation_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kpi_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kpi_id uuid NOT NULL,
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_value numeric NOT NULL,
  actual_value numeric NOT NULL,
  achievement_percentage numeric NOT NULL,
  weighted_score numeric NOT NULL,
  input_type text NOT NULL,
  notes text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kpis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  role_id uuid,
  user_id uuid,
  target_value numeric NOT NULL,
  unit text NOT NULL,
  weight numeric NOT NULL,
  period text NOT NULL,
  calculation_method text NOT NULL,
  data_source_config jsonb,
  max_score_cap numeric DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.meta_ads_daily_spend (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  spend_date date,
  brand_id uuid,
  spend numeric,
  purchases integer,
  purchase_value numeric,
  roas numeric,
  leads integer,
  campaign_count integer,
  synced_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_manual_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sales_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Jakarta'::text))::date,
  product_name text NOT NULL,
  gross_revenue numeric NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  notes text,
  brand_id uuid NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.productivity_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  task_completion_score numeric NOT NULL DEFAULT 0,
  deadline_accuracy_score numeric NOT NULL DEFAULT 0,
  kpi_score numeric NOT NULL DEFAULT 0,
  quality_score numeric,
  initiative_score numeric,
  final_score numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'critical'::text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  price numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.repliz_chat_meta (
  chat_id text NOT NULL,
  assignee_id uuid,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.repliz_comment_meta (
  comment_id text NOT NULL,
  assignee_id uuid,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  permissions jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sales_date date NOT NULL,
  product_id uuid NOT NULL,
  order_count integer NOT NULL,
  quantity integer NOT NULL,
  product_price numeric(14,2) NOT NULL,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  gross_revenue numeric(14,2) DEFAULT ((quantity)::numeric * product_price),
  net_revenue numeric(14,2) DEFAULT (((quantity)::numeric * product_price) - discount),
  source text NOT NULL,
  channel text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.scalev_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id text,
  scalev_id text,
  customer_name text,
  customer_phone text,
  customer_email text,
  status text,
  gross_revenue numeric,
  net_payment_revenue numeric,
  payment_fee numeric,
  scalev_fee numeric,
  service_fee numeric,
  payment_method text,
  order_date date,
  is_spam boolean DEFAULT false,
  brand_id uuid,
  synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scalev_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scalev_id text,
  name text,
  slug text,
  price numeric,
  stock integer,
  status text,
  brand_id uuid,
  synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scalev_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scalev_unique_id text,
  event_type text NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_status text NOT NULL DEFAULT 'pending'::text,
  error_message text,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.score_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_weight numeric NOT NULL DEFAULT 0.3,
  deadline_weight numeric NOT NULL DEFAULT 0.2,
  kpi_weight numeric NOT NULL DEFAULT 0.3,
  quality_weight numeric NOT NULL DEFAULT 0.1,
  initiative_weight numeric NOT NULL DEFAULT 0.1,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  assignee_id uuid NOT NULL,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'todo'::text,
  priority text NOT NULL DEFAULT 'medium'::text,
  deadline timestamp with time zone,
  completed_at timestamp with time zone,
  result_link text,
  attachment_url text,
  revision_notes text,
  estimated_hours numeric,
  actual_hours numeric,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role_id uuid NOT NULL,
  avatar_url text,
  status text NOT NULL DEFAULT 'active'::text,
  joined_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  revenue_summary jsonb,
  task_summary jsonb,
  kpi_summary jsonb,
  instagram_summary jsonb,
  main_problem text,
  leader_notes text,
  decision text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_id uuid NOT NULL
);

-- ══════════════════════════════════════════════════════════════════════
-- CONSTRAINTS (primary key, foreign key, unique, check)
-- ══════════════════════════════════════════════════════════════════════

ALTER TABLE ONLY public.action_plans ADD CONSTRAINT action_plans_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])));
ALTER TABLE ONLY public.action_plans ADD CONSTRAINT action_plans_status_check CHECK ((status = ANY (ARRAY['backlog'::text, 'todo'::text, 'in_progress'::text, 'need_review'::text, 'revision'::text, 'done'::text, 'blocked'::text, 'cancelled'::text])));
ALTER TABLE ONLY public.action_plans ADD CONSTRAINT action_plans_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.action_plans ADD CONSTRAINT action_plans_converted_task_id_fkey FOREIGN KEY (converted_task_id) REFERENCES tasks(id);
ALTER TABLE ONLY public.action_plans ADD CONSTRAINT action_plans_pic_id_fkey FOREIGN KEY (pic_id) REFERENCES users(id);
ALTER TABLE ONLY public.action_plans ADD CONSTRAINT action_plans_weekly_review_id_fkey FOREIGN KEY (weekly_review_id) REFERENCES weekly_reviews(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.action_plans ADD CONSTRAINT action_plans_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ads_detail ADD CONSTRAINT ads_detail_campaign_stage_check CHECK ((campaign_stage = ANY (ARRAY['TOFU'::text, 'MOFU'::text, 'BOFU'::text])));
ALTER TABLE ONLY public.ads_detail ADD CONSTRAINT ads_detail_creative_type_check CHECK ((creative_type = ANY (ARRAY['image'::text, 'video'::text, 'carousel'::text])));
ALTER TABLE ONLY public.ads_detail ADD CONSTRAINT ads_detail_funnel_type_check CHECK ((funnel_type = ANY (ARRAY['LP'::text, 'CTWA'::text, 'Visit Profile'::text, 'Lead Form'::text])));
ALTER TABLE ONLY public.ads_detail ADD CONSTRAINT ads_detail_stage_confidence_check CHECK (((stage_confidence >= (0)::double precision) AND (stage_confidence <= (1)::double precision)));
ALTER TABLE ONLY public.ads_detail ADD CONSTRAINT ads_detail_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ads_detail ADD CONSTRAINT ads_detail_library_id_key UNIQUE (library_id);
ALTER TABLE ONLY public.alert_log ADD CONSTRAINT alert_log_brand_check CHECK ((brand = ANY (ARRAY['ngajigaes'::text, 'labbaika'::text, 'alaika'::text])));
ALTER TABLE ONLY public.alert_log ADD CONSTRAINT alert_log_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.alert_log ADD CONSTRAINT alert_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.alert_log ADD CONSTRAINT alert_log_alert_key_key UNIQUE (alert_key);
ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.campaign_kpi_targets ADD CONSTRAINT campaign_kpi_targets_brand_check CHECK ((brand = ANY (ARRAY['ngajigaes'::text, 'labbaika'::text, 'alaika'::text])));
ALTER TABLE ONLY public.campaign_kpi_targets ADD CONSTRAINT campaign_kpi_targets_kpi_type_check CHECK ((kpi_type = ANY (ARRAY['roas'::text, 'cpl'::text, 'cpp'::text, 'reach'::text, 'spend'::text])));
ALTER TABLE ONLY public.campaign_kpi_targets ADD CONSTRAINT campaign_kpi_targets_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.campaign_kpi_targets ADD CONSTRAINT campaign_kpi_targets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_kpi_targets ADD CONSTRAINT campaign_kpi_targets_campaign_id_kpi_type_key UNIQUE (campaign_id, kpi_type);
ALTER TABLE ONLY public.campaign_snapshots ADD CONSTRAINT campaign_snapshots_brand_check CHECK ((brand = ANY (ARRAY['ngajigaes'::text, 'labbaika'::text, 'alaika'::text])));
ALTER TABLE ONLY public.campaign_snapshots ADD CONSTRAINT campaign_snapshots_level_check CHECK ((level = ANY (ARRAY['campaign'::text, 'adset'::text, 'ad'::text])));
ALTER TABLE ONLY public.campaign_snapshots ADD CONSTRAINT campaign_snapshots_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.campaign_snapshots ADD CONSTRAINT campaign_snapshots_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_snapshots ADD CONSTRAINT uq_snapshot_identity UNIQUE (brand, campaign_id, adset_id, ad_id, level, date_start, date_stop);
ALTER TABLE ONLY public.contents ADD CONSTRAINT contents_format_check CHECK ((format = ANY (ARRAY['feed_single'::text, 'carousel'::text, 'reels'::text, 'story'::text, 'ads_creative'::text, 'live'::text, 'other'::text])));
ALTER TABLE ONLY public.contents ADD CONSTRAINT contents_objective_check CHECK ((objective = ANY (ARRAY['awareness'::text, 'engagement'::text, 'education'::text, 'trust_building'::text, 'lead_generation'::text, 'sales'::text, 'community_building'::text])));
ALTER TABLE ONLY public.contents ADD CONSTRAINT contents_status_check CHECK ((status = ANY (ARRAY['idea'::text, 'research'::text, 'draft'::text, 'design'::text, 'editing'::text, 'need_review'::text, 'need_validation'::text, 'scheduled'::text, 'published'::text, 'evaluated'::text, 'cancelled'::text])));
ALTER TABLE ONLY public.contents ADD CONSTRAINT contents_validation_status_check CHECK ((validation_status = ANY (ARRAY['not_needed'::text, 'waiting_validation'::text, 'revision'::text, 'approved'::text])));
ALTER TABLE ONLY public.contents ADD CONSTRAINT contents_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.contents ADD CONSTRAINT contents_pic_id_fkey FOREIGN KEY (pic_id) REFERENCES users(id);
ALTER TABLE ONLY public.contents ADD CONSTRAINT contents_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id);
ALTER TABLE ONLY public.contents ADD CONSTRAINT contents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.daily_reports ADD CONSTRAINT daily_reports_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.daily_reports ADD CONSTRAINT daily_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY public.daily_reports ADD CONSTRAINT daily_reports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.extra_tasks ADD CONSTRAINT extra_tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'done'::text])));
ALTER TABLE ONLY public.extra_tasks ADD CONSTRAINT extra_tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.extra_tasks ADD CONSTRAINT extra_tasks_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.extra_tasks ADD CONSTRAINT extra_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.extra_tasks ADD CONSTRAINT extra_tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.fetch_status ADD CONSTRAINT fetch_status_brand_check CHECK ((brand = ANY (ARRAY['ngajigaes'::text, 'labbaika'::text, 'alaika'::text])));
ALTER TABLE ONLY public.fetch_status ADD CONSTRAINT fetch_status_status_check CHECK ((status = ANY (ARRAY['success'::text, 'error'::text])));
ALTER TABLE ONLY public.fetch_status ADD CONSTRAINT fetch_status_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.fetch_status ADD CONSTRAINT fetch_status_pkey PRIMARY KEY (brand);
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_dm_count_check CHECK ((dm_count >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_followers_check CHECK ((followers >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_impressions_check CHECK ((impressions >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_link_clicks_check CHECK ((link_clicks >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_profile_visits_check CHECK ((profile_visits >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_reach_check CHECK ((reach >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_total_comments_check CHECK ((total_comments >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_total_likes_check CHECK ((total_likes >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_total_saves_check CHECK ((total_saves >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_total_shares_check CHECK ((total_shares >= 0));
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.instagram_account_insights ADD CONSTRAINT instagram_account_insights_date_brand_key UNIQUE (insight_date, brand_id);
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_comments_check CHECK ((comments >= 0));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_dm_generated_check CHECK ((dm_generated >= 0));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_impressions_check CHECK ((impressions >= 0));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_likes_check CHECK ((likes >= 0));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_link_clicks_check CHECK ((link_clicks >= 0));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_performance_status_check CHECK ((performance_status = ANY (ARRAY['winner'::text, 'average'::text, 'low'::text])));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_profile_visits_check CHECK ((profile_visits >= 0));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_reach_check CHECK ((reach >= 0));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_saves_check CHECK ((saves >= 0));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_shares_check CHECK ((shares >= 0));
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_content_id_fkey FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.instagram_content_insights ADD CONSTRAINT instagram_content_insights_content_date_unique UNIQUE (content_id, insight_date);
ALTER TABLE ONLY public.kpi_results ADD CONSTRAINT kpi_results_input_type_check CHECK ((input_type = ANY (ARRAY['manual'::text, 'automatic'::text])));
ALTER TABLE ONLY public.kpi_results ADD CONSTRAINT kpi_results_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.kpi_results ADD CONSTRAINT kpi_results_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES kpis(id);
ALTER TABLE ONLY public.kpi_results ADD CONSTRAINT kpi_results_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id);
ALTER TABLE ONLY public.kpi_results ADD CONSTRAINT kpi_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY public.kpi_results ADD CONSTRAINT kpi_results_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.kpi_results ADD CONSTRAINT kpi_results_kpi_id_user_id_period_start_period_end_key UNIQUE (kpi_id, user_id, period_start, period_end);
ALTER TABLE ONLY public.kpis ADD CONSTRAINT kpis_calculation_method_check CHECK ((calculation_method = ANY (ARRAY['manual'::text, 'task'::text, 'content'::text, 'sales'::text, 'instagram'::text])));
ALTER TABLE ONLY public.kpis ADD CONSTRAINT kpis_check CHECK (((role_id IS NOT NULL) OR (user_id IS NOT NULL)));
ALTER TABLE ONLY public.kpis ADD CONSTRAINT kpis_period_check CHECK ((period = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'custom'::text])));
ALTER TABLE ONLY public.kpis ADD CONSTRAINT kpis_target_value_check CHECK ((target_value > (0)::numeric));
ALTER TABLE ONLY public.kpis ADD CONSTRAINT kpis_weight_check CHECK (((weight >= (0)::numeric) AND (weight <= (100)::numeric)));
ALTER TABLE ONLY public.kpis ADD CONSTRAINT kpis_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.kpis ADD CONSTRAINT kpis_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id);
ALTER TABLE ONLY public.kpis ADD CONSTRAINT kpis_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY public.kpis ADD CONSTRAINT kpis_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.meta_ads_daily_spend ADD CONSTRAINT meta_ads_daily_spend_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.meta_ads_daily_spend ADD CONSTRAINT meta_ads_daily_spend_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.meta_ads_daily_spend ADD CONSTRAINT meta_ads_daily_spend_spend_date_brand_id_key UNIQUE (spend_date, brand_id);
ALTER TABLE ONLY public.performance_manual_sales ADD CONSTRAINT performance_manual_sales_gross_revenue_check CHECK ((gross_revenue >= (0)::numeric));
ALTER TABLE ONLY public.performance_manual_sales ADD CONSTRAINT performance_manual_sales_qty_check CHECK ((qty >= 1));
ALTER TABLE ONLY public.performance_manual_sales ADD CONSTRAINT performance_manual_sales_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.performance_manual_sales ADD CONSTRAINT performance_manual_sales_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE ONLY public.performance_manual_sales ADD CONSTRAINT performance_manual_sales_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.productivity_scores ADD CONSTRAINT productivity_scores_status_check CHECK ((status = ANY (ARRAY['excellent'::text, 'good'::text, 'need_improvement'::text, 'warning'::text, 'critical'::text])));
ALTER TABLE ONLY public.productivity_scores ADD CONSTRAINT productivity_scores_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.productivity_scores ADD CONSTRAINT productivity_scores_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id);
ALTER TABLE ONLY public.productivity_scores ADD CONSTRAINT productivity_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY public.productivity_scores ADD CONSTRAINT productivity_scores_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.productivity_scores ADD CONSTRAINT productivity_scores_user_brand_period_key UNIQUE (user_id, brand_id, period_start, period_end);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_price_check CHECK ((price >= (0)::numeric));
ALTER TABLE ONLY public.products ADD CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
ALTER TABLE ONLY public.products ADD CONSTRAINT products_type_check CHECK ((type = ANY (ARRAY['ebook'::text, 'bundle'::text, 'ecourse'::text, 'audiobook'::text, 'other'::text])));
ALTER TABLE ONLY public.products ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);
ALTER TABLE ONLY public.repliz_chat_meta ADD CONSTRAINT repliz_chat_meta_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.repliz_chat_meta ADD CONSTRAINT repliz_chat_meta_pkey PRIMARY KEY (chat_id);
ALTER TABLE ONLY public.repliz_comment_meta ADD CONSTRAINT repliz_comment_meta_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.repliz_comment_meta ADD CONSTRAINT repliz_comment_meta_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.repliz_comment_meta ADD CONSTRAINT repliz_comment_meta_pkey PRIMARY KEY (comment_id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_name_check CHECK ((name = ANY (ARRAY['leader'::text, 'feed_socmed'::text, 'reels_ads'::text, 'curator'::text])));
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);
ALTER TABLE ONLY public.sales_records ADD CONSTRAINT sales_records_check CHECK ((quantity >= order_count));
ALTER TABLE ONLY public.sales_records ADD CONSTRAINT sales_records_discount_check CHECK ((discount >= (0)::numeric));
ALTER TABLE ONLY public.sales_records ADD CONSTRAINT sales_records_order_count_check CHECK ((order_count > 0));
ALTER TABLE ONLY public.sales_records ADD CONSTRAINT sales_records_product_price_check CHECK ((product_price >= (0)::numeric));
ALTER TABLE ONLY public.sales_records ADD CONSTRAINT sales_records_source_check CHECK ((source = ANY (ARRAY['instagram_organic'::text, 'meta_ads'::text, 'whatsapp'::text, 'telegram'::text, 'affiliate'::text, 'broadcast'::text, 'unknown'::text, 'other'::text])));
ALTER TABLE ONLY public.sales_records ADD CONSTRAINT sales_records_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.sales_records ADD CONSTRAINT sales_records_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE ONLY public.sales_records ADD CONSTRAINT sales_records_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.scalev_orders ADD CONSTRAINT scalev_orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.scalev_orders ADD CONSTRAINT scalev_orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.scalev_orders ADD CONSTRAINT scalev_orders_order_id_key UNIQUE (order_id);
ALTER TABLE ONLY public.scalev_products ADD CONSTRAINT scalev_products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.scalev_products ADD CONSTRAINT scalev_products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.scalev_products ADD CONSTRAINT scalev_products_scalev_id_key UNIQUE (scalev_id);
ALTER TABLE ONLY public.scalev_webhook_events ADD CONSTRAINT scalev_webhook_events_processed_status_check CHECK ((processed_status = ANY (ARRAY['pending'::text, 'processed'::text, 'failed'::text, 'ignored'::text])));
ALTER TABLE ONLY public.scalev_webhook_events ADD CONSTRAINT scalev_webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.score_settings ADD CONSTRAINT score_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id);
ALTER TABLE ONLY public.score_settings ADD CONSTRAINT score_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.task_comments ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.task_comments ADD CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY public.task_comments ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tasks ADD CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])));
ALTER TABLE ONLY public.tasks ADD CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['backlog'::text, 'todo'::text, 'in_progress'::text, 'need_review'::text, 'revision'::text, 'done'::text, 'blocked'::text, 'cancelled'::text])));
ALTER TABLE ONLY public.tasks ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES users(id);
ALTER TABLE ONLY public.tasks ADD CONSTRAINT tasks_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.tasks ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE ONLY public.tasks ADD CONSTRAINT tasks_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id);
ALTER TABLE ONLY public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
ALTER TABLE ONLY public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.users ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.weekly_reviews ADD CONSTRAINT weekly_reviews_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE ONLY public.weekly_reviews ADD CONSTRAINT weekly_reviews_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE ONLY public.weekly_reviews ADD CONSTRAINT weekly_reviews_pkey PRIMARY KEY (id);

-- ══════════════════════════════════════════════════════════════════════
-- INDEXES (selain yang otomatis dibuat oleh PK/UNIQUE constraint di atas)
-- ══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS action_plans_brand_idx ON public.action_plans USING btree (brand_id);
CREATE INDEX IF NOT EXISTS idx_action_review ON public.action_plans USING btree (weekly_review_id);
CREATE INDEX IF NOT EXISTS idx_ads_detail_advertiser ON public.ads_detail USING btree (advertiser_name);
CREATE INDEX IF NOT EXISTS idx_ads_detail_created ON public.ads_detail USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_detail_funnel ON public.ads_detail USING btree (funnel_type);
CREATE INDEX IF NOT EXISTS idx_alert_log_brand_sent_at ON public.alert_log USING btree (brand, sent_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS brands_scalev_store_id_idx ON public.brands USING btree (scalev_store_id) WHERE (scalev_store_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_campaign_snapshots_brand_date ON public.campaign_snapshots USING btree (brand, date_start DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_snapshots_campaign_level ON public.campaign_snapshots USING btree (campaign_id, level);
CREATE INDEX IF NOT EXISTS idx_campaign_snapshots_fetched_at ON public.campaign_snapshots USING btree (fetched_at DESC);
CREATE INDEX IF NOT EXISTS contents_brand_idx ON public.contents USING btree (brand_id);
CREATE INDEX IF NOT EXISTS idx_contents_pic ON public.contents USING btree (pic_id);
CREATE INDEX IF NOT EXISTS idx_contents_publish ON public.contents USING btree (publish_date);
CREATE INDEX IF NOT EXISTS idx_contents_status ON public.contents USING btree (status);
CREATE INDEX IF NOT EXISTS idx_contents_task ON public.contents USING btree (task_id);
CREATE INDEX IF NOT EXISTS daily_reports_brand_idx ON public.daily_reports USING btree (brand_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_date ON public.daily_reports USING btree (user_id, report_date);
CREATE INDEX IF NOT EXISTS extra_tasks_brand_idx ON public.extra_tasks USING btree (brand_id);
CREATE INDEX IF NOT EXISTS idx_acc_insight_date ON public.instagram_account_insights USING btree (insight_date);
CREATE INDEX IF NOT EXISTS instagram_account_insights_brand_idx ON public.instagram_account_insights USING btree (brand_id);
CREATE INDEX IF NOT EXISTS idx_content_insight ON public.instagram_content_insights USING btree (content_id, insight_date);
CREATE INDEX IF NOT EXISTS instagram_content_insights_brand_idx ON public.instagram_content_insights USING btree (brand_id);
CREATE INDEX IF NOT EXISTS idx_kpi_results_user ON public.kpi_results USING btree (user_id);
CREATE INDEX IF NOT EXISTS kpi_results_brand_idx ON public.kpi_results USING btree (brand_id);
CREATE INDEX IF NOT EXISTS idx_kpis_role ON public.kpis USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_kpis_user ON public.kpis USING btree (user_id);
CREATE INDEX IF NOT EXISTS kpis_brand_idx ON public.kpis USING btree (brand_id);
CREATE INDEX IF NOT EXISTS meta_ads_daily_spend_brand_date_idx ON public.meta_ads_daily_spend USING btree (brand_id, spend_date);
CREATE INDEX IF NOT EXISTS performance_manual_sales_brand_date_idx ON public.performance_manual_sales USING btree (brand_id, sales_date);
CREATE INDEX IF NOT EXISTS productivity_scores_brand_idx ON public.productivity_scores USING btree (brand_id);
CREATE INDEX IF NOT EXISTS products_brand_idx ON public.products USING btree (brand_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales_records USING btree (sales_date);
CREATE INDEX IF NOT EXISTS idx_sales_product ON public.sales_records USING btree (product_id);
CREATE INDEX IF NOT EXISTS sales_records_brand_idx ON public.sales_records USING btree (brand_id);
CREATE INDEX IF NOT EXISTS scalev_orders_brand_date_idx ON public.scalev_orders USING btree (brand_id, order_date);
CREATE INDEX IF NOT EXISTS scalev_products_brand_idx ON public.scalev_products USING btree (brand_id);
CREATE INDEX IF NOT EXISTS scalev_webhook_events_status_idx ON public.scalev_webhook_events USING btree (processed_status, received_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS scalev_webhook_events_unique_id_idx ON public.scalev_webhook_events USING btree (scalev_unique_id) WHERE (scalev_unique_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_comments_task ON public.task_comments USING btree (task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks USING btree (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks USING btree (category);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks USING btree (completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks USING btree (deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks USING btree (status);
CREATE INDEX IF NOT EXISTS tasks_brand_idx ON public.tasks USING btree (brand_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role_id);
CREATE INDEX IF NOT EXISTS weekly_reviews_brand_idx ON public.weekly_reviews USING btree (brand_id);

-- ══════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════
-- Catatan (audit M-6, belum di-apply — task terpisah di TASK-RINGAN R6):
-- set_updated_at() dan jakarta_date() belum SET search_path — beda dari
-- fungsi lain di file ini yang sudah benar (current_user_role dkk.).

CREATE OR REPLACE FUNCTION public.jakarta_date(ts timestamp with time zone)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select (ts at time zone 'Asia/Jakarta')::date;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.set_updated_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_by = auth.uid();
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select r.name
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.guard_content_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.validation_status is distinct from old.validation_status
     and public.current_user_role() not in ('leader','curator') then
    raise exception 'Hanya kurator atau leader yang boleh mengubah status validasi';
  end if;
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.get_product_sold(p_start date, p_end date, p_brand_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(sales_date date, product_id uuid, product_name text, order_count integer, quantity integer, channel text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    sr.sales_date, sr.product_id, p.name, sr.order_count, sr.quantity, sr.channel
  from public.sales_records sr
  join public.products p on p.id = sr.product_id
  where sr.sales_date between p_start and p_end
    and (p_brand_id is null or sr.brand_id = p_brand_id)
  order by sr.sales_date desc;
$function$;

CREATE OR REPLACE FUNCTION public.compute_kpi_actual(p_kpi_id uuid, p_user_id uuid, p_start date, p_end date, p_brand_id uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  cfg jsonb;
  method text;
  metric text;
  agg text;
  result numeric := 0;
begin
  select calculation_method, data_source_config
    into method, cfg
  from public.kpis
  where id = p_kpi_id;

  cfg := coalesce(cfg, '{}'::jsonb);

  if method = 'manual' then
    select actual_value into result
    from public.kpi_results
    where kpi_id = p_kpi_id
      and user_id = p_user_id
      and period_start = p_start
      and period_end = p_end
      and (p_brand_id is null or brand_id = p_brand_id);

  elsif method = 'task' then
    select count(*) into result
    from public.tasks
    where assignee_id = p_user_id
      and completed_at is not null
      and public.jakarta_date(completed_at) between p_start and p_end
      and (p_brand_id is null or brand_id = p_brand_id)
      and (cfg->'filters'->'category' is null
           or category = any(select jsonb_array_elements_text(cfg->'filters'->'category')))
      and (cfg->'filters'->'status' is null
           or status = any(select jsonb_array_elements_text(cfg->'filters'->'status')));

  elsif method = 'content' then
    select count(*) into result
    from public.contents
    where pic_id = p_user_id
      and publish_date is not null
      and public.jakarta_date(publish_date) between p_start and p_end
      and (p_brand_id is null or brand_id = p_brand_id)
      and (cfg->'filters'->'format' is null
           or format = any(select jsonb_array_elements_text(cfg->'filters'->'format')))
      and (cfg->'filters'->'status' is null
           or status = any(select jsonb_array_elements_text(cfg->'filters'->'status')));

  elsif method = 'sales' then
    metric := coalesce(cfg->>'metric', 'order_count');
    if metric not in ('order_count','quantity','gross_revenue') then
      raise exception 'metric sales tidak valid: %', metric;
    end if;
    execute format(
      'select coalesce(sum(%I),0) from public.sales_records
       where sales_date between $1 and $2
         and ($4 is null or brand_id = $4)
         and ($3->''filters''->''source'' is null
              or source = any(select jsonb_array_elements_text($3->''filters''->''source'')))',
      metric
    ) into result using p_start, p_end, cfg, p_brand_id;

  elsif method = 'instagram' then
    metric := coalesce(cfg->>'metric', 'reach');
    agg    := coalesce(cfg->>'aggregate', 'sum');
    if metric not in ('reach','impressions','engagement_rate','follower_growth','followers') then
      raise exception 'metric instagram tidak valid: %', metric;
    end if;
    if agg = 'last' then
      execute format(
        'select %I from public.account_insight_view
         where insight_date between $1 and $2
           and ($3 is null or brand_id = $3)
         order by insight_date desc limit 1', metric
      ) into result using p_start, p_end, p_brand_id;
    else
      execute format(
        'select coalesce(%s(%I),0) from public.account_insight_view
         where insight_date between $1 and $2
           and ($3 is null or brand_id = $3)',
        case when agg = 'avg' then 'avg' else 'sum' end, metric
      ) into result using p_start, p_end, p_brand_id;
    end if;
  end if;

  return coalesce(result, 0);
end; $function$;

CREATE OR REPLACE FUNCTION public.compute_productivity_score(p_user_id uuid, p_start date, p_end date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  w public.score_settings%rowtype;
  total_tasks int;
  done_tasks  int;
  ontime      int;
  tc numeric; da numeric; kpi_avg numeric;
  q numeric;  ini numeric; final numeric;
  st text;
begin
  select * into w from public.score_settings order by updated_at desc limit 1;

  select
    count(*),
    count(*) filter (where status = 'done'),
    count(*) filter (where status = 'done'
      and (deadline is null or completed_at <= deadline))
  into total_tasks, done_tasks, ontime
  from public.tasks
  where assignee_id = p_user_id
    and public.jakarta_date(created_at) between p_start and p_end;

  tc := case when total_tasks > 0
             then done_tasks::numeric / total_tasks * 100
             else 0 end;
  da := case when done_tasks > 0
             then ontime::numeric / done_tasks * 100
             else 0 end;

  select coalesce(avg(
    least(
      case when k.target_value > 0
        then public.compute_kpi_actual(k.id, p_user_id, p_start, p_end)
             / k.target_value * 100
        else 0 end,
      coalesce(k.max_score_cap, 100)
    )
  ), 0)
  into kpi_avg
  from public.kpis k
  where k.is_active
    and (k.user_id = p_user_id
         or k.role_id = (select role_id from public.users where id = p_user_id));

  select quality_score, initiative_score
  into q, ini
  from public.productivity_scores
  where user_id = p_user_id
    and period_start = p_start
    and period_end = p_end;

  final := tc  * w.task_weight
         + da  * w.deadline_weight
         + kpi_avg * w.kpi_weight
         + coalesce(q,   0) * w.quality_weight
         + coalesce(ini, 0) * w.initiative_weight;

  st := case
    when final >= 90 then 'excellent'
    when final >= 80 then 'good'
    when final >= 70 then 'need_improvement'
    when final >= 60 then 'warning'
    else 'critical'
  end;

  insert into public.productivity_scores
    (user_id, period_start, period_end,
     task_completion_score, deadline_accuracy_score, kpi_score,
     quality_score, initiative_score, final_score, status)
  values
    (p_user_id, p_start, p_end,
     round(tc,2), round(da,2), round(kpi_avg,2),
     q, ini, round(final,2), st)
  on conflict (user_id, period_start, period_end) do update
    set task_completion_score  = excluded.task_completion_score,
        deadline_accuracy_score= excluded.deadline_accuracy_score,
        kpi_score              = excluded.kpi_score,
        final_score            = excluded.final_score,
        status                 = excluded.status,
        updated_at             = now();
end; $function$;

CREATE OR REPLACE FUNCTION public.compute_productivity_score(p_user_id uuid, p_start date, p_end date, p_brand_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  w public.score_settings%rowtype;
  total_tasks int;
  done_tasks  int;
  ontime      int;
  tc numeric; da numeric; kpi_avg numeric;
  q numeric;  ini numeric; final numeric;
  st text;
begin
  select * into w from public.score_settings order by updated_at desc limit 1;

  select
    count(*),
    count(*) filter (where status = 'done'),
    count(*) filter (where status = 'done'
      and (deadline is null or completed_at <= deadline))
  into total_tasks, done_tasks, ontime
  from public.tasks
  where assignee_id = p_user_id
    and brand_id = p_brand_id
    and public.jakarta_date(created_at) between p_start and p_end;

  tc := case when total_tasks > 0
             then done_tasks::numeric / total_tasks * 100
             else 0 end;
  da := case when done_tasks > 0
             then ontime::numeric / done_tasks * 100
             else 0 end;

  select coalesce(avg(
    least(
      case when k.target_value > 0
        then public.compute_kpi_actual(k.id, p_user_id, p_start, p_end, p_brand_id)
             / k.target_value * 100
        else 0 end,
      coalesce(k.max_score_cap, 100)
    )
  ), 0)
  into kpi_avg
  from public.kpis k
  where k.is_active
    and k.brand_id = p_brand_id
    and (k.user_id = p_user_id
         or k.role_id = (select role_id from public.users where id = p_user_id));

  select quality_score, initiative_score
  into q, ini
  from public.productivity_scores
  where user_id = p_user_id
    and brand_id = p_brand_id
    and period_start = p_start
    and period_end = p_end;

  final := tc  * w.task_weight
         + da  * w.deadline_weight
         + kpi_avg * w.kpi_weight
         + coalesce(q,   0) * w.quality_weight
         + coalesce(ini, 0) * w.initiative_weight;

  st := case
    when final >= 90 then 'excellent'
    when final >= 80 then 'good'
    when final >= 70 then 'need_improvement'
    when final >= 60 then 'warning'
    else 'critical'
  end;

  insert into public.productivity_scores
    (user_id, brand_id, period_start, period_end,
     task_completion_score, deadline_accuracy_score, kpi_score,
     quality_score, initiative_score, final_score, status)
  values
    (p_user_id, p_brand_id, p_start, p_end,
     round(tc,2), round(da,2), round(kpi_avg,2),
     q, ini, round(final,2), st)
  on conflict (user_id, brand_id, period_start, period_end) do update
    set task_completion_score  = excluded.task_completion_score,
        deadline_accuracy_score= excluded.deadline_accuracy_score,
        kpi_score              = excluded.kpi_score,
        final_score            = excluded.final_score,
        status                 = excluded.status,
        updated_at             = now();
end; $function$;

CREATE OR REPLACE FUNCTION public.close_weekly_review(p_review_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.weekly_reviews%rowtype;
  u record;
  b record;
begin
  select * into r from public.weekly_reviews where id = p_review_id;
  if not found then
    raise exception 'Weekly review tidak ditemukan: %', p_review_id;
  end if;

  for u in
    select id, role_id from public.users where status = 'active'
  loop
    insert into public.kpi_results
      (kpi_id, user_id, brand_id, period_start, period_end,
       target_value, actual_value, achievement_percentage, weighted_score, input_type)
    select
      k.id,
      u.id,
      k.brand_id,
      r.period_start,
      r.period_end,
      k.target_value,
      ca.actual,
      round(calc.achievement, 2),
      round(least(calc.achievement, coalesce(k.max_score_cap,100)) * k.weight / 100, 2),
      case when k.calculation_method = 'manual' then 'manual' else 'automatic' end
    from public.kpis k
    cross join lateral (
      select public.compute_kpi_actual(k.id, u.id, r.period_start, r.period_end, k.brand_id) as actual
    ) ca
    cross join lateral (
      select case when k.target_value > 0
               then ca.actual / k.target_value * 100
               else 0 end as achievement
    ) calc
    where k.is_active
      and (k.user_id = u.id or k.role_id = u.role_id)
    on conflict (kpi_id, user_id, period_start, period_end) do update
      set actual_value         = excluded.actual_value,
          achievement_percentage = excluded.achievement_percentage,
          weighted_score       = excluded.weighted_score,
          updated_at           = now();

    for b in
      select distinct k.brand_id
      from public.kpis k
      where k.is_active
        and (k.user_id = u.id or k.role_id = u.role_id)
    loop
      perform public.compute_productivity_score(u.id, r.period_start, r.period_end, b.brand_id);
    end loop;
  end loop;

  update public.weekly_reviews
  set updated_at = now()
  where id = p_review_id;
end; $function$;

-- ══════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════════════

CREATE TRIGGER trg_action_plans_updated_at BEFORE UPDATE ON public.action_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contents_updated_at BEFORE UPDATE ON public.contents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_guard_validation BEFORE UPDATE ON public.contents FOR EACH ROW EXECUTE FUNCTION guard_content_validation();
CREATE TRIGGER trg_daily_reports_updated_at BEFORE UPDATE ON public.daily_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_acc_insight_updated_at BEFORE UPDATE ON public.instagram_account_insights FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_content_insight_updated_at BEFORE UPDATE ON public.instagram_content_insights FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_kpi_results_updated_at BEFORE UPDATE ON public.kpi_results FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_kpi_results_updated_by BEFORE UPDATE ON public.kpi_results FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER trg_kpis_updated_at BEFORE UPDATE ON public.kpis FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_prod_scores_updated_at BEFORE UPDATE ON public.productivity_scores FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_prod_scores_updated_by BEFORE UPDATE ON public.productivity_scores FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON public.sales_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_score_settings_updated_at BEFORE UPDATE ON public.score_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated_by BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_weekly_review_updated_at BEFORE UPDATE ON public.weekly_reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ══════════════════════════════════════════════════════════════════════
-- VIEWS
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.account_insight_view WITH (security_invoker = true) AS
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
    followers - lag(followers) OVER (PARTITION BY brand_id ORDER BY insight_date) AS follower_growth,
        CASE
            WHEN COALESCE(reach, 0) > 0 THEN (COALESCE(total_likes, 0) + COALESCE(total_comments, 0) + COALESCE(total_saves, 0) + COALESCE(total_shares, 0))::numeric / reach::numeric * 100::numeric
            WHEN COALESCE(impressions, 0) > 0 THEN (COALESCE(total_likes, 0) + COALESCE(total_comments, 0) + COALESCE(total_saves, 0) + COALESCE(total_shares, 0))::numeric / impressions::numeric * 100::numeric
            ELSE 0::numeric
        END AS engagement_rate,
    follows_count,
    unfollows_count
   FROM instagram_account_insights i;

CREATE OR REPLACE VIEW public.content_insight_view WITH (security_invoker = true) AS
 SELECT id,
    content_id,
    insight_date,
    reach,
    impressions,
    likes,
    comments,
    saves,
    shares,
    profile_visits,
    link_clicks,
    dm_generated,
    performance_status,
    evaluation_notes,
    brand_id,
    created_at,
    updated_at,
        CASE
            WHEN COALESCE(reach, 0) > 0 THEN (COALESCE(likes, 0) + COALESCE(comments, 0) + COALESCE(saves, 0) + COALESCE(shares, 0))::numeric / reach::numeric * 100::numeric
            WHEN COALESCE(impressions, 0) > 0 THEN (COALESCE(likes, 0) + COALESCE(comments, 0) + COALESCE(saves, 0) + COALESCE(shares, 0))::numeric / impressions::numeric * 100::numeric
            ELSE 0::numeric
        END AS engagement_rate
   FROM instagram_content_insights c;

CREATE OR REPLACE VIEW public.extra_tasks_view WITH (security_invoker = true) AS
 SELECT et.id,
    et.title,
    et.note,
    et.description,
    et.leader_url,
    et.reply,
    et.reply_url,
    et.assignee_id,
    et.created_by,
    et.status,
    et.brand_id,
    et.created_at,
    et.updated_at,
    a.name AS assignee_name,
    c.name AS created_by_name
   FROM extra_tasks et
     JOIN users a ON a.id = et.assignee_id
     JOIN users c ON c.id = et.created_by;

CREATE OR REPLACE VIEW public.scalev_orders_safe WITH (security_invoker = true) AS
 SELECT id,
    order_id,
    scalev_id,
    status,
    gross_revenue,
    net_payment_revenue,
    payment_fee,
    scalev_fee,
    service_fee,
    payment_method,
    order_date,
    is_spam,
    brand_id,
    synced_at,
    created_at
   FROM scalev_orders;
   -- sengaja tanpa customer_name / customer_phone / customer_email (audit K-4)

CREATE OR REPLACE VIEW public.tasks_view WITH (security_invoker = true) AS
 SELECT id,
    title,
    description,
    category,
    assignee_id,
    created_by,
    status,
    priority,
    deadline,
    completed_at,
    result_link,
    attachment_url,
    revision_notes,
    estimated_hours,
    actual_hours,
    updated_by,
    brand_id,
    created_at,
    updated_at,
    deadline < now() AND (status <> ALL (ARRAY['done'::text, 'cancelled'::text])) AS is_overdue
   FROM tasks t;

-- ══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — enable
-- ══════════════════════════════════════════════════════════════════════

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fetch_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_account_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_content_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads_daily_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_manual_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repliz_chat_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repliz_comment_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scalev_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scalev_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scalev_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — policies
-- ══════════════════════════════════════════════════════════════════════
-- Catatan: ads_detail dan campaign_kpi_targets MASIH punya policy anon_insert_*/
-- anon_update_* di bawah — itu bagian M1 TULIS yang sengaja BELUM dicabut
-- (lihat 20260815_fix_anon_write.sql, ditahan sampai dikonfirmasi proses
-- penulisnya pakai anon key atau service role key).

CREATE POLICY action_plans_leader_all ON public.action_plans FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY action_plans_own_select ON public.action_plans FOR SELECT TO public USING ((pic_id = auth.uid()));
CREATE POLICY ads_detail_select_auth ON public.ads_detail FOR SELECT TO authenticated USING (true);
CREATE POLICY anon_insert_ads_detail ON public.ads_detail FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_ads_detail ON public.ads_detail FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY alert_log_select_auth ON public.alert_log FOR SELECT TO authenticated USING (true);
CREATE POLICY brands_delete_leader ON public.brands FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (users u
     JOIN roles r ON ((r.id = u.role_id)))
  WHERE ((u.id = auth.uid()) AND (r.name = 'leader'::text)))));
CREATE POLICY brands_insert_leader ON public.brands FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM (users u
     JOIN roles r ON ((r.id = u.role_id)))
  WHERE ((u.id = auth.uid()) AND (r.name = 'leader'::text)))));
CREATE POLICY brands_leader_write ON public.brands FOR ALL TO authenticated USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY brands_select_all ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY brands_select_authenticated ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY brands_update_leader ON public.brands FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (users u
     JOIN roles r ON ((r.id = u.role_id)))
  WHERE ((u.id = auth.uid()) AND (r.name = 'leader'::text)))));
CREATE POLICY anon_insert_kpi_targets ON public.campaign_kpi_targets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kpi_targets ON public.campaign_kpi_targets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY kpi_targets_select_auth ON public.campaign_kpi_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY campaign_snapshots_select_auth ON public.campaign_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY contents_leader_all ON public.contents FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY contents_team_insert ON public.contents FOR INSERT TO authenticated WITH CHECK ((current_user_role() = ANY (ARRAY['feed_socmed'::text, 'reels_ads'::text, 'curator'::text])));
CREATE POLICY contents_team_select ON public.contents FOR SELECT TO public USING ((current_user_role() = ANY (ARRAY['feed_socmed'::text, 'reels_ads'::text, 'curator'::text])));
CREATE POLICY contents_team_update ON public.contents FOR UPDATE TO public USING ((current_user_role() = ANY (ARRAY['feed_socmed'::text, 'reels_ads'::text, 'curator'::text]))) WITH CHECK ((current_user_role() = ANY (ARRAY['feed_socmed'::text, 'reels_ads'::text, 'curator'::text])));
CREATE POLICY daily_reports_leader_select ON public.daily_reports FOR SELECT TO public USING ((current_user_role() = 'leader'::text));
CREATE POLICY daily_reports_own_delete ON public.daily_reports FOR DELETE TO public USING ((user_id = auth.uid()));
CREATE POLICY daily_reports_own_insert ON public.daily_reports FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY daily_reports_own_select ON public.daily_reports FOR SELECT TO public USING ((user_id = auth.uid()));
CREATE POLICY daily_reports_own_update ON public.daily_reports FOR UPDATE TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY extra_tasks_leader_all ON public.extra_tasks FOR ALL TO public USING ((current_user_role() = 'leader'::text));
CREATE POLICY extra_tasks_own_select ON public.extra_tasks FOR SELECT TO public USING ((assignee_id = auth.uid()));
CREATE POLICY extra_tasks_own_update ON public.extra_tasks FOR UPDATE TO public USING ((assignee_id = auth.uid()));
CREATE POLICY fetch_status_select_auth ON public.fetch_status FOR SELECT TO authenticated USING (true);
CREATE POLICY acc_insight_leader_all ON public.instagram_account_insights FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY acc_insight_team_insert ON public.instagram_account_insights FOR INSERT TO public WITH CHECK ((current_user_role() = ANY (ARRAY['leader'::text, 'feed_socmed'::text])));
CREATE POLICY acc_insight_team_select ON public.instagram_account_insights FOR SELECT TO public USING (true);
CREATE POLICY content_insight_leader_all ON public.instagram_content_insights FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY content_insight_team_select ON public.instagram_content_insights FOR SELECT TO public USING (true);
CREATE POLICY kpi_results_leader_all ON public.kpi_results FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY kpi_results_own_select ON public.kpi_results FOR SELECT TO public USING ((user_id = auth.uid()));
CREATE POLICY kpis_leader_all ON public.kpis FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY kpis_team_select ON public.kpis FOR SELECT TO public USING (((user_id = auth.uid()) OR (role_id = ( SELECT users.role_id
   FROM users
  WHERE (users.id = auth.uid())))));
CREATE POLICY meta_spend_select_auth ON public.meta_ads_daily_spend FOR SELECT TO authenticated USING (true);
CREATE POLICY performance_manual_sales_insert ON public.performance_manual_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY performance_manual_sales_select ON public.performance_manual_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY prod_scores_leader_all ON public.productivity_scores FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY prod_scores_own_select ON public.productivity_scores FOR SELECT TO public USING ((user_id = auth.uid()));
CREATE POLICY products_leader_all ON public.products FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY products_team_select ON public.products FOR SELECT TO public USING (true);
CREATE POLICY push_sub_leader_select ON public.push_subscriptions FOR SELECT TO authenticated USING ((current_user_role() = 'leader'::text));
CREATE POLICY push_sub_own ON public.push_subscriptions FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY repliz_chat_meta_insert ON public.repliz_chat_meta FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY repliz_chat_meta_select ON public.repliz_chat_meta FOR SELECT TO authenticated USING (true);
CREATE POLICY repliz_chat_meta_update ON public.repliz_chat_meta FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY repliz_comment_meta_insert ON public.repliz_comment_meta FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY repliz_comment_meta_select ON public.repliz_comment_meta FOR SELECT TO authenticated USING (true);
CREATE POLICY repliz_comment_meta_update ON public.repliz_comment_meta FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY roles_leader_all ON public.roles FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY roles_team_select ON public.roles FOR SELECT TO public USING (true);
CREATE POLICY sales_leader_all ON public.sales_records FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY scalev_orders_select_auth ON public.scalev_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY scalev_products_select_auth ON public.scalev_products FOR SELECT TO authenticated USING (true);
CREATE POLICY scalev_wh_leader_all ON public.scalev_webhook_events FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM (users u
     JOIN roles r ON ((r.id = u.role_id)))
  WHERE ((u.id = auth.uid()) AND (r.name = 'leader'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (users u
     JOIN roles r ON ((r.id = u.role_id)))
  WHERE ((u.id = auth.uid()) AND (r.name = 'leader'::text)))));
CREATE POLICY score_settings_all_select ON public.score_settings FOR SELECT TO public USING (true);
CREATE POLICY score_settings_leader_update ON public.score_settings FOR UPDATE TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY comments_insert ON public.task_comments FOR INSERT TO public WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM tasks t
  WHERE ((t.id = task_comments.task_id) AND (t.assignee_id = auth.uid()))))));
CREATE POLICY comments_leader_all ON public.task_comments FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY comments_select ON public.task_comments FOR SELECT TO public USING (((current_user_role() = 'leader'::text) OR (EXISTS ( SELECT 1
   FROM tasks t
  WHERE ((t.id = task_comments.task_id) AND (t.assignee_id = auth.uid()))))));
CREATE POLICY tasks_leader_all ON public.tasks FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY tasks_member_insert ON public.tasks FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));
CREATE POLICY tasks_own_update ON public.tasks FOR UPDATE TO authenticated USING (((assignee_id = auth.uid()) OR (created_by = auth.uid()))) WITH CHECK (((assignee_id = auth.uid()) OR (created_by = auth.uid())));
CREATE POLICY tasks_team_select ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY users_all_select ON public.users FOR SELECT TO public USING (true);
CREATE POLICY users_leader_all ON public.users FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY users_own_select ON public.users FOR SELECT TO public USING ((id = auth.uid()));
CREATE POLICY weekly_review_leader_all ON public.weekly_reviews FOR ALL TO public USING ((current_user_role() = 'leader'::text)) WITH CHECK ((current_user_role() = 'leader'::text));
CREATE POLICY weekly_review_team_select ON public.weekly_reviews FOR SELECT TO public USING (true);

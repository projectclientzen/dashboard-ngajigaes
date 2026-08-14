-- K-1: tutup akses role anon di 5 tabel (campaign_snapshots, ads_detail,
-- campaign_kpi_targets, alert_log, fetch_status). Terverifikasi live (14 Agu 2026):
-- anon bisa SELECT 1.366 baris campaign_snapshots tanpa login; ads_detail dan
-- campaign_kpi_targets bahkan bisa di-INSERT/UPDATE anon. Anon key ada di bundle
-- browser — ini bocor aktif, bukan teori.
--
-- JANGAN APPLY sebelum dikonfirmasi: proses yang menulis ke tabel-tabel ini
-- (di luar repo — grep src/ tidak menemukan penulis) pakai anon key atau
-- service role key? Kalau anon, ganti ke service role DULU sebelum REVOKE di
-- bawah dijalankan, atau sync akan berhenti diam-diam.

DROP POLICY IF EXISTS anon_select_campaign_snapshots ON public.campaign_snapshots;
DROP POLICY IF EXISTS anon_select_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_insert_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_update_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_select_kpi_targets  ON public.campaign_kpi_targets;
DROP POLICY IF EXISTS anon_insert_kpi_targets  ON public.campaign_kpi_targets;
DROP POLICY IF EXISTS anon_update_kpi_targets  ON public.campaign_kpi_targets;
DROP POLICY IF EXISTS anon_select_alert_log    ON public.alert_log;
DROP POLICY IF EXISTS anon_select_fetch_status ON public.fetch_status;

DROP POLICY IF EXISTS campaign_snapshots_select_auth ON public.campaign_snapshots;
CREATE POLICY campaign_snapshots_select_auth ON public.campaign_snapshots
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS ads_detail_select_auth ON public.ads_detail;
CREATE POLICY ads_detail_select_auth ON public.ads_detail
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS kpi_targets_select_auth ON public.campaign_kpi_targets;
CREATE POLICY kpi_targets_select_auth ON public.campaign_kpi_targets
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS alert_log_select_auth ON public.alert_log;
CREATE POLICY alert_log_select_auth ON public.alert_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS fetch_status_select_auth ON public.fetch_status;
CREATE POLICY fetch_status_select_auth ON public.fetch_status
  FOR SELECT TO authenticated USING (true);

-- Cabut hak tulis anon di SELURUH schema — tulis cuma boleh service role.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;

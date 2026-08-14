-- K-1 (bagian TULIS) — APPLIED. Dikonfirmasi Maszen: proses penulis
-- campaign_snapshots/ads_detail/dll pakai service role key, bukan anon.
-- Diterapkan + diverifikasi live: 0 grant tulis anon di seluruh schema public.

DROP POLICY IF EXISTS anon_insert_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_update_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_insert_kpi_targets  ON public.campaign_kpi_targets;
DROP POLICY IF EXISTS anon_update_kpi_targets  ON public.campaign_kpi_targets;

-- Cabut hak tulis anon di SELURUH schema — tulis cuma boleh service role.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;

-- K-4: PII pelanggan (nama/telepon/email) di scalev_orders terbaca semua user
-- login, termasuk role curator yang tugasnya cuma validasi konten. Terverifikasi
-- live: 507 order, 505 punya customer_phone. scalev_orders_select_auth
-- (20260814_scalev_sync.sql) = USING (true) untuk authenticated.
--
-- Fix: cabut SELECT langsung ke tabel dari authenticated, arahkan lewat view
-- tanpa kolom PII. security_invoker=true WAJIB — tanpa itu view jalan dengan
-- privilege pembuat view (bypass RLS pemanggil), persis masalah M6/P-6.

REVOKE SELECT ON public.scalev_orders FROM authenticated;

CREATE OR REPLACE VIEW public.scalev_orders_safe
WITH (security_invoker = true) AS
  SELECT id, order_id, scalev_id, status, gross_revenue, net_payment_revenue,
         payment_fee, scalev_fee, service_fee, payment_method,
         order_date, is_spam, brand_id, synced_at, created_at
  FROM public.scalev_orders;
  -- sengaja tanpa customer_name / customer_phone / customer_email

GRANT SELECT ON public.scalev_orders_safe TO authenticated;

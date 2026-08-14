-- P-2: mapping brand_id dari webhook Scalev.
-- Field terverifikasi dari scalev_webhook_events.raw_payload live (bukan tebakan):
-- payload.data.business.unique_id = 'DJTVRKDXCA8AX1MT' untuk brand ngajigaes
-- (business.username = 'ngajigaes' juga cocok slug kita, tapi unique_id
-- dipilih karena itu ID stabil Scalev, tidak berubah kalau username toko diganti).

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS scalev_store_id text;

CREATE UNIQUE INDEX IF NOT EXISTS brands_scalev_store_id_idx
  ON public.brands (scalev_store_id) WHERE scalev_store_id IS NOT NULL;

UPDATE public.brands SET scalev_store_id = 'DJTVRKDXCA8AX1MT'
WHERE slug = 'ngajigaes' AND scalev_store_id IS NULL;

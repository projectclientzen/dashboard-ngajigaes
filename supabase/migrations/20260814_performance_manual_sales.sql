-- Manual sales entry untuk halaman Performance ("+ Tambah Penjualan") —
-- terpisah dari sales_records/products (dipakai /sales) supaya tidak
-- menyentuh alur existing. Form di Performance cuma nama produk bebas teks,
-- tanpa product_id terstruktur.
CREATE TABLE IF NOT EXISTS public.performance_manual_sales (
  id uuid primary key default gen_random_uuid(),
  sales_date date not null default ((now() at time zone 'Asia/Jakarta')::date),
  product_name text not null,
  gross_revenue numeric not null check (gross_revenue >= 0),
  qty integer not null default 1 check (qty >= 1),
  notes text,
  brand_id uuid not null references public.brands(id),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS performance_manual_sales_brand_date_idx
  ON public.performance_manual_sales (brand_id, sales_date);

ALTER TABLE public.performance_manual_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY performance_manual_sales_select ON public.performance_manual_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY performance_manual_sales_insert ON public.performance_manual_sales FOR INSERT TO authenticated WITH CHECK (true);

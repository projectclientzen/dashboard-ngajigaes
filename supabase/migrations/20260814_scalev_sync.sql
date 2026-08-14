-- Scalev sync tables — jalankan di Supabase SQL Editor
-- Tabel order & produk dari Scalev untuk dashboard omzet

CREATE TABLE IF NOT EXISTS public.scalev_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique,
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
  is_spam boolean default false,
  brand_id uuid references public.brands(id),
  synced_at timestamptz,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.scalev_products (
  id uuid primary key default gen_random_uuid(),
  scalev_id text unique,
  name text,
  slug text,
  price numeric,
  stock integer,
  status text,
  brand_id uuid references public.brands(id),
  synced_at timestamptz,
  created_at timestamptz default now()
);

-- Index buat query omzet per brand & tanggal
CREATE INDEX IF NOT EXISTS scalev_orders_brand_date_idx ON public.scalev_orders(brand_id, order_date);
CREATE INDEX IF NOT EXISTS scalev_products_brand_idx ON public.scalev_products(brand_id);

-- RLS: semua authenticated bisa baca (dashboard), tulis hanya service role
ALTER TABLE public.scalev_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scalev_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scalev_orders_select_auth" ON public.scalev_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "scalev_products_select_auth" ON public.scalev_products FOR SELECT TO authenticated USING (true);

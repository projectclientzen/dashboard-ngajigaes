# Audit Dashboard-NgajiGaes — 14 Agustus 2026

**Scope:** repo lokal `/Volumes/Daily Project/Dashbord Report/dashboard-ngajigaes` (branch `main`, HEAD `4ee5771`) + verifikasi langsung ke database Supabase produksi `adslab-ngajigaes` (`xnfnbfqtskgiutvhhjjo`, ap-northeast-1).

> Catatan scope: HEAD lokal `4ee5771`, bukan `88e9cb6` seperti di brief — repo GitHub `projectclientzen/dashboard-ngajigaes` tidak bisa diakses dari sesi ini dan VPS `/opt/dashboard-ngajigaes` tidak ter-mount. Semua temuan di bawah diverifikasi dari kode lokal + state DB produksi yang live. Working tree punya 6 file modified + 3 untracked yang belum di-commit (termasuk 2 migration Scalev/Meta Ads) — jadi kode di VPS bisa berbeda sedikit.

---

## Ringkasan

1. **🔴 Data Meta Ads bocor ke publik tanpa login.** Tabel `campaign_snapshots` punya RLS policy untuk role `anon` dengan `USING (true)`. Terverifikasi live: **1.366 baris** spend/ROAS/nama campaign bisa dibaca siapa saja yang punya anon key — dan anon key itu memang publik, ter-bundle di JS browser. Ini bukan teori, sudah saya jalankan sebagai role `anon`.
2. **🔴 Empat API route fail-open.** Pola `if (secret && auth !== ...)` berarti kalau env var tidak di-set, guard-nya **dilewati total** dan endpoint jadi publik. `CRON_SECRET` sendiri tidak ada di `.env.local`.
3. **🔴 Isolasi multi-brand tidak ada di layer database.** Dari 73 RLS policy di 31 tabel, **nol** yang menyebut `brand_id`. Pemisahan brand murni kosmetik di client (`.eq('brand_id', …)`) — user mana pun bisa query lintas brand langsung ke PostgREST.
4. **🟠 Angka P&L salah.** "Net Profit" = revenue − ads spend saja. Fee Scalev/payment yang **sudah ada datanya di 505 dari 507 baris** tidak pernah dikurangi. Profit dan margin overstated.
5. **🟠 Order dari webhook tidak pernah muncul di dashboard.** Webhook tidak pernah mengisi `brand_id` maupun `order_date` secara andal — terverifikasi ada 1 baris dengan keduanya NULL, dan baris seperti itu otomatis tersaring keluar oleh filter rentang tanggal.

Ringkas: arsitektur auth halaman (middleware + Supabase session) sudah benar, verifikasi HMAC webhook Scalev **implementasinya bagus** (timing-safe, Base64, raw body sebelum parse). Yang bermasalah adalah **lapisan otorisasi data** — RLS terlalu permisif, dan beberapa guard API yang gagal ke arah terbuka.

---

## Temuan KRITIS 🔴

### K-1. `campaign_snapshots` (+4 tabel lain) terbuka untuk role `anon`

**Lokasi:** database produksi, policy dibuat di luar repo (tidak ada di `supabase/migrations/`)

Policy live yang terverifikasi:

| Tabel | Policy anon | Efek |
|---|---|---|
| `campaign_snapshots` | SELECT `true` | **1.366 baris** ads data terbaca publik |
| `ads_detail` | SELECT + INSERT + UPDATE `true` | baca **dan tulis** tanpa login |
| `campaign_kpi_targets` | SELECT + INSERT + UPDATE `true` | baca **dan tulis** tanpa login |
| `alert_log` | SELECT `true` | terbaca publik |
| `fetch_status` | SELECT `true` | terbaca publik |

Bukti (dijalankan sebagai `set local role anon`):

```
campaign_snapshots   1366
ads_detail              0   (kosong, tapi policy INSERT/UPDATE aktif)
campaign_kpi_targets    0   (kosong, tapi policy INSERT/UPDATE aktif)
alert_log               0
fetch_status            1
scalev_orders           0   ✅ tertutup
contents                0   ✅ tertutup
```

Grant tabel juga longgar — `anon` punya `SELECT,INSERT,UPDATE,DELETE,TRUNCATE` di semua tabel itu, jadi **RLS adalah satu-satunya yang menahan**. Begitu policy-nya `true`, tidak ada lapisan kedua.

**Risiko:** anon key ada di bundle client (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) — siapa pun yang buka DevTools dapat key-nya, lalu `curl` REST endpoint langsung. Spend iklan, ROAS, nama campaign, dan struktur target KPI bocor ke kompetitor. Untuk `ads_detail` dan `campaign_kpi_targets`, penyerang bisa **menyisipkan atau mengubah baris** — meracuni data dashboard.

**Fix:**
```sql
DROP POLICY IF EXISTS anon_select_campaign_snapshots ON public.campaign_snapshots;
DROP POLICY IF EXISTS anon_select_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_insert_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_update_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_select_kpi_targets  ON public.campaign_kpi_targets;
DROP POLICY IF EXISTS anon_insert_kpi_targets  ON public.campaign_kpi_targets;
DROP POLICY IF EXISTS anon_update_kpi_targets  ON public.campaign_kpi_targets;
DROP POLICY IF EXISTS anon_select_alert_log    ON public.alert_log;
DROP POLICY IF EXISTS anon_select_fetch_status ON public.fetch_status;

-- ganti dengan read-only untuk authenticated
CREATE POLICY campaign_snapshots_select_auth ON public.campaign_snapshots
  FOR SELECT TO authenticated USING (true);
CREATE POLICY ads_detail_select_auth ON public.ads_detail
  FOR SELECT TO authenticated USING (true);
CREATE POLICY kpi_targets_select_auth ON public.campaign_kpi_targets
  FOR SELECT TO authenticated USING (true);

-- cabut hak tulis dari anon di seluruh schema (tulis = service role saja)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
```
Setelah itu pastikan proses sync ads yang menulis ke tabel-tabel ini pakai **service role key**, bukan anon key — kalau sekarang pakai anon, sync akan berhenti dan harus diperbaiki bersamaan.

---

### K-2. Empat API route fail-open kalau env var kosong

**Lokasi:**
- `src/app/api/cron/daily-reminder/route.ts:10`
- `src/app/api/cron/repliz-sync/route.ts:13`
- `src/app/api/push/send/route.ts:8`
- `src/app/api/repliz/sync/route.ts:10`

Semuanya pakai pola yang sama:

```ts
const secret = process.env.PUSH_SEND_SECRET
if (secret && auth !== `Bearer ${secret}`) {      // ⚠️ `secret &&`
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

Kalau `secret` undefined/kosong, kondisi jadi false → **request lolos tanpa auth apa pun**.

Diperparah: `src/middleware.ts:47` sengaja meng-exclude `api/` dari matcher, jadi tidak ada jaring pengaman di lapisan atas. Dan `CRON_SECRET` **tidak ada** di `.env.local` — artinya di environment mana pun yang tidak men-set-nya, `/api/cron/daily-reminder` sepenuhnya publik.

**Risiko:** siapa pun bisa memicu blast push notification ke seluruh tim berulang kali (spam + kuota VAPID habis), dan memicu sync Repliz/IG berulang sampai rate limit API pihak ketiga jebol.

**Fix** — fail *closed*, di keempat file:
```ts
const secret = process.env.PUSH_SEND_SECRET
if (!secret) {
  console.error('[route] secret tidak di-set')
  return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
}
if (auth !== `Bearer ${secret}`) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```
Bandingkan dengan webhook Scalev di `src/app/api/webhooks/scalev/route.ts:82-85` yang **sudah benar** — di sana secret kosong → 500, bukan lolos. Samakan polanya.

---

### K-3. Isolasi multi-brand tidak ada di database

**Lokasi:** seluruh RLS policy; contoh client `src/lib/queries/performance.ts:42,58,90,141,219`

Dari 73 policy di 31 tabel, **tidak satu pun menyebut `brand_id`**. Filter brand hanya ada di client:

```ts
if (brandId && brandId !== 'all') q = q.eq('brand_id', brandId)   // performance.ts:42
```

`BrandSwitcher.tsx` juga tidak punya role gating — semua brand dari `useBrands()` dirender untuk semua user, dan `brands_select_all` memang `USING (true)`.

**Risiko:** filter client-side bukan kontrol keamanan. User role `feed_socmed` yang cuma boleh pegang satu brand bisa (a) pilih "Semua Brand" di UI, atau (b) query PostgREST langsung dengan anon key + session token-nya dan menghilangkan filter brand. Semua data brand lain terbuka.

**Fix:** kalau memang butuh isolasi per-brand, ini perlu tabel keanggotaan + policy yang menegakkannya:
```sql
CREATE TABLE public.brand_members (
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES public.users(id)  ON DELETE CASCADE,
  PRIMARY KEY (brand_id, user_id)
);
ALTER TABLE public.brand_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_brand(b uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT public.current_user_role() = 'leader'
      OR EXISTS (SELECT 1 FROM brand_members m
                 WHERE m.brand_id = b AND m.user_id = auth.uid());
$$;

-- lalu di tiap tabel ber-brand:
DROP POLICY scalev_orders_select_auth ON public.scalev_orders;
CREATE POLICY scalev_orders_select_brand ON public.scalev_orders
  FOR SELECT TO authenticated USING (public.can_access_brand(brand_id));
-- ulangi untuk: meta_ads_daily_spend, campaign_snapshots, contents,
-- instagram_account_insights, instagram_content_insights,
-- performance_manual_sales, scalev_products
```

**Keputusan yang perlu Maszen ambil dulu:** kalau semua anggota tim internal memang boleh lihat semua brand, maka ini bukan bug — turunkan ke MINOR dan cukup dokumentasikan "brand switcher = filter tampilan, bukan izin akses" supaya tidak ada yang salah mengira ini kontrol keamanan. Saya tandai KRITIS karena brief menyebut "member bisa akses data brand lain?" sebagai kekhawatiran nyata.

---

### K-4. PII pelanggan terbuka untuk semua user yang login

**Lokasi:** `supabase/migrations/20260814_scalev_sync.sql:46`

```sql
CREATE POLICY "scalev_orders_select_auth" ON public.scalev_orders
  FOR SELECT TO authenticated USING (true);
```

`scalev_orders` menyimpan `customer_name`, `customer_phone`, `customer_email` (baris 7–9 migration yang sama). Terverifikasi di produksi: **507 order, 505 punya nomor telepon pelanggan**.

Setiap user yang login — termasuk role `curator` yang tugasnya cuma validasi konten — bisa menarik seluruh 505 nomor HP pelanggan lewat satu request REST.

**Fix:** batasi kolom PII ke leader lewat view, dan cabut akses tabel mentah dari role non-leader:
```sql
REVOKE SELECT ON public.scalev_orders FROM authenticated;

CREATE VIEW public.scalev_orders_safe
WITH (security_invoker = true) AS
  SELECT id, order_id, status, gross_revenue, net_payment_revenue,
         payment_fee, scalev_fee, service_fee, payment_method,
         order_date, is_spam, brand_id, synced_at
  FROM public.scalev_orders;   -- tanpa customer_name/phone/email

GRANT SELECT ON public.scalev_orders_safe TO authenticated;
```
Lalu ubah `useScalevOrders` (`src/lib/queries/performance.ts:36`) agar baca dari `scalev_orders_safe`. Perhatikan `mapScalevOrder` (baris 12) mengambil `customer_name` — hapus dari tipe `ScalevOrder` kalau tidak dipakai UI.

---

## Temuan PENTING 🟠

### P-1. Perhitungan Net Profit mengabaikan fee yang datanya sudah ada

**Lokasi:** `src/app/(app)/performance/page.tsx:606-608`

```ts
const grossProfit = revenue - spend
const netProfit = grossProfit          // ⚠️ net === gross
const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0
```

`revenue` (baris 603) dijumlahkan dari `gross_revenue`. Padahal `scalev_orders` punya `payment_fee`, `scalev_fee`, `service_fee`, dan `net_payment_revenue` — dan terverifikasi **505 dari 507 baris punya `payment_fee` dan `scalev_fee` terisi**, 506 punya `net_payment_revenue`.

Jadi "Net Profit" dan "Margin" di halaman P&L **overstated** sebesar total fee, dan label "Net" menyesatkan karena identik dengan Gross.

Menarik: komponen Omzet di halaman yang sama (baris 156) **sudah benar** — punya toggle net/gross yang memakai `net_payment_revenue`. Bagian P&L-nya saja yang belum ikut.

**Fix:**
```ts
const revenueGross = completed.reduce((a, o) => a + (o.gross_revenue ?? 0), 0)
const revenueNet   = completed.reduce((a, o) => a + (o.net_payment_revenue ?? o.gross_revenue ?? 0), 0)
const grossProfit  = revenueGross - spend
const netProfit    = revenueNet   - spend
const margin = revenueNet > 0 ? (netProfit / revenueNet) * 100 : 0
```
Kalau ada COGS/HPP produk, itu juga belum masuk sama sekali — perlu keputusan bisnis apakah P&L ini dianggap "kontribusi margin setelah ads" (dan labelnya diperjelas) atau P&L penuh.

---

### P-2. Webhook Scalev tidak pernah mengisi `brand_id` → order hilang dari dashboard

**Lokasi:** `src/app/api/webhooks/scalev/route.ts:159-168`

```ts
const row: Record<string, unknown> = {
  order_id: orderId,
  synced_at: new Date().toISOString(),
}
// ... status, gross, net, paymentMethod, orderDate, isSpam
// ⚠️ brand_id tidak pernah di-set
```

Terverifikasi di produksi: ada **1 baris dengan `brand_id` NULL dan `order_date` NULL** — konsisten dengan order hasil webhook (`orderDate` di baris 156 hanya di-set kalau `draft_time`/`created_at` ada di payload).

Akibatnya dobel:
- `order_date` NULL → tersaring keluar oleh `.gte('order_date', start).lte(...)` di `performance.ts:38-39`. Order **tidak pernah tampil**, di rentang tanggal mana pun.
- `brand_id` NULL → tidak pernah cocok dengan `.eq('brand_id', brandId)` saat brand dipilih.

Jadi jalur webhook real-time yang jadi nilai jual fitur ini **efektifnya tidak menyumbang data apa pun** ke dashboard; yang menyelamatkan hanya polling backup.

**Fix:** petakan brand dari payload sebelum upsert, dan pastikan `order_date` selalu terisi:
```ts
// brand_id: map dari identitas bisnis/store di payload
const storeId = (data.business_id ?? data.store_id) as string | undefined
if (storeId) {
  const { data: b } = await supabaseAdmin
    .from('brands').select('id').eq('scalev_store_id', storeId).maybeSingle()
  if (b) row.brand_id = b.id
}
// order_date: fallback ke tanggal WIB saat diterima (lihat juga P-3)
row.order_date = orderDate ?? jakartaDateString(new Date())
```
Perlu kolom `brands.scalev_store_id` (belum ada) + backfill. Untuk sementara, minimal set `order_date` fallback supaya order tidak hilang total, dan tambahkan alert kalau `brand_id` NULL.

---

### P-3. `draft_time.slice(0,10)` memakai tanggal UTC, dashboard memakai WIB

**Lokasi:** `src/app/api/webhooks/scalev/route.ts:156`

```ts
const orderDate = ((data.draft_time ?? data.created_at ?? '') as string).slice(0, 10)
```

Ini mengambil komponen tanggal dari string ISO **UTC**. Sementara rentang tanggal dashboard dihitung WIB — `AppContext.tsx:47` memakai `todayJakarta()`, dan `src/lib/utils.ts:30-37` benar memakai `Intl.DateTimeFormat` dengan `timeZone: 'Asia/Jakarta'`.

WIB = UTC+7, jadi order antara **00:00–07:00 WIB** akan tercatat sebagai **hari sebelumnya**. Omzet harian bergeser, dan order paling pagi bocor ke bucket tanggal kemarin.

**Fix:**
```ts
function jakartaDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso))
}
const raw = (data.draft_time ?? data.created_at) as string | undefined
const orderDate = raw ? jakartaDate(raw) : undefined
```
DB sudah punya helper `public.jakarta_date(timestamptz)` (`20260626_ngajigaes_full_schema.sql:66`) — pakai konvensi yang sama di sisi aplikasi.

---

### P-4. Inbox Repliz tidak punya scoping brand sama sekali

**Lokasi:** `src/lib/server/repliz.ts:136,159`; routes `src/app/api/repliz/comments/route.ts:28`, `chats/route.ts:28`

```ts
export async function getComments(page = 1, status?: CommentStatus, limit = 20)
export async function getChats(page = 1, status?: ChatStatus, limit = 20)
```

Tidak ada parameter `accountId`/brand. Route-nya hanya cek "user login atau tidak" (`requireUser()`), lalu meneruskan seluruh komentar/DM dari **semua akun sosmed yang tersambung di Repliz**.

Padahal `repliz.ts:99,110` menunjukkan API Repliz **mendukung** scoping per akun (`getContentStatistic(contentId, accountId)`, `getAccountStatistic(accountId)`), dan `brands.repliz_ig_account_id` sudah ada (`20260813_brands_repliz_account.sql:5`).

**Risiko:** anggota tim brand A membaca DM pelanggan brand B, dan bisa **membalas atas nama brand B** lewat `POST /api/repliz/comments` — aksi keluar ke publik, di akun yang bukan tanggung jawabnya.

**Fix:** teruskan `accountId` dari brand aktif, dan validasi server-side bahwa akun itu memang milik brand yang boleh diakses user — jangan percaya `accountId` mentah dari client.

---

### P-5. `performance_manual_sales`: siapa pun bisa menyuntik omzet, dan tidak bisa dihapus

**Lokasi:** `supabase/migrations/20260814_performance_manual_sales.sql:21-22`

```sql
CREATE POLICY performance_manual_sales_select ON ... FOR SELECT TO authenticated USING (true);
CREATE POLICY performance_manual_sales_insert ON ... FOR INSERT TO authenticated WITH CHECK (true);
```

`WITH CHECK (true)` artinya user mana pun bisa insert baris omzet dengan `brand_id` apa pun dan `gross_revenue` berapa pun — termasuk memalsukan `created_by` (client mengisinya sendiri di `performance.ts:118`, tidak ada default DB atau trigger yang menegakkan).

Dan karena **tidak ada policy UPDATE/DELETE sama sekali**, baris yang salah/palsu **tidak bisa dikoreksi atau dihapus lewat aplikasi** — bahkan oleh leader. Harus lewat SQL editor.

**Fix:**
```sql
ALTER TABLE public.performance_manual_sales
  ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY performance_manual_sales_insert ON public.performance_manual_sales;
CREATE POLICY pms_insert ON public.performance_manual_sales
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY pms_update_own_or_leader ON public.performance_manual_sales
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.current_user_role() = 'leader');
CREATE POLICY pms_delete_own_or_leader ON public.performance_manual_sales
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.current_user_role() = 'leader');
```

---

### P-6. Empat view `SECURITY DEFINER` mem-bypass RLS pemanggil

**Lokasi:** advisor Supabase (level ERROR) — `content_insight_view`, `extra_tasks_view`, `tasks_view`, `account_insight_view`

View dengan `SECURITY DEFINER` menjalankan RLS **pembuat view**, bukan pemanggil. Ini melubangi policy per-user yang sudah dipasang rapi di tabel dasarnya — misalnya `tasks_own_select` (`assignee_id = auth.uid()`) tidak berlaku lagi kalau user query lewat `tasks_view`.

`extra_tasks` dan `tasks` punya policy per-user yang ketat; view-nya membatalkan itu.

**Fix:**
```sql
ALTER VIEW public.tasks_view            SET (security_invoker = true);
ALTER VIEW public.extra_tasks_view      SET (security_invoker = true);
ALTER VIEW public.content_insight_view  SET (security_invoker = true);
ALTER VIEW public.account_insight_view  SET (security_invoker = true);
```
Tes dulu di staging — beberapa query mungkin memang mengandalkan bypass ini dan akan mulai mengembalikan baris kosong. Itu justru sinyal bahwa kebocorannya nyata.

---

### P-7. Migration repo tidak lengkap — bukan source of truth

**Lokasi:** `supabase/migrations/20260626_ngajigaes_full_schema.sql:90-93`

```sql
-- 008–019: tasks, comments, daily_reports, kpis, kpi_results, productivity_scores,
--          contents, instagram insights + views, products, sales, weekly_reviews,
--          action_plans, compute_kpi_actual, compute_productivity_score, close_weekly_review
-- (lihat MCP migration history di Supabase dashboard)
```

Definisi 12+ tabel inti (termasuk `tasks`, `contents`, `brands`, `instagram_*`) dan **semua policy anon di K-1** hanya berupa komentar. `scalev_webhook_events` bahkan tidak disebut sama sekali padahal dipakai webhook (`route.ts:97`) dan ada di produksi.

**Risiko:** tidak ada yang bisa me-review perubahan keamanan lewat PR, karena policy paling berbahaya di sistem ini tidak pernah masuk repo. Disaster recovery juga tidak mungkin dari repo saja.

**Fix:** dump schema produksi ke migration baseline dan commit:
```bash
supabase db dump --db-url "$DATABASE_URL" -f supabase/migrations/20260814_baseline.sql
```
Setelah itu tegakkan aturan: perubahan RLS **hanya** lewat file migration, tidak lagi lewat SQL Editor.

---

### P-8. Migration tidak idempotent — gagal kalau dijalankan ulang

**Lokasi:** `supabase/migrations/20260813_ig_graph_and_inbox_collab.sql:12-13`

```sql
ALTER TABLE public.instagram_content_insights
  ADD CONSTRAINT instagram_content_insights_content_date_unique UNIQUE (content_id, insight_date);
```

Postgres tidak mendukung `IF NOT EXISTS` untuk `ADD CONSTRAINT`. Jalankan dua kali → error, dan seluruh migration setelahnya batal. Hal yang sama berlaku untuk `CREATE POLICY` di semua file migration (tidak ada `DROP POLICY IF EXISTS` di depannya) dan `CREATE TRIGGER` di `20260626_ngajigaes_full_schema.sql:56-58`.

Constraint ini penting: `igGraphSync.ts:113` memakai `onConflict: 'content_id,insight_date'` yang bergantung padanya.

**Fix:**
```sql
DO $$ BEGIN
  ALTER TABLE public.instagram_content_insights
    ADD CONSTRAINT instagram_content_insights_content_date_unique UNIQUE (content_id, insight_date);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;
```
Dan awali tiap `CREATE POLICY` dengan `DROP POLICY IF EXISTS <nama> ON <tabel>;`.

---

### P-9. Tidak ada rate limiting di endpoint publik mana pun

**Lokasi:** `src/app/api/webhooks/scalev/route.ts` dan seluruh `src/app/api/`

Webhook Scalev membaca **seluruh body ke memori** lebih dulu (`route.ts:57`, `await req.text()`), baru mengecek ukuran di dalam `verifyScalevSignature` (`scalevSignature.ts:27`, batas 1 MB). Pengecekan terjadi *setelah* buffering, jadi tidak melindungi dari body raksasa.

Setiap request tanpa signature valid tetap memicu: baca body penuh → parse JSON → HMAC compute. Tidak ada throttling. Tidak ada batas ukuran di layer Next.js maupun reverse proxy (tidak ada config nginx di repo).

Perlu dicatat juga: `business.test_event` (`route.ts:71-73`) **melewati verifikasi signature sepenuhnya**. Ini sendiri tidak berbahaya — handler-nya langsung return sebelum menyentuh database — tapi artinya endpoint bisa di-probe tanpa kredensial apa pun.

**Fix:** batasi ukuran body di reverse proxy (`client_max_body_size 1m;` di nginx), tolak lebih awal berdasarkan header `Content-Length` sebelum `req.text()`, dan pasang rate limit per-IP. Kalau di VPS, `nginx limit_req_zone` paling sederhana.

---

## Temuan MINOR 🟡

### M-1. 18 kerentanan dependency (`npm audit`)

12 high, 6 moderate, 0 critical. Yang relevan untuk runtime produksi:

| Paket | Sev | Isu |
|---|---|---|
| `next` | high | DoS via Image Optimizer `remotePatterns` |
| `postcss` | high | XSS via unescaped `</style>` |
| `serialize-javascript` | high | RCE via `RegExp.flags` |
| `ip-address` | high | SSRF via oktal leading-zero |
| `nanoid` | high | loop tak terbatas pada size negatif |
| `js-yaml`, `brace-expansion`, `fast-uri`, `glob` | high | DoS/injection (mayoritas build-time) |

Sebagian besar transitif lewat `@ducanh2912/next-pwa` dan `eslint-config-next` (build-time, risiko lebih rendah). Yang paling perlu didahulukan: **`next` itu sendiri**.

```bash
npm audit fix && npm update next
```
Jalankan `npm audit` lagi setelahnya; sisanya kemungkinan butuh `npm audit fix --force` yang bisa memicu breaking change — uji di staging.

### M-2. 48 `as any` + 7 `as never` melemahkan type safety

Terkonsentrasi di jalur mutation (`src/lib/supabase/client.ts:18-23` sengaja mengembalikan client untyped) dan di webhook (`route.ts:97,105,115,172` pakai `as never`).

`as never` di argumen `.upsert()` (`route.ts:173`) sangat berisiko: **mematikan pengecekan tipe apa pun** pada shape row, jadi salah nama kolom baru ketahuan saat runtime. Ini persis kelas bug yang meloloskan P-2 (`brand_id` hilang tanpa peringatan compiler).

**Fix:** generate ulang tipe DB dan pakai client bertipe di jalur server:
```bash
npx supabase gen types typescript --project-id xnfnbfqtskgiutvhhjjo > src/types/database.types.ts
```

### M-3. `users_all_select USING (true)` — direktori user terbuka

`users` punya tiga policy SELECT, salah satunya `USING (true)`. Karena policy bersifat **permissive (OR)**, `users_own_select (id = auth.uid())` jadi tidak ada gunanya — semua user tetap bisa membaca seluruh baris termasuk email semua orang.

Untuk dashboard tim internal ini kemungkinan memang disengaja (butuh nama+avatar untuk assignee). Kalau ya, hapus saja `users_own_select` yang menyesatkan. Kalau tidak, batasi kolomnya lewat view.

### M-4. Error handler webhook mengembalikan 200 saat gagal simpan

`src/app/api/webhooks/scalev/route.ts:124-128` — insert gagal tetap membalas `200` dengan alasan "supaya Scalev tidak retry". Ini **membuang** event secara permanen: Scalev menganggap terkirim, padahal tidak tersimpan. Untuk kegagalan sementara (DB down), justru retry yang diinginkan. Balas `500` untuk error transient, `200` hanya untuk yang benar-benar tidak bisa diproses.

### M-5. `leaked password protection` nonaktif

Advisor Supabase (WARN). Aktifkan pengecekan HaveIBeenPwned di Auth settings — satu klik, dan `/api/users` (`route.ts:47`) membuat user dengan password yang ditentukan leader, jadi ini relevan.

### M-6. `search_path` mutable di dua function

`public.set_updated_at` dan `public.jakarta_date` tidak men-set `search_path`. Function lain di file yang sama sudah benar (`current_user_role` di `20260626_ngajigaes_full_schema.sql:62` pakai `SET search_path = public`). Samakan:
```sql
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.jakarta_date(timestamptz) SET search_path = public;
```

### M-7. 7 function `SECURITY DEFINER` bisa dipanggil `anon`

Termasuk `compute_kpi_actual`, `compute_productivity_score`, `get_product_sold`, `close_weekly_review`. `close_weekly_review` khususnya **mengubah state** dan bisa dipanggil tanpa login via `/rest/v1/rpc/close_weekly_review`.

```sql
REVOKE EXECUTE ON FUNCTION public.close_weekly_review(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.compute_kpi_actual(uuid,uuid,date,date,uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.compute_productivity_score(uuid,date,date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.compute_productivity_score(uuid,date,date,uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_product_sold(date,date,uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.guard_content_validation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_by() FROM anon, authenticated;
```
(`guard_content_validation` dan `set_updated_by` adalah trigger function — tidak seharusnya bisa dipanggil langsung sama sekali.)

### M-8. Fallback "stale" campaign snapshot bisa menyesatkan

`src/lib/queries/performance.ts:227-233` — kalau tidak ada data di periode terpilih, query mundur ke 300 snapshot terakhir **tanpa filter tanggal**. Flag `isStale` memang dikembalikan dan komentarnya jujur soal trade-off, tapi pastikan UI benar-benar menampilkannya secara mencolok — angka spend dari bulan lalu yang muncul di panel "bulan ini" adalah salah baca yang mahal.

### M-9. Duplikasi policy pada `brands`

`brands_select_all` dan `brands_select_authenticated` identik (`FOR SELECT TO authenticated USING (true)`), plus `brands_leader_write FOR ALL` yang tumpang tindih dengan `brands_insert/update/delete_leader`. Tidak berbahaya, tapi 6 policy untuk 1 tabel menyulitkan audit. Rapikan jadi dua: satu SELECT, satu leader-write.

---

## Checklist Security

| Item | Status | Catatan |
|---|---|---|
| Secret ter-commit di git history | ✅ Aman | `.env.example` isinya placeholder (`eyJhbGciOiJIUzI1NiI...` truncated). Tidak ada `.env.local`/`.env.production` yang pernah ter-commit |
| `.gitignore` meng-exclude env | ⚠️ Sebagian | Hanya `.env*.local`. **`.env.production` dan `.env` TIDAK ter-cover** — tambahkan `.env*` + `!.env.example` |
| RLS enabled semua tabel | ✅ Ya | 31/31 tabel, terverifikasi live |
| RLS policy benar | 🔴 Tidak | 5 tabel terbuka untuk `anon` (K-1); nol policy menyaring `brand_id` (K-3) |
| Service role key server-side saja | ✅ Ya | `supabaseAdmin.ts:8-10` punya guard `typeof window` yang benar; tidak ada prefix `NEXT_PUBLIC_` |
| API route punya auth | ⚠️ Sebagian | Route Repliz/push-subscribe/users benar; 4 route fail-open (K-2) |
| Middleware melindungi halaman | ✅ Ya | `middleware.ts:31-36` redirect ke `/login`; `api/` sengaja di-exclude (baris 47) |
| Webhook signature verify | ✅ Benar | HMAC-SHA256, raw body sebelum parse, timing-safe, cek panjang dulu (`scalevSignature.ts:68-73`) |
| Webhook dedup / idempotency | ✅ Ya | `scalev_unique_id` dicek sebelum insert (`route.ts:96-110`) |
| Webhook tidak menimpa data dengan 0/null | ✅ Ya | Setiap field dijaga `!== undefined` (`route.ts:163-168`) — penanganannya bagus |
| SQL injection | ✅ Aman | Semua lewat Supabase client (parameterized). Tidak ada raw SQL di app code |
| XSS | ✅ Aman | Nol `dangerouslySetInnerHTML`, nol `eval()` |
| CSRF | ✅ Wajar | Cookie Supabase SameSite; API pakai Bearer/session, bukan form-post |
| `PUSH_SEND_SECRET` bocor ke client | ✅ Tidak | Tanpa prefix `NEXT_PUBLIC_`, hanya dibaca di route handler |
| Rate limiting | 🔴 Tidak ada | Tidak ada di endpoint mana pun (P-9) |
| Body size limit | ⚠️ Lemah | Cek 1 MB terjadi setelah body dibuffer penuh |
| Isolasi data antar brand | 🔴 Tidak ada | Filter client-side saja (K-3) |
| PII terlindungi | 🔴 Tidak | 505 nomor HP pelanggan terbaca semua user login (K-4) |
| Migration idempotent | ⚠️ Tidak | `ADD CONSTRAINT` + `CREATE POLICY` gagal saat re-run (P-8) |
| Migration lengkap di repo | 🔴 Tidak | 12+ tabel & semua policy anon tidak ada di repo (P-7) |
| Dependency audit | ⚠️ 18 isu | 12 high, 6 moderate, 0 critical (M-1) |
| Type safety | ⚠️ Lemah | 48 `as any`, 7 `as never` di jalur mutation (M-2) |

---

## Rekomendasi prioritas (Top 5)

1. **Tutup akses `anon` — hari ini juga (K-1).** Data ads sedang bocor ke publik saat laporan ini ditulis. Drop 9 policy anon, `REVOKE` hak tulis, verifikasi ulang dengan `set local role anon`. Sekitar 15 menit kerja, dan ini satu-satunya temuan yang sedang aktif tereksploitasi tanpa perlu kredensial apa pun.

2. **Perbaiki 4 guard fail-open (K-2).** Ubah `if (secret && ...)` jadi `if (!secret) return 500`. Empat file, satu pola, ~10 menit. Sekaligus set `CRON_SECRET` di `.env.production` dan pastikan `.gitignore` menutup `.env*`.

3. **Lindungi PII pelanggan (K-4).** 505 nomor HP tidak perlu terlihat oleh role curator/feed_socmed. Buat view tanpa kolom PII, `REVOKE` tabel mentah, arahkan `useScalevOrders` ke view. ~1 jam termasuk penyesuaian tipe.

4. **Betulkan P&L dan jalur webhook (P-1, P-2, P-3).** Ini tiga bug yang membuat dashboard **melaporkan angka yang salah** — profit overstated, order webhook tidak muncul, omzet pagi hari masuk ke tanggal keliru. Dashboard yang salah lebih berbahaya daripada tidak ada dashboard, karena keputusan tetap diambil berdasarkan angkanya. ~4 jam.

5. **Jadikan repo sebagai source of truth schema (P-7, P-8).** Dump baseline, commit, lalu tegakkan aturan "RLS hanya lewat migration". Tanpa ini, temuan K-1 akan terulang — policy anon itu bisa masuk justru karena tidak ada yang me-review-nya. ~2 jam, dan ini yang mencegah keempat prioritas di atas berulang.

---

## Yang sudah bagus

Supaya seimbang — beberapa hal di codebase ini dikerjakan dengan benar dan layak dipertahankan:

- **Verifikasi signature webhook** (`scalevSignature.ts`) tekstbook: raw body dibaca sebelum parse, perbandingan timing-safe, cek panjang mendahului perbandingan, mendukung Base64 dan hex. Tidak ada yang perlu diubah.
- **Penanganan partial payload di webhook** (`route.ts:159-168`) — penjagaan eksplisit agar nilai existing tidak tertimpa 0/null menunjukkan pemahaman nyata soal mode kegagalan sync. Persis pertanyaan yang diajukan di brief, dan jawabannya: sudah benar.
- **Penanganan timezone di sisi client** (`utils.ts:30-37`, `AppContext.tsx:46`) memakai `Intl.DateTimeFormat` dengan `Asia/Jakarta`, bukan `toISOString()`. Komentarnya bahkan menjelaskan kenapa. Sayangnya webhook tidak ikut konvensi ini (P-3).
- **Guard `supabaseAdmin`** (`supabaseAdmin.ts:8-10`) yang melempar error kalau diimport dari browser — pencegahan bagus terhadap kebocoran service role key.
- **Toggle net/gross di komponen Omzet** (`performance.ts:155-156`) sudah menangani `net_payment_revenue` dengan benar; bagian P&L tinggal menyusul.
- **Pemulihan kegagalan parsial** di `repliz/comments/route.ts:51-58` — balasan sudah terkirim ke platform tapi update status gagal, dan kode memilih tidak memblokir user sambil tetap melaporkan errornya. Trade-off yang dipikirkan matang.

---

*Audit oleh Claude Opus 5 · 14 Agustus 2026 · verifikasi kode statis + query langsung ke DB produksi. Tidak ada nilai secret yang ditampilkan di laporan ini. Tidak ada perubahan yang diterapkan ke database — semua query bersifat read-only.*

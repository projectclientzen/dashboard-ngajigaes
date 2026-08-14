# TASK MAJOR — untuk Claude Sonnet

Repo: `dashboard-ngajigaes` (Next.js 14 App Router + Supabase)
Supabase project: `adslab-ngajigaes` / ref `xnfnbfqtskgiutvhhjjo`
Sumber: `audit-opus-dashboard-20260814.md` di root repo — **baca dulu sebelum mulai.**

## Aturan umum untuk semua task di file ini

1. **Jangan jalankan DDL ke produksi tanpa konfirmasi Maszen.** Tulis SQL-nya sebagai file migration di `supabase/migrations/`, tunjukkan, minta approve, baru apply.
2. Setiap perubahan RLS **wajib** masuk file migration — jangan lewat SQL Editor. Ini akar masalah K-1 (policy anon bisa masuk karena tidak pernah ter-review).
3. Setelah tiap task: `npm run build` harus lolos.
4. Kalau menemukan asumsi yang tidak bisa diverifikasi dari kode, **tanya** — jangan tebak.
5. Kerjakan berurutan. M1 → M2 → M3 dulu (security), baru M4+ (correctness).

---

## M1 🔴 Tutup akses role `anon` di 5 tabel

**Kenapa major:** SQL-nya sudah jelas, tapi ada risiko nyata — kalau proses sync ads menulis pakai anon key, `REVOKE` akan mematikan sync. Itu harus diinvestigasi dulu.

**Kondisi terverifikasi (14 Agu 2026, live):** role `anon` bisa `SELECT` 1.366 baris `campaign_snapshots` tanpa login. Anon key ada di bundle browser.

Policy bermasalah:

| Tabel | Policy anon |
|---|---|
| `campaign_snapshots` | SELECT `true` |
| `ads_detail` | SELECT + INSERT + UPDATE `true` |
| `campaign_kpi_targets` | SELECT + INSERT + UPDATE `true` |
| `alert_log` | SELECT `true` |
| `fetch_status` | SELECT `true` |

**Langkah:**

1. **Investigasi dulu — jangan langsung revoke.** Cari apa yang menulis ke `campaign_snapshots`, `ads_detail`, `campaign_kpi_targets`, `alert_log`, `fetch_status`. Grep repo ini; tabel-tabel itu **tidak ditulis** dari kode repo ini (sudah saya cek — tidak ada di `src/`). Kemungkinan besar ada service/script eksternal (n8n, Apps Script, atau repo lain) yang menulisnya. **Tanya Maszen: "apa yang mengisi tabel `campaign_snapshots` dan `ads_detail`? Pakai anon key atau service role key?"** Kalau pakai anon key, service itu harus ganti ke service role key **sebelum** revoke dijalankan, atau sync akan mati diam-diam.

2. Buat `supabase/migrations/20260815_fix_anon_rls.sql`:

```sql
-- Tutup akses role anon (temuan audit K-1)
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

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
```

3. **Verifikasi setelah apply** — harus mengembalikan 0 semua:
```sql
set local role anon;
select 'campaign_snapshots' t, count(*) from campaign_snapshots
union all select 'ads_detail', count(*) from ads_detail
union all select 'campaign_kpi_targets', count(*) from campaign_kpi_targets
union all select 'alert_log', count(*) from alert_log
union all select 'fetch_status', count(*) from fetch_status;
```
4. Cek halaman `/performance` masih tampil normal saat login (`campaign_snapshots` dipakai di `src/lib/queries/performance.ts:217`).

**Selesai kalau:** anon dapat 0 baris di kelima tabel, halaman Performance tetap jalan saat login, dan sudah dikonfirmasi service penulis tabel-tabel itu pakai service role key.

---

## M2 🔴 Lindungi PII pelanggan di `scalev_orders`

**Kondisi:** 507 order, **505 punya `customer_phone`**. Policy `scalev_orders_select_auth` (`supabase/migrations/20260814_scalev_sync.sql:46`) = `USING (true)` untuk semua `authenticated`. Role `curator` yang tugasnya cuma validasi konten bisa tarik semua nomor HP pelanggan.

**Langkah:**

1. Migration `supabase/migrations/20260815_scalev_pii.sql`:
```sql
REVOKE SELECT ON public.scalev_orders FROM authenticated;

CREATE OR REPLACE VIEW public.scalev_orders_safe
WITH (security_invoker = true) AS
  SELECT id, order_id, scalev_id, status, gross_revenue, net_payment_revenue,
         payment_fee, scalev_fee, service_fee, payment_method,
         order_date, is_spam, brand_id, synced_at, created_at
  FROM public.scalev_orders;

GRANT SELECT ON public.scalev_orders_safe TO authenticated;
```
> `security_invoker = true` penting — jangan sampai bikin masalah yang sama dengan M6.

2. Ubah `src/lib/queries/performance.ts:36` — `.from('scalev_orders')` → `.from('scalev_orders_safe')`.
3. Hapus `customer_name` dari `mapScalevOrder` (`performance.ts:12`) **dan** dari tipe `ScalevOrder` di `src/types/index.ts`. Ikuti error TypeScript sampai bersih — kalau ada UI yang menampilkan nama pelanggan, laporkan ke Maszen dulu sebelum menghapus fiturnya.
4. Kalau leader memang butuh lihat PII, buat view kedua `scalev_orders_pii` dengan policy `current_user_role() = 'leader'`. **Tanya dulu apakah ini dibutuhkan** — jangan bikin kalau tidak ada yang pakai.

**Selesai kalau:** `select customer_phone from scalev_orders` sebagai `authenticated` ditolak, halaman Performance tetap normal, `npm run build` lolos.

---

## M3 🔴 Isolasi multi-brand — **tanya dulu sebelum kerjakan**

**Ini bukan task langsung eksekusi.** Dari 73 RLS policy di 31 tabel, nol yang menyaring `brand_id`. Filter brand cuma di client (`src/lib/queries/performance.ts:42,58,90,141,219`).

**Pertanyaan ke Maszen yang harus dijawab lebih dulu:**
> "Apakah semua anggota tim boleh melihat data semua brand? Atau ada anggota yang seharusnya hanya pegang 1 brand?"

- **Kalau semua boleh lihat semua** → tidak ada yang perlu dikoding. Cukup tambahkan komentar di `src/contexts/AppContext.tsx` dekat `brandId`: brand switcher = filter tampilan, **bukan** kontrol akses. Selesai. Jangan over-engineer.
- **Kalau perlu dibatasi** → baru implementasikan `brand_members` + `can_access_brand()` sesuai bagian K-3 di laporan audit, lalu ubah policy di 8 tabel: `scalev_orders`, `scalev_products`, `meta_ads_daily_spend`, `campaign_snapshots`, `contents`, `instagram_account_insights`, `instagram_content_insights`, `performance_manual_sales`. Ini pekerjaan besar (~1 hari) — pecah jadi PR sendiri, jangan digabung task lain.

---

## M4 🟠 Perbaiki perhitungan P&L

**File:** `src/app/(app)/performance/page.tsx:602-610`

Sekarang:
```ts
const completed = useMemo(() => orders.filter(o => o.status === 'completed'), [orders])
const revenue = completed.reduce((a, o) => a + (o.gross_revenue ?? 0), 0)
const grossProfit = revenue - spend
const netProfit = grossProfit          // ⚠️ net === gross, fee tidak pernah dikurangi
const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0
```

**Terverifikasi:** 505 dari 507 baris punya `payment_fee` dan `scalev_fee` terisi, 506 punya `net_payment_revenue`. Jadi datanya ada, hanya tidak dipakai. Profit & margin overstated.

Ganti jadi:
```ts
const revenueGross = completed.reduce((a, o) => a + (o.gross_revenue ?? 0), 0)
const revenueNet   = completed.reduce((a, o) => a + (o.net_payment_revenue ?? o.gross_revenue ?? 0), 0)
const grossProfit  = revenueGross - spend
const netProfit    = revenueNet   - spend
const margin = revenueNet > 0 ? (netProfit / revenueNet) * 100 : 0
```

Lalu pastikan label di UI jujur: kalau COGS/HPP belum ikut dihitung (memang belum — tidak ada kolom HPP di mana pun), **jangan** beri label "Net Profit" polos. Pakai "Profit setelah Ads & Fee" atau tambahkan catatan kecil "belum termasuk HPP".

Status order: hanya ada `completed` (369) dan `pending` (138) di DB, jadi filter `=== 'completed'` sudah benar — jangan diubah.

**Selesai kalau:** angka Net Profit < Gross Profit saat ada fee, margin ikut menyesuaikan, label tidak menyesatkan.

---

## M5 🟠 Webhook Scalev: isi `brand_id` + perbaiki timezone

**File:** `src/app/api/webhooks/scalev/route.ts:140-178`

Dua bug bersamaan, kerjakan sekaligus:

**Bug A — `brand_id` tidak pernah di-set** (baris 159-168). Objek `row` hanya berisi `order_id`, `synced_at`, dan field opsional. Terverifikasi ada **1 baris di produksi dengan `brand_id` DAN `order_date` NULL** — pola persis order asal webhook. Baris seperti itu tersaring keluar oleh `.gte('order_date', start)` di `performance.ts:38`, jadi **order webhook tidak pernah muncul di dashboard sama sekali**.

**Bug B — tanggal UTC vs WIB** (baris 156):
```ts
const orderDate = ((data.draft_time ?? data.created_at ?? '') as string).slice(0, 10)
```
`.slice(0,10)` mengambil tanggal UTC. Dashboard pakai WIB (`src/lib/utils.ts:30-37`, `AppContext.tsx:46`). Order jam 00:00–07:00 WIB tercatat di tanggal kemarin.

**Langkah:**

1. Tambah helper di file itu (samakan konvensi dengan `src/lib/utils.ts:30`):
```ts
function jakartaDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso))
}
```
2. Ganti baris 156:
```ts
const rawDate = (data.draft_time ?? data.created_at) as string | undefined
const orderDate = rawDate ? jakartaDate(rawDate) : undefined
```
3. `order_date` harus selalu terisi — tambahkan fallback ke tanggal WIB saat diterima, supaya order tidak hilang total walau payload tidak bawa tanggal.
4. Mapping `brand_id`: perlu kolom baru `brands.scalev_store_id` (belum ada). **Cek dulu payload Scalev asli** — lihat isi `raw_payload` di tabel `scalev_webhook_events` untuk tahu field identitas bisnis apa yang sebenarnya dikirim (`business_id`? `store_id`? nama lain?). Jangan tebak nama fieldnya. Setelah tahu, buat migration tambah kolom + lookup:
```ts
const storeId = (data.business_id ?? data.store_id) as string | undefined  // sesuaikan!
if (storeId) {
  const { data: b } = await supabaseAdmin
    .from('brands').select('id').eq('scalev_store_id', storeId).maybeSingle()
  if (b) row.brand_id = b.id
}
```
5. Backfill baris NULL yang sudah terlanjur ada (cuma 1 baris) setelah mapping jalan.
6. **Jangan ubah** blok penjagaan `!== undefined` di baris 163-168 — itu sudah benar dan mencegah data tertimpa null.

**Selesai kalau:** order baru dari webhook punya `brand_id` dan `order_date` terisi, dan muncul di halaman Performance saat brand-nya dipilih.

---

## M6 🟠 Ubah 4 view jadi `security_invoker`

**Terdeteksi Supabase advisor, level ERROR.** View `tasks_view`, `extra_tasks_view`, `content_insight_view`, `account_insight_view` pakai `SECURITY DEFINER` — menjalankan RLS pembuat view, bukan pemanggil. Ini membatalkan policy per-user seperti `tasks_own_select (assignee_id = auth.uid())`.

```sql
ALTER VIEW public.tasks_view            SET (security_invoker = true);
ALTER VIEW public.extra_tasks_view      SET (security_invoker = true);
ALTER VIEW public.content_insight_view  SET (security_invoker = true);
ALTER VIEW public.account_insight_view  SET (security_invoker = true);
```

**Hati-hati:** setelah ini, query yang selama ini diam-diam mengandalkan bypass akan mulai mengembalikan baris kosong. **Itu bukan regresi — itu bukti kebocorannya nyata.** Tapi bisa bikin halaman kelihatan rusak. Sebelum apply:

1. Grep pemakaian keempat view di `src/lib/queries/` — catat halaman mana yang terdampak.
2. Apply, lalu tes login sebagai user **non-leader** dan cek halaman Tasks, Extra Tasks, Instagram Insight.
3. Kalau ada halaman yang jadi kosong padahal user memang seharusnya lihat data itu, **perbaiki policy tabel dasarnya** — jangan kembalikan `SECURITY DEFINER`.

Laporkan ke Maszen halaman mana saja yang berubah perilakunya.

---

## M7 🟠 Jadikan repo source of truth schema

`supabase/migrations/20260626_ngajigaes_full_schema.sql:90-93` cuma komentar:
```sql
-- 008–019: tasks, comments, daily_reports, kpis, ... (lihat MCP migration history)
```

Definisi 12+ tabel inti dan **semua policy anon dari M1** tidak pernah ada di repo. `scalev_webhook_events` juga tidak (padahal dipakai di `route.ts:97` dan ada di produksi). Ini akar penyebab M1 — tidak ada yang bisa me-review policy yang tidak pernah masuk PR.

**Langkah:**
1. Dump baseline (butuh connection string dari Maszen — **jangan tampilkan nilainya**):
```bash
supabase db dump --db-url "$DATABASE_URL" -f supabase/migrations/20260815_baseline_schema.sql
```
2. Commit hasil dump.
3. Tambahkan catatan di `README.md`: perubahan schema & RLS **hanya** lewat file migration, dilarang lewat SQL Editor.
4. Kerjakan **setelah** M1/M2/M6 supaya baseline sudah berisi versi yang benar.

---

## M8 🟡 Regenerate tipe database

48 `as any` + 7 `as never` di repo. Yang paling berisiko: `as never` di argumen `.upsert()` (`src/app/api/webhooks/scalev/route.ts:173`) — mematikan pengecekan tipe pada shape row sepenuhnya. Ini persis yang meloloskan bug `brand_id` hilang di M5 tanpa peringatan compiler.

```bash
npx supabase gen types typescript --project-id xnfnbfqtskgiutvhhjjo > src/types/database.types.ts
```

Lalu hapus `as never` di `webhooks/scalev/route.ts` (baris 97, 105, 106, 115, 122, 172, 173) dan pakai `supabaseAdmin` bertipe. Perbaiki error yang muncul — **jangan** ganti `as never` jadi `as any`, itu tidak menyelesaikan apa pun.

Kerjakan **setelah M5**, supaya perubahan shape row-nya sudah final.

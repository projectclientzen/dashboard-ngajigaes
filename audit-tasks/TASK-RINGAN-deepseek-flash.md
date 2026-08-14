# TASK RINGAN — untuk DeepSeek / model cepat

Repo: `dashboard-ngajigaes` (Next.js 14 App Router + Supabase)
Sumber: `audit-opus-dashboard-20260814.md` di root repo.

Semua task di bawah **mekanis** — perubahannya sudah ditulis lengkap, tinggal terapkan persis. Tidak perlu keputusan arsitektur.

## Aturan

1. **Terapkan persis seperti yang tertulis.** Jangan improvisasi, jangan refactor hal lain, jangan rapikan kode di sekitarnya.
2. **Jangan sentuh file di luar yang disebut** di tiap task.
3. Task SQL: **tulis sebagai file migration**, jangan jalankan ke database. Serahkan ke Maszen untuk apply.
4. Setelah semua task kode selesai: jalankan `npm run build`, pastikan lolos.
5. Kalau ada yang tidak cocok dengan deskripsi (nomor baris meleset, kode sudah berubah), **berhenti dan lapor** — jangan paksakan.

---

## R1 🔴 Perbaiki 4 API route yang fail-open

**Prioritas tertinggi di file ini.** Perubahannya identik di 4 file.

**Masalah:** pola `if (secret && auth !== ...)` berarti kalau env var kosong, guard-nya dilewati total dan endpoint jadi publik.

### File 1 — `src/app/api/cron/daily-reminder/route.ts` baris 8-12

Ganti:
```ts
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
```
Jadi:
```ts
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/daily-reminder] CRON_SECRET tidak di-set')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
```

### File 2 — `src/app/api/cron/repliz-sync/route.ts` baris 11-15
Sama persis, tapi env var-nya `process.env.PUSH_SEND_SECRET` dan label log `[cron/repliz-sync]`.

### File 3 — `src/app/api/push/send/route.ts` baris 6-10
Sama persis, env var `process.env.PUSH_SEND_SECRET`, label log `[push/send]`.

### File 4 — `src/app/api/repliz/sync/route.ts` baris 8-12
Sama persis, env var `process.env.PUSH_SEND_SECRET`, label log `[repliz/sync]`.

**Referensi pola yang benar:** `src/app/api/webhooks/scalev/route.ts:81-85` sudah memakai pola ini. Samakan.

**Catatan untuk Maszen (tulis di akhir laporanmu):** `CRON_SECRET` tidak ada di `.env.local`. Setelah perubahan ini, `/api/cron/daily-reminder` akan balas 500 sampai env var-nya di-set. Itu memang yang diinginkan — lebih baik mati daripada terbuka.

**Selesai kalau:** keempat file punya blok `if (!secret) return 500` terpisah sebelum pengecekan `Bearer`.

---

## R2 🔴 Perbaiki `.gitignore`

**File:** `.gitignore`

Sekarang hanya meng-exclude `.env*.local`, jadi `.env.production` dan `.env` **tidak ter-cover** dan bisa ter-commit tidak sengaja.

Cari baris:
```
# local env files
.env*.local
```
Ganti jadi:
```
# local env files
.env*
!.env.example
```

**Jangan** hapus `.env.example` dari repo — itu placeholder dan memang harus ada.

Setelah edit, jalankan `git status --short` dan pastikan tidak ada file `.env*` (selain `.env.example`) yang muncul sebagai tracked.

---

## R3 🟠 Webhook: balas 500 untuk error transient

**File:** `src/app/api/webhooks/scalev/route.ts` baris 124-128

Sekarang gagal simpan tetap balas 200, yang membuat Scalev menganggap event terkirim padahal tidak tersimpan — event hilang permanen.

Ganti:
```ts
  if (insertError) {
    console.error('[scalev-webhook] Insert error:', insertError.message)
    // Tetap return 200 agar Scalev tidak retry (payload sudah diterima)
    return NextResponse.json({ ok: true, status: 'save_error', detail: insertError.message })
  }
```
Jadi:
```ts
  if (insertError) {
    console.error('[scalev-webhook] Insert error:', insertError.message)
    // Balas 500 supaya Scalev retry — event yang gagal disimpan jangan dibuang.
    return NextResponse.json({ error: 'Gagal menyimpan event' }, { status: 500 })
  }
```

**Jangan ubah bagian lain** di file ini — ada task lain (M5 di file TASK-MAJOR) yang menggarap fungsi `upsertOrderFromPayload` di file yang sama. Sentuh blok ini saja.

---

## R4 🟠 Migration: bikin idempotent

**File:** `supabase/migrations/20260813_ig_graph_and_inbox_collab.sql` baris 12-13

Postgres tidak mendukung `IF NOT EXISTS` untuk `ADD CONSTRAINT` — dijalankan dua kali langsung error dan membatalkan sisa migration.

Ganti:
```sql
ALTER TABLE public.instagram_content_insights
  ADD CONSTRAINT instagram_content_insights_content_date_unique UNIQUE (content_id, insight_date);
```
Jadi:
```sql
DO $$ BEGIN
  ALTER TABLE public.instagram_content_insights
    ADD CONSTRAINT instagram_content_insights_content_date_unique UNIQUE (content_id, insight_date);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;
```

Lalu di file yang sama, awali **setiap** `CREATE POLICY` (baris 63-69) dengan baris `DROP POLICY IF EXISTS`. Contoh:
```sql
DROP POLICY IF EXISTS repliz_comment_meta_select ON public.repliz_comment_meta;
CREATE POLICY repliz_comment_meta_select ON public.repliz_comment_meta FOR SELECT TO authenticated USING (true);
```

Lakukan hal yang sama untuk semua `CREATE POLICY` di:
- `supabase/migrations/20260814_scalev_sync.sql` (baris 46-47)
- `supabase/migrations/20260814_meta_ads_daily_spend.sql` (baris 19)
- `supabase/migrations/20260814_performance_manual_sales.sql` (baris 21-22)

**Jangan ubah isi policy-nya** — hanya tambahkan `DROP POLICY IF EXISTS` di depannya.

---

## R5 🟠 SQL: perbaiki policy `performance_manual_sales`

**Buat file baru:** `supabase/migrations/20260815_manual_sales_policies.sql`

Masalah: `WITH CHECK (true)` membuat user mana pun bisa menyuntik baris omzet dengan `brand_id` apa pun dan memalsukan `created_by`. Dan karena tidak ada policy UPDATE/DELETE, baris salah **tidak bisa dihapus lewat aplikasi** — bahkan oleh leader.

Isi file:
```sql
-- Perbaikan policy performance_manual_sales (temuan audit P-5)

ALTER TABLE public.performance_manual_sales
  ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY IF EXISTS performance_manual_sales_insert ON public.performance_manual_sales;
CREATE POLICY pms_insert ON public.performance_manual_sales
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS pms_update_own_or_leader ON public.performance_manual_sales;
CREATE POLICY pms_update_own_or_leader ON public.performance_manual_sales
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.current_user_role() = 'leader')
  WITH CHECK (created_by = auth.uid() OR public.current_user_role() = 'leader');

DROP POLICY IF EXISTS pms_delete_own_or_leader ON public.performance_manual_sales;
CREATE POLICY pms_delete_own_or_leader ON public.performance_manual_sales
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.current_user_role() = 'leader');
```

**Jangan jalankan** — cukup buat filenya.

---

## R6 🟡 SQL: hardening function

**Buat file baru:** `supabase/migrations/20260815_function_hardening.sql`

```sql
-- search_path mutable (temuan audit M-6)
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.jakarta_date(timestamptz) SET search_path = public;

-- Function SECURITY DEFINER tidak boleh dipanggil anon (temuan audit M-7)
REVOKE EXECUTE ON FUNCTION public.close_weekly_review(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.compute_kpi_actual(uuid,uuid,date,date,uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.compute_productivity_score(uuid,date,date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.compute_productivity_score(uuid,date,date,uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_product_sold(date,date,uuid) FROM anon;

-- Trigger function — tidak boleh dipanggil langsung sama sekali
REVOKE EXECUTE ON FUNCTION public.guard_content_validation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_by() FROM anon, authenticated;
```

**Jangan jalankan** — cukup buat filenya.

---

## R7 🟡 SQL: rapikan policy duplikat di `brands`

**Buat file baru:** `supabase/migrations/20260815_brands_policy_cleanup.sql`

Tabel `brands` punya 6 policy, beberapa identik: `brands_select_all` dan `brands_select_authenticated` sama persis, dan `brands_leader_write FOR ALL` tumpang tindih dengan `brands_insert/update/delete_leader`.

```sql
-- Rapikan policy duplikat di brands (temuan audit M-9)
DROP POLICY IF EXISTS brands_select_authenticated ON public.brands;
DROP POLICY IF EXISTS brands_insert_leader ON public.brands;
DROP POLICY IF EXISTS brands_update_leader ON public.brands;
DROP POLICY IF EXISTS brands_delete_leader ON public.brands;
-- Tersisa: brands_select_all (SELECT, semua authenticated)
--          brands_leader_write (ALL, leader saja) — sudah mencakup insert/update/delete
```

**Jangan jalankan** — cukup buat filenya. Perilakunya identik dengan sebelumnya, hanya lebih mudah diaudit.

---

## R8 🟡 Update dependency

```bash
npm audit fix
npm update next
npm run build
```

Kondisi awal: 18 kerentanan (12 high, 6 moderate, 0 critical). Yang paling penting: paket `next` sendiri (DoS via Image Optimizer `remotePatterns`).

**Jangan pakai `npm audit fix --force`** — itu bisa memicu breaking change major version. Kalau `npm audit fix` biasa tidak menyelesaikan semuanya, laporkan sisanya ke Maszen, jangan dipaksa.

Setelah selesai, jalankan `npm audit` lagi dan laporkan angka sebelum/sesudah. Pastikan `npm run build` masih lolos.

---

## R9 🟡 Cek indikator data stale di halaman Performance

**File:** `src/app/(app)/performance/page.tsx` (bagian tabel campaign, sekitar baris 400-560)

`src/lib/queries/performance.ts:227-233` punya fallback: kalau tidak ada campaign snapshot di periode terpilih, query mundur ke 300 snapshot terakhir **tanpa filter tanggal**, dan mengembalikan `isStale: true`.

**Tugasmu — periksa saja, jangan langsung ubah:**
1. Cari apakah `isStale` benar-benar dipakai untuk menampilkan peringatan di UI.
2. Kalau **sudah ada** peringatan yang jelas terlihat — laporkan "sudah aman", selesai.
3. Kalau **tidak ada** atau cuma teks kecil samar — tambahkan badge yang mencolok di atas tabel campaign, misalnya:
```tsx
{campaignQ.data?.isStale && (
  <div className="mb-2 rounded-md bg-[#FBF0DC] px-3 py-2 text-[12.5px] text-[#8A6A2F]">
    ⚠️ Data campaign di bawah bukan dari periode terpilih — menampilkan snapshot terakhir yang tersedia.
  </div>
)}
```
Sesuaikan nama variabel dengan yang benar-benar ada di file itu.

**Kenapa penting:** angka spend dari bulan lalu yang muncul di panel "bulan ini" adalah salah baca yang mahal.

---

## Yang TIDAK boleh dikerjakan di file ini

Task berikut ada di `TASK-MAJOR-sonnet.md` — **jangan disentuh** karena butuh investigasi atau keputusan:

- Menutup policy `anon` (butuh cek dulu apa yang menulis tabelnya — bisa mematikan sync)
- View PII `scalev_orders` (butuh perubahan tipe lintas file)
- Isolasi multi-brand (butuh keputusan Maszen dulu)
- Perhitungan P&L (butuh paham model bisnis)
- Fungsi `upsertOrderFromPayload` di webhook (butuh lihat payload Scalev asli)
- `ALTER VIEW ... security_invoker` (bisa bikin halaman kosong, butuh tes manual)
- Regenerate `database.types.ts`

---

## Format laporan akhir

Setelah selesai, laporkan singkat:
- Task mana yang selesai, mana yang di-skip dan kenapa
- Hasil `npm run build` (lolos/gagal)
- Hasil `npm audit` sebelum vs sesudah
- Daftar file migration baru yang dibuat (dan **belum** dijalankan — perlu approve Maszen)

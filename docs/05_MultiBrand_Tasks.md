# Multi-Brand — Analisis & Task Breakdown

Ubah dashboard NgajiGaes dari single-brand jadi multi-brand. Tiap task atomik: satu migrasi, satu query, satu komponen, atau satu test. Centang saat beres.

Track: **FND** foundation, **CTX** context+switcher, **MOD** module wiring, **AGG** aggregate dashboard, **ADM** brand management, **ADS** ads-tables link, **SEC** security, **TEST**.

---

## 0. Keputusan yang sudah dikunci

| # | Titik | Keputusan |
|---|---|---|
| D1 | Model tim | **Global** — satu tim menangani semua brand. User punya akses ke semua brand. Tidak ada tabel keanggotaan user↔brand. |
| D2 | Scope data | Semua data workspace **brand-scoped** (`brand_id`). Switcher punya mode **"Semua Brand"** (agregat, read-only lintas brand) + per-brand (detail). |
| D3 | Model brand | Tabel **`brands`** + FK. Enum lama sisi ads dimigrasi ke FK. Seed: `ngajigaes`, `labbaika`, `alaika`. Data existing → `ngajigaes`. |
| D4 | RLS | Tetap berbasis role (bukan keanggotaan brand). Filter brand di **layer query**, bukan RLS. Konsekuensi: tim shared boleh baca semua brand — sesuai D1. |
| D5 | Create action | Butuh brand konkret aktif. Saat mode "Semua Brand", tombol create di-disable dengan hint "pilih brand dulu". |
| D6 | score_settings | **Global** untuk v1 (bobot skor sama semua brand). Ditandai untuk revisit. |
| D7 | Default switcher | Dashboard, Team Performance, Omzet → default "Semua Brand". Halaman create (Task, Konten, Daily) → wajib brand konkret. |

---

## Tabel yang terdampak

**Perlu tambah `brand_id` (13 tabel workspace, sekarang belum ada brand):**
`tasks`, `contents`, `daily_reports`, `extra_tasks`, `kpis`, `kpi_results`, `productivity_scores`, `products`, `sales_records`, `instagram_account_insights`, `instagram_content_insights`, `weekly_reviews`, `action_plans`

**Sudah punya `brand` (enum text) — migrasi ke `brand_id`:**
`campaign_snapshots`, `campaign_kpi_targets`, `fetch_status`, `alert_log`

**Tetap global (tanpa brand):**
`users`, `roles`, `push_subscriptions`, `score_settings` (D6), `task_comments` (ikut brand via `task_id`)

---

## Sprint 0 — Foundation (FND)

- [ ] **FND-1 Migrasi tabel `brands`** Kolom: `id uuid pk default gen_random_uuid()`, `name text not null`, `slug text unique not null`, `color text`, `logo_url text`, `status text default 'active' check (active|inactive)`, `created_at timestamptz default now()`. Cek: insert jalan.
- [ ] **FND-2 Seed brands** Insert 3 brand existing: `ngajigaes`, `labbaika`, `alaika` (slug = nama lowercase). Simpan id `ngajigaes` untuk backfill. Cek: 3 baris ada.
- [ ] **FND-3 RLS brands** SELECT untuk semua authenticated. INSERT/UPDATE/DELETE leader-only. Cek: tim bisa baca, tim ditolak tulis.
- [ ] **FND-4 Tambah `brand_id` ke 13 tabel workspace** `alter table <t> add column brand_id uuid references brands(id)`. Cek: kolom ada, FK valid.
- [ ] **FND-5 Backfill workspace → ngajigaes** `update <t> set brand_id = '<id-ngajigaes>' where brand_id is null` untuk 13 tabel. Cek: tidak ada baris `brand_id is null`.
- [ ] **FND-6 Set NOT NULL + index** Setelah backfill: `alter column brand_id set not null` + `create index <t>_brand_idx on <t>(brand_id)` untuk 13 tabel. Cek: query per brand pakai index.
- [ ] **FND-7 Query `brands`** `lib/queries/brands.ts`: `useBrands()` (list active), `useCreateBrand`, `useUpdateBrand`, `useDeleteBrand` (soft: status=inactive). Cek: list tampil.
- [ ] **FND-8 Tipe `Brand`** Tambah di `types/index.ts`: `{ id, name, slug, color, logo_url, status }`. Cek: tipe cocok row.

---

## Sprint 1 — Context + Switcher (CTX)

- [ ] **CTX-1 AppContext brand state** Tambah ke `AppContext`: `brandId: string | 'all'`, `setBrandId`, `brand` (objek terpilih atau null saat 'all'), `isAllBrands`. Persist ke localStorage. Default `'all'`. Cek: state bertahan reload.
- [ ] **CTX-2 Guard brand konkret** Helper `requireBrandId()` → lempar/return null saat `'all'`. Dipakai halaman create. Cek: create diblok saat "Semua Brand".
- [ ] **CTX-3 BrandSwitcher komponen** Dropdown di Header (desktop) + Header mobile. Isi: "Semua Brand" + tiap brand (warna + nama). Ganti brand → update context. Cek: pilih brand → context berubah.
- [ ] **CTX-4 Badge brand di sidebar** Tampilkan brand aktif di bawah logo (nama + warna) biar konteks jelas. Cek: brand aktif kelihatan.
- [ ] **CTX-5 Reset query saat ganti brand** Pastikan react-query key semua modul menyertakan `brandId` → auto refetch saat switch. Cek: ganti brand → data ikut ganti.

---

## Sprint 2 — Module Wiring (MOD)

Pola tiap modul: (a) query list `.eq('brand_id', brandId)` kecuali mode 'all'; (b) mutation create meng-attach `brand_id`; (c) queryKey menyertakan `brandId`.

- [ ] **MOD-1 Tasks** Filter + attach brand di `queries/tasks.ts`. Create task set `brand_id`. Kanban/tabel per brand. Cek: task brand A tak muncul di brand B.
- [ ] **MOD-2 Contents** Filter + attach di `queries/contents.ts`. Create konten set brand. Kalender per brand. Cek: konten terisolasi per brand.
- [ ] **MOD-3 Daily Reports** Filter + attach di `queries/daily-reports.ts`. Insert laporan set brand. Cek: laporan per brand terpisah.
- [ ] **MOD-4 Extra Tasks** Filter + attach di `queries/extra-tasks.ts` + `extra_tasks_view` (tambah brand_id ke view). Cek: tugas tambahan per brand.
- [ ] **MOD-5 KPI + Results** Filter + attach `queries/kpi.ts`. KPI, kpi_results, sync dari daily ikut brand. `kpiPeriodBounds` tetap; tambah dimensi brand di upsert. Cek: KPI brand A tak tercampur brand B.
- [ ] **MOD-6 Productivity Scores** Filter + attach. Skor dihitung per brand. Cek: skor per brand benar.
- [ ] **MOD-7 Products** Filter + attach `queries/sales.ts` (produk). Produk per brand. Cek: katalog per brand.
- [ ] **MOD-8 Sales Records** Filter + attach. Omzet per brand. `resolveProductId`/entry manual set brand. Cek: omzet per brand benar.
- [ ] **MOD-9 Instagram Insights** Filter + attach account + content insights `queries/instagram.ts`. Cek: insight per brand.
- [ ] **MOD-10 Weekly Review + Action Plans** Filter + attach. Review mingguan per brand. Cek: review per brand.
- [ ] **MOD-11 Sidebar/Nav badge count** Badge tugas/tugas-tambahan di sidebar ikut brand aktif (atau total saat 'all'). Cek: badge sesuai brand.

---

## Sprint 3 — Aggregate Dashboard (AGG)

- [ ] **AGG-1 Query agregat lintas brand** Saat `brandId === 'all'`, query tanpa filter brand + sertakan kolom brand untuk grouping. Cek: data semua brand kebaca.
- [ ] **AGG-2 Dashboard "Semua Brand"** Kartu ringkasan per brand (omzet, task, KPI) + total gabungan. Cek: angka per brand + total benar.
- [ ] **AGG-3 Team Performance lintas brand** Mode 'all' tampilkan skor gabungan + breakdown per brand. Cek: ranking benar.
- [ ] **AGG-4 Omzet lintas brand** Grafik omzet dengan seri per brand saat 'all'. Cek: seri benar.
- [ ] **AGG-5 Label brand di list agregat** Tiap baris di mode 'all' diberi chip warna brand. Cek: mudah dibedakan.

---

## Sprint 4 — Brand Management (ADM)

- [ ] **ADM-1 Settings: daftar brands** Section baru di `/settings` (leader-only): tabel brand + status. Cek: tampil.
- [ ] **ADM-2 Tambah brand** Form: nama, slug (auto dari nama), warna, logo (opsional). Cek: brand baru muncul di switcher.
- [ ] **ADM-3 Edit brand** Ubah nama/warna/status. Cek: perubahan refleksi di switcher.
- [ ] **ADM-4 Nonaktifkan brand** Soft-delete (status=inactive) — hilang dari switcher, data tetap. Cek: brand inactive tak muncul.
- [ ] **ADM-5 Guard slug unik** Tolak slug duplikat dengan pesan jelas. Cek: duplikat ditolak.

---

## Sprint 5 — Ads Tables Link (ADS)

- [ ] **ADS-1 `brand_id` di tabel ads** Tambah FK ke `campaign_snapshots`, `campaign_kpi_targets`, `fetch_status`, `alert_log`. Cek: kolom ada.
- [ ] **ADS-2 Backfill dari enum** `update <t> set brand_id = b.id from brands b where b.slug = <t>.brand`. Cek: semua terisi.
- [ ] **ADS-3 Dual-write sementara** Selama transisi, isi `brand_id` DAN `brand` (enum) agar pipeline ads lama tak putus. Cek: dua kolom konsisten.
- [ ] **ADS-4 (opsional) Deprecate enum** Setelah pipeline ads pindah ke `brand_id`, drop kolom `brand` enum. Cek: tidak ada referensi enum tersisa. (Tunda sampai pipeline ads dikonfirmasi.)

---

## Cross-cutting Security (SEC)

- [ ] **SEC-1 Create wajib brand** Semua insert workspace menolak `brand_id` null (NOT NULL + guard app). Cek: create tanpa brand gagal aman.
- [ ] **SEC-2 Cross-brand leak check** Pastikan tak ada query modul yang lupa filter brand saat mode per-brand. Grep audit `from('<table>')` tanpa `.eq('brand_id'`. Cek: bersih.
- [ ] **SEC-3 Brand switcher tak bisa dipalsukan** brand_id dari context divalidasi ada di daftar brand aktif sebelum dipakai create. Cek: brand asal-asalan ditolak.

---

## Testing (TEST)

- [ ] **TEST-1 Isolasi** Buat task/konten/omzet di brand A → tak muncul saat brand B dipilih.
- [ ] **TEST-2 Agregat** Mode "Semua Brand" → total = jumlah semua brand.
- [ ] **TEST-3 Create guard** Mode "Semua Brand" → tombol create disabled + hint.
- [ ] **TEST-4 Brand baru** Tambah brand via Settings → langsung bisa dipilih & diisi data.
- [ ] **TEST-5 Backfill** Semua data lama tampil di brand `ngajigaes`, tak ada yang hilang.
- [ ] **TEST-6 KPI per brand** Sync KPI dari daily report brand A tak menyentuh KPI brand B.
- [ ] **TEST-7 Switch refetch** Ganti brand → semua halaman refetch, tak ada data basi brand sebelumnya.

---

## Urutan eksekusi

FND dulu (wajib, blocker semua). Lalu CTX (switcher jalan). Lalu MOD (modul satu per satu — bisa paralel per modul). AGG setelah minimal MOD sales+task+kpi. ADM kapan saja setelah FND. ADS terakhir (paling berisiko ke pipeline ads, dual-write dulu). SEC + TEST menyertai tiap sprint.

**Estimasi kasar:** FND ~0.5 hari, CTX ~0.5 hari, MOD ~1.5 hari (13 modul), AGG ~1 hari, ADM ~0.5 hari, ADS ~0.5 hari. Total ~4–5 hari kerja fokus.

---

## Risiko & catatan

1. **RLS longgar (D4)** — tim shared boleh baca semua brand lewat API langsung. Sesuai model "tim global", tapi kalau nanti ada brand yang butuh isolasi ketat (mis. klien eksternal), perlu naik ke model keanggotaan (D1 alternatif) + RLS brand-aware. Ditandai sebagai batas v1.
2. **Pipeline ads eksternal** — tabel `campaign_snapshots` dkk diisi oleh proses fetch ads di luar app ini. ADS-3 dual-write wajib agar tidak putus. Jangan drop enum (ADS-4) sebelum proses itu dikonfirmasi pindah.
3. **score_settings global (D6)** — kalau tiap brand mau bobot skor beda, ini jadi task tambahan (brand_id di score_settings + UI per brand).
4. **Volume data agregat** — mode "Semua Brand" menarik lintas brand; pastikan index `brand_id` (FND-6) terpasang agar query tetap cepat saat brand & data bertambah.

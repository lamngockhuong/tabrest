🇬🇧 [English](README.md) • 🇻🇳 [Tiếng Việt](README.vi.md) • 🇪🇸 [Español](README.es.md) • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 [Français](README.fr.md) • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 **Bahasa Indonesia**

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  Istirahatkan tab Anda, bebaskan memori - ekstensi Chrome yang secara otomatis membongkar tab yang tidak aktif.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome" alt="Manifest V3">
  <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?branch=main&logo=github" alt="CI Status">
  <img src="https://img.shields.io/badge/code_style-biome-60a5fa?logo=biome" alt="Code Style: Biome">
  <img src="https://img.shields.io/badge/JavaScript-ES_Modules-f7df1e?logo=javascript&logoColor=black" alt="JavaScript ES Modules">
  <img src="https://img.shields.io/github/license/lamngockhuong/tabrest" alt="License">
</p>

## Fitur

- **Membongkar tab tidak aktif secara otomatis** - Timer yang dapat dikonfigurasi (5 menit hingga 4 jam)
- **Ambang memori** - Membongkar tab saat RAM melebihi 60-95%
- **Batas memori per tab** - Membongkar tab yang menggunakan >100MB-1GB JS heap
- **Bongkar saat startup** - Bebaskan memori saat browser dibuka
- **Kontrol manual** - Membongkar tab saat ini/kiri/kanan/lainnya
- **Tutup tab duplikat** - Hapus duplikat dengan satu klik di jendela aktif
- **Pencarian tab** - Filter daftar tab secara langsung berdasarkan judul atau URL
- **Grup tab** - Membongkar seluruh grup tab sekaligus
- **Mode panel samping** - Buka TabRest di panel samping Chrome (opsional)
- **Tunda tab/situs** - Lindungi tab atau domain untuk sementara (30 menit - 2 jam)
- **Notifikasi peringatan penangguhan** - Peringatan di halaman selama 3 detik sebelum membuang tab secara otomatis
- **Indikator visual** - Awalan yang dapat dikustomisasi (💤) pada judul tab yang telah dibongkar
- **Daftar putih** - Lindungi situs dari pembongkaran otomatis (mendukung localhost & IP)
- **Impor/Ekspor** - Cadangkan daftar putih, daftar hitam, dan sesi ke JSON
- **Sesi** - Simpan dan pulihkan kumpulan tab
- **Pemulihan gulir** - Pulihkan posisi gulir saat tab dimuat ulang
- **Cap waktu YouTube** - Lanjutkan video dari posisi terakhir setelah dimuat ulang
- **Lewati saat offline** - Jangan membuang tab saat jaringan tidak tersedia
- **Mode hanya-idle** - Hanya membongkar tab secara otomatis saat komputer dalam keadaan idle
- **Mode Daya** - Profil hemat baterai, normal, atau performa tinggi
- **Notifikasi pembongkaran otomatis** - Terima notifikasi saat tab dibongkar
- **Tooltip memori** - Arahkan kursor ke statistik untuk melihat estimasi RAM yang dihemat per tab
- **Wizard penyiapan** - Penyiapan interaktif multi-langkah saat pertama kali dijalankan
- **Laporan kesalahan opsional** - Laporan kerusakan anonim melalui Sentry (nonaktif secara default) ditambah pengiriman laporan bug secara manual
- **Buka log perubahan otomatis** - Membuka catatan rilis pada pembaruan minor/major
- **Izin host opsional** - Perlindungan formulir hanya meminta akses saat diaktifkan
- **Tampilan penggunaan RAM** - Persentase RAM langsung di header popup
- **Statistik** - Lacak jumlah tab yang dibongkar dan memori yang dihemat
- **Multi-bahasa** - Mendukung 11 bahasa

## Pintasan Keyboard

| Pintasan      | Tindakan                        |
| ------------- | ------------------------------- |
| `Alt+Shift+D` | Membongkar tab saat ini         |
| `Alt+Shift+O` | Membongkar tab lainnya          |
| `Alt+Shift+→` | Membongkar tab di sebelah kanan |
| `Alt+Shift+←` | Membongkar tab di sebelah kiri  |

## Instalasi

### Dari Kode Sumber

1. Clone repositori ini
2. Buka `chrome://extensions` di Chrome
3. Aktifkan "Mode pengembang" (kanan atas)
4. Klik "Muat ekstensi yang belum dikemas"
5. Pilih folder proyek

### Dari Chrome Web Store

[Instal TabRest dari Chrome Web Store](https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib).

## Cara Kerja

TabRest menggunakan API native `chrome.tabs.discard()` milik Chrome untuk membongkar tab. Tab yang dibuang:

- Tetap terlihat di bilah tab
- Mempertahankan posisi gulir dan data formulir
- Dimuat ulang seketika saat diklik
- Membebaskan memori saat tidak aktif

## Struktur Proyek

```text
tabrest/
├── manifest.json           # Konfigurasi ekstensi (MV3)
├── _locales/               # Terjemahan i18n (en, vi)
├── src/
│   ├── background/         # Modul service worker
│   ├── content/            # Form checker, YouTube tracker
│   ├── popup/              # UI popup / panel samping
│   ├── options/            # Halaman pengaturan
│   ├── pages/              # Onboarding, log perubahan
│   └── shared/             # Utilitas bersama
├── icons/                  # Ikon ekstensi
├── website/                # Situs dokumentasi Astro (tabrest.ohnice.app)
└── docs/                   # Dokumentasi proyek
```

## Pengembangan

```bash
pnpm install          # Instal dependensi
pnpm run lint         # Periksa kode dengan Biome
pnpm run lint:fix     # Perbaiki masalah lint secara otomatis
pnpm run format       # Format kode
pnpm run ci           # Jalankan CI lengkap (validate + lint)
```

## Aset Promosi

Gambar promosi Chrome Web Store tersedia di `assets/` sebagai sumber SVG.

```bash
./scripts/generate-promo-images.sh   # Buat file PNG
```

## Privasi

- Tidak ada pengumpulan data
- Tidak ada server eksternal
- Semua pengaturan disimpan secara lokal
- Lihat [Kebijakan Privasi](docs/privacy-policy.md)

## Sponsor

Jika Anda merasa ekstensi ini bermanfaat, pertimbangkan untuk mendukung pengembangannya:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Support-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Support-ae2070)](https://me.momo.vn/khuong)

## Proyek Lainnya

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - Ekstensi lintas browser yang menyempurnakan antarmuka GitHub dengan fitur-fitur produktivitas
- [Termote](https://github.com/lamngockhuong/termote) - Alat CLI pengendali jarak jauh (Claude Code, GitHub Copilot, terminal apa pun) dari perangkat mobile/desktop melalui PWA

## Lisensi

MIT

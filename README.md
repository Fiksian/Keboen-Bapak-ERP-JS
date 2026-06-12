# Keboen Bapak ERP

[![Node.js](https://img.shields.io/badge/node-js-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/orm-prisma-indigo)](https://www.prisma.io/)

**Keboen Bapak ERP** adalah sistem manajemen sumber daya perusahaan (ERP) yang dirancang khusus untuk digitalisasi operasional pertanian atau perkebunan. Proyek ini dibangun menggunakan ekosistem JavaScript untuk memberikan performa yang cepat dan kemudahan pengembangan.

---

## Fitur Utama

  -  Dashboard: Visualisasi data statistik sensor dan ringkasan operasional.

  -  Manajemen Kandang (Pengadaan Sapi)

      -  Pelacakan sapi per individu dengan RFID/EID.

      -  Import data sapi dari Excel (eartag, bobot awal, jenis sapi).

      -  Riwayat bobot (beli, terima, grading, panen), kesehatan, vaksinasi, HPP per ekor, transfer antar kandang.

      -  Analisis bobot (Grading Week 7 hari, susut transit & grading, proyeksi ADG/DWG).

  -  Pengadaan Barang

      -  Delivery Order (DO) dan Purchase Order (PO) dengan approval 2-4 tahap.

      -  Penerimaan barang (Arrival) dengan unggah dokumen, timbangan (Gross/Tare/Refraksi/Netto).

      -  STTB (Surat Tanda Terima Barang) approval 4 tahap (QC, Admin, Supervisor, Manager) + penentuan gudang.

  -  Manajemen Pakan

      -  Formulasi ransum dari stok gudang.

      -  Jadwal pakan harian per kandang.

      -  Catat konsumsi, waste, dan pengurangan stok bahan baku secara FIFO.

  -  Manajemen Produksi

      -  Batch produksi dengan Bill of Materials (BOM).

      -  Alokasi batch bahan baku FIFO (otomatis/manual).

      - Approval 4 tahap (QC Prod → Admin → Supervisor → Manager).

      - Hitung HPP/unit dan rendemen.

  -  Manajemen Penjualan

      - Penjualan barang dengan FIFO batch allocation, approval 4 tahap.

      - Penjualan sapi: pilih sapi dari kandang, input bobot & harga, invoice otomatis.

      - Mode penjualan langsung (Direct) tanpa approval.

      - Pengiriman (surat jalan, status lacak).

  -  Manajemen Keuangan

      - Catat pemasukan/pengeluaran, ringkasan saldo, cetak bukti.

  -  Manajemen Stok

      - Multi-gudang, konversi satuan, pelacakan batch FIFO, detail batch, alert stok kritis.

  -  Laporan & Analitik

      - Dashboard BI (neraca, pendapatan, pengeluaran, alert stok, grafik produksi, log aktivitas).

      - Ekspor ke Excel dengan formula (Netto = Qty - Qty × Refraksi).

      - Ekspor ke CSV.

  -  Manajemen Staf & Kontak

      - Staf: foto, NIK, alamat, jabatan, role.

      - Kontak: customer/supplier dengan dukungan perusahaan & PIC.

  -  Cuaca & Lingkungan

      - Data real-time dari Open-Meteo, prakiraan 7 hari, grafik suhu 24 jam.

  -  Tugas & Notifikasi

      - Tugas dengan prioritas, penanggung jawab, status selesai.

      - Pusat notifikasi.

  -  Histori Aktivitas (Audit Trail)

      - Catat semua pergerakan stok dan perubahan data penting.

  -  Pengaturan Role & Izin

      - Buat/hapus role kustom, atur izin per modul melalui antarmuka visual.

---

## Infrastruktur yang Digunakan

- **Runtime**: [Node.js](https://nodejs.org/)
- **Frontend**: [Next.js](https://nextjs.org/)
- **Backend**: [Next.js](https://nextjs.org/)
- **Authentication**: [NextAuth.js]
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database Engine**: [PostgreSQL 15](https://www.postgresql.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/)
- **Infrastructure**: [Docker](https://www.docker.com/) & [Nginx Reverse Proxy](https://www.nginx.com/)

---

## Referensi
- Dashboard
  ![Dashboard](public/Referensi_Images/Dashboard/Dashboard.png) 

- Staff
  ![Staff](public/Referensi_Images/Staff/Staff.png)

- Cuaca
  ![Cuaca](public/Referensi_Images/Cuaca/Cuaca.png)

- Kandang
  ![Kandang](public/Referensi_Images/Pengadaan%20Sapi/Kandang/Kandang.png)

- Warehouse
  ![Warehouse](public/Referensi_Images/Warehouse/Warehouse.png)

---

## Instalasi

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di mesin lokal Anda:

1. **Clone repositori ini:**
   ```bash
   git clone [https://github.com/Fiksian/Keboen-Bapak-ERP-JS.git](https://github.com/Fiksian/Keboen-Bapak-ERP-JS.git)
   cd Keboen-Bapak-ERP-JS

2. **Instal Depedensi:**
   ```bash
   npm install

3. **Instal Postgresql**
   Pastikan PostgreSQL sudah terinstal dan berjalan di sistem Anda, kemudian lakukan langkah berikut:
    #### Masuk ke PostgreSQL
    Buka terminal Anda dan masuk sebagai *superuser* (`postgres`):
    ```bash
    psql -U postgres
    ```
    *Catatan: Masukkan password administrator PostgreSQL Anda jika diminta.*

    #### Konfigurasi Database (SQL Prompt)
    Setelah berhasil masuk dan melihat *prompt* `postgresql`, jalankan perintah SQL berikut satu per satu:

    1. **Membuat Database Baru**
      ```sql
      CREATE DATABASE nama_database_anda;
      ```

    2. **Membuat User dan Password Baru**
      ```sql
      CREATE USER nama_user_anda WITH ENCRYPTED PASSWORD 'password_anda';
      ```

    3. **Memberikan Hak Akses User ke Database**
      ```sql
      GRANT ALL PRIVILEGES ON DATABASE nama_database_anda TO nama_user_anda;
      ```

    #### Keluar dari PostgreSQL
    Setelah semua perintah SQL di atas selesai dieksekusi, keluar dari PostgreSQL dengan perintah:
    ```postgres
    \q
    ```

4. **Mempersiapakan file .env**
   ```bash
    <!-- # Buat file environment dari template (jika ada) atau buat baru -->
    touch .env

    <!-- # Isi .env dengan kredensial database Anda, contoh: -->
    DATABASE_URL="postgresql://USER:PASSWORD@localhost:port/nama_database"
    NEXTAUTH_SECRET="rahasia_super_kuat_anda"
    NEXTAUTH_URL="http://localhost:3000"

5. **Instal Prisma ORM**
   ```bash
    <!-- Instal Prisma CLI sebagai devDependency -->
    npm install prisma --save-dev

    <!-- Instal Prisma Client untuk digunakan di dalam kode aplikasi -->
    npm install @prisma/client

6. **Persiapan Prisma**
   ```bash
    <!-- 1. Inisialisasi Prisma (akan membuat folder 'prisma' dan file 'schema.prisma') -->
    npx prisma init

    <!-- 2. Sinkronisasi Skema ke Database -->
    <!-- Perintah ini akan membaca file schema.prisma dan menerapkannya ke PostgreSQL -->
    npx prisma db push

    <!-- 3. Generate Client -->
    <!-- Perintah ini untuk memperbarui fungsi autocomplete (IntelliSense) di VS Code Anda -->
    npx prisma generate

    <!-- 4. Migrasi Format data -->
    <!-- Perintah ini digunakan untuk melakukan migrasi prisma untuk membentuk format data didatabase -->
    npx prisma migrate dev

    <!-- 5. Menggunakan Seed -->
    <!-- Perintah ini untuk menambahkan data yang dimasukan diawal setelah migrasi untuk memasukan semua data awal atau master data -->
    npx prisma db seed

    <!-- 6. (Opsional) Membuka Prisma Studio -->
    <!-- Gunakan ini jika ingin melihat isi database melalui antarmuka web yang rapi -->
    npx prisma studio

---

## **Menjalankan Projek dalam mode Development**
   ```bash
   npm run dev 
   ```

Akses aplikasi di *http://localhost:3000*

---
## **Authentication & Authorization**

**Roles overview**

| Role | Description |
| :--- | :--- |
| **SuperAdmin** | Full system access, can manage roles and any module. |
| **Admin** | Approve STTB (admin stage), manage staff, finance, procurement, warehouse. |
| **Supervisor** | Approve STTB (supervisor stage), supervise production, sales. |
| **Manager** | Final approval for STTB (goods & cattle), select warehouse, final approval for production & sales. |
| **Staff** | Read-only access to most modules, can create PO, record arrivals (with approval). |
| **Custom** | Any role created via Role Settings page with toggled module permissions. |

    withPermission(Component, permissionId) – HOC for page‑level protection.
    usePermission() – hook for conditional rendering inside components.
    Permissions are stored in the database and fetched via /api/auth/roles.

---

## API Endpoints Overview

Berikut adalah daftar endpoint API utama yang dikelompokkan berdasarkan modul sistem:

### Autentikasi & Peran
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Registrasi pengguna baru |
| **POST** | `/api/auth/forget/check-user` | Cek pengguna untuk lupa password |
| **POST** | `/api/auth/forget/reset-direct` | Reset password langsung |
| **GET** | `/api/auth/roles` | Ambil daftar peran (*roles*) |
| **POST** | `/api/auth/roles` | Simpan izin/hak akses peran |

### Kontak
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/contacts` | Ambil semua data kontak |
| **POST** | `/api/contacts` | Tambah kontak baru |
| **DELETE** | `/api/contacts` | Hapus data kontak |

### Keuangan
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/finance` | Ambil data keuangan |
| **POST** | `/api/finance` | Tambah catatan keuangan |
| **DELETE** | `/api/finance` | Hapus catatan keuangan |

### Pakan (Feeding)
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/feeding/ration` | Ambil data ransum pakan |
| **POST** | `/api/feeding/ration` | Tambah racikan ransum pakan |
| **GET** | `/api/feeding/schedule` | Ambil jadwal pemberian pakan |
| **POST** | `/api/feeding/schedule` | Tambah jadwal pemberian pakan |
| **GET** | `/api/feeding/consumption` | Ambil data konsumsi pakan |
| **POST** | `/api/feeding/consumption` | Catat konsumsi pakan harian |

### Stok & Gudang
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/stock` | Ambil daftar stok |
| **POST** | `/api/stock` | Tambah stok baru |
| **PATCH** | `/api/stock/{id}` | Update sebagian data stok berdasarkan ID |
| **DELETE** | `/api/stock/{id}` | Hapus data stok berdasarkan ID |
| **GET** | `/api/stock/batch` | Ambil data stok berdasarkan batch |
| **GET** | `/api/warehouse` | Ambil daftar gudang |

### Pengadaan Barang (Purchasing Goods)
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/purchasing` | Ambil daftar pengadaan barang |
| **POST** | `/api/purchasing` | Buat pengadaan barang baru |
| **PATCH** | `/api/purchasing/{id}/approve` | Persetujuan (*approval*) pengadaan barang |
| **DELETE** | `/api/purchasing/{id}` | Batalkan/hapus pengadaan barang |
| **GET** | `/api/delivery-order` | Ambil daftar Surat Jalan / Delivery Order (DO) |
| **POST** | `/api/delivery-order` | Buat Delivery Order baru |
| **PATCH** | `/api/delivery-order/{id}` | Update Delivery Order berdasarkan ID |
| **DELETE** | `/api/delivery-order/{id}` | Hapus Delivery Order |
| **POST** | `/api/delivery-order/{id}/create-po` | Generate Purchase Order (PO) dari DO |
| **GET** | `/api/sttb` | Ambil daftar STTB (Surat Tanda Terima Barang) |
| **POST** | `/api/sttb` | Buat STTB baru |
| **PATCH** | `/api/sttb/{id}/approve` | Persetujuan (*approval*) STTB barang |

### Pengadaan & Manajemen Sapi
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/cattle/import-rfid` | Ambil data import RFID sapi |
| **POST** | `/api/cattle/import-rfid` | Unggah/import data RFID sapi baru |
| **GET** | `/api/cattle/purchasing` | Ambil daftar pengadaan sapi |
| **POST** | `/api/cattle/purchasing` | Buat pengadaan sapi baru |
| **PATCH** | `/api/cattle/purchasing/{id}/approve` | Persetujuan (*approval*) pengadaan sapi |
| **DELETE** | `/api/cattle/purchasing/{id}` | Batalkan/hapus pengadaan sapi |
| **GET** | `/api/cattle/delivery-order` | Ambil DO pengadaan sapi |
| **POST** | `/api/cattle/delivery-order` | Buat DO pengadaan sapi baru |
| **PATCH** | `/api/cattle/delivery-order/{id}` | Update DO pengadaan sapi |
| **DELETE** | `/api/cattle/delivery-order/{id}` | Hapus DO pengadaan sapi |
| **POST** | `/api/cattle/delivery-order/{id}/create-po` | Generate PO dari DO sapi |
| **POST** | `/api/cattle/arrival` | Catat kedatangan sapi (*arrival*) |
| **GET** | `/api/cattle/arrival` | Ambil riwayat kedatangan sapi |
| **GET** | `/api/cattle/arrival/{id}/trucks` | Ambil info truk pengangkut berdasarkan ID kedatangan |
| **GET** | `/api/cattle/cattleSttb` | Ambil daftar STTB khusus sapi |
| **POST** | `/api/cattle/cattleSttb` | Buat STTB sapi baru |
| **PATCH** | `/api/cattle/cattleSttb/{id}/approve` | Persetujuan (*approval*) STTB sapi |
| **GET** | `/api/cattle/{id}` | Ambil detail informasi sapi berdasarkan ID |
| **POST** | `/api/cattle/{id}/weight` | Catat penimbangan berat sapi |
| **POST** | `/api/cattle/{id}/health` | Catat pemeriksaan kesehatan sapi |
| **POST** | `/api/cattle/{id}/medication` | Catat pemberian obat/vaksin sapi |
| **POST** | `/api/cattle/{id}/hpp` | Hitung/simpan HPP (Harga Pokok Penjualan) sapi |
| **POST** | `/api/cattle/{id}/transfer` | Catat mutasi/transfer sapi antar kandang |
| **GET** | `/api/cattle/batch/stock-summary` | Ambil ringkasan stok sapi per batch |
| **GET** | `/api/cattle/breeds` | Ambil daftar jenis/ras sapi |

### Penjualan (Sales)
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/sales/barang` | Ambil daftar penjualan barang/komoditas |
| **POST** | `/api/sales/barang` | Buat transaksi penjualan barang baru |
| **PATCH** | `/api/sales/barang/{id}/approve` | Persetujuan (*approval*) penjualan barang |
| **DELETE** | `/api/sales/barang` | Hapus/batalkan penjualan barang |
| **GET** | `/api/sales/cattle` | Ambil daftar penjualan sapi |
| **POST** | `/api/sales/cattle` | Buat transaksi penjualan sapi baru |
| **PATCH** | `/api/sales/cattle/{id}/approve` | Persetujuan (*approval*) penjualan sapi |
| **POST** | `/api/sales/cattle/{id}/delivery` | Catat pengiriman (*delivery*) sapi yang terjual |
| **PATCH** | `/api/sales/cattle/{id}/delivery` | Update data pengiriman sapi |
| **GET** | `/api/sales/cattle/price-history` | Ambil riwayat perkembangan harga sapi |

### Produksi
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/production` | Ambil data aktivitas produksi |
| **POST** | `/api/production` | Mulai/catat aktivitas produksi baru |
| **PATCH** | `/api/production/{id}/approve` | Persetujuan (*approval*) hasil produksi |

### Laporan (Reports)
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/report/dashboard?range=Daily\|Weekly\|Monthly` | Ambil data analitik dashboard berdasarkan rentang waktu |

###  Staf & Tugas (Staff & Tasks)
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/staff` | Ambil daftar semua staf |
| **POST** | `/api/staff` | Tambah data staf baru |
| **GET** | `/api/staff/me` | Ambil profil data diri staf yang sedang login |
| **PATCH** | `/api/staff/{id}` | Update informasi staf berdasarkan ID |
| **DELETE** | `/api/staff/{id}` | Hapus data akun staf |
| **GET** | `/api/tasks` | Ambil daftar tugas (*task management*) |
| **POST** | `/api/tasks` | Buat/tugaskan pekerjaan baru |
| **PATCH** | `/api/tasks/{id}` | Update status atau detail tugas |
| **DELETE** | `/api/tasks/{id}` | Hapus daftar tugas |

### Histori
| Method | Endpoint | Deskripsi / Aksi |
| :--- | :--- | :--- |
| **GET** | `/api/history` | Ambil log riwayat aktivitas sistem (*audit logs*) |



---


#### © 2026 Keboen Bapak – All Rights Reserved.
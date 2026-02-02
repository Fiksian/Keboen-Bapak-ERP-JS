# Keboen Bapak ERP (JavaScript Version) 🌿

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)](https://nodejs.org/)
[![Docker Support](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/orm-prisma-indigo)](https://www.prisma.io/)

**Keboen Bapak ERP** adalah sistem manajemen sumber daya perusahaan (ERP) yang dirancang khusus untuk digitalisasi operasional pertanian atau perkebunan. Proyek ini dibangun menggunakan ekosistem JavaScript untuk memberikan performa yang cepat dan kemudahan pengembangan.

---

## 🚀 Fitur Utama

- **Dashboard Real-time**: Visualisasi data statistik sensor.
- **Manajemen Inventaris**: Pantau stok peralatan secara akurat.
- **Pencatatan Keuangan**: Catat arus kas masuk dan keluar dari hasil panen atau biaya operasional.
- **Manajemen Lahan**: Lacak jadwal dan hasil produksi per blok lahan.
---

## 🛠️ Teknologi yang Digunakan

- **Runtime**: Node.js
- **Frontend**: [Next.js]
- **Backend**: [Masih Pengembangan]
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database Engine**: [PostgreSQL 15](https://www.postgresql.org/)
- **Styling**: [Tailwind CSS] (https://tailwindcss.com/) & [Lucide React](https://lucide.dev/)
- **Infrastructure**: [Docker](https://www.docker.com/) & [Nginx Reverse Proxy](https://www.nginx.com/)

## Referensi
- Dashboard
  ![Dashboard](public/Referensi_Images/Dashboard.png)

- Staff
  ![StaffManager](public/Referensi_Images/Staff_Management.png)

- Tasks
  ![UpcomingTasks](public/Referensi_Images/Upcoming_Tasks.png)

- Kandang
  ![Kandang](public/Referensi_Images/Kandang.png)

- Stock
  ![Stock](public/Referensi_Images/Stock.png)

- Purchasing
  ![Purchasing](public/Referensi_Images/Purchasing.png)

- Cuaca
  ![Cuaca](public/Referensi_Images/Cuaca.png)

- Report
  ![Report-1](public/Referensi_Images/Report-1.png)
  ![Report-2](public/Referensi_Images/Report-2.png)

- Notifications
  ![Notifications](public/Referensi_Images/Notifications.png)




---

## 📦 Instalasi

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
   ```bash
    <!-- # Buat file environment dari template (jika ada) atau buat baru -->
    touch .env

    <!-- # Isi .env dengan kredensial database Anda, contoh: -->
    DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/keboen_db"
    NEXTAUTH_SECRET="rahasia_super_kuat_anda"
    NEXTAUTH_URL="http://localhost:3000"

4. **Instal Prisma ORM**
   ```bash
    <!-- Instal Prisma CLI sebagai devDependency -->
    npm install prisma --save-dev

    <!-- Instal Prisma Client untuk digunakan di dalam kode aplikasi -->
    npm install @prisma/client

5. **Persiapan Prisma**
   ```bash
    <!-- 1. Inisialisasi Prisma (akan membuat folder 'prisma' dan file 'schema.prisma') -->
    npx prisma init

    <!-- 2. Sinkronisasi Skema ke Database -->
    <!-- Perintah ini akan membaca file schema.prisma dan menerapkannya ke PostgreSQL -->
    npx prisma db push

    <!-- 3. Generate Client -->
    <!-- Perintah ini untuk memperbarui fungsi autocomplete (IntelliSense) di VS Code Anda -->
    npx prisma generate

    <!-- 4. (Opsional) Membuka Prisma Studio -->
    <!-- Gunakan ini jika ingin melihat isi database melalui antarmuka web yang rapi -->
    npx prisma studio

## **Menjalankan Projek dalam mode Development**
   ```bash
   npm run dev

import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { emit: 'stdout', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
      { emit: 'stdout', level: 'info' },
    ],
  });
};

const globalForPrisma = globalThis;

/** @type {PrismaClient} */
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

(async () => {
  try {
    await prisma.$connect();
    console.log("🟢 [DATABASE] Berhasil terhubung ke PostgreSQL via Prisma 6");
  } catch (err) {
    console.error("🔴 [DATABASE] Koneksi Gagal!");
    console.error("- Pesan Error:", err.message);
    console.error("- Periksa apakah PostgreSQL di Arch Linux sudah aktif (systemctl status postgresql)");
  }
})();
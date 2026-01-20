const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@keboenbapak.com";
  const adminUsername = "admin";
  const adminPassword = "password123";

  console.log('--- Memulai Proses Seeding ---');
  
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Upsert User (Buat jika belum ada)
      const user = await tx.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          role: "Admin",
        },
      });

      // 2. Upsert Profil Staff (ID disamakan dengan User.id)
      await tx.staff.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
          id: user.id, // Menyamakan ID
          email: adminEmail,
          firstName: "Super",
          lastName: "Admin",
          gender: "Male",
          staffId: "ADM-001",
          role: "Admin",
          designation: "System Administrator",
        },
      });
    });

    console.log('✅ Seed Berhasil!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
  } catch (error) {
    console.error('❌ Gagal melakukan seeding:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
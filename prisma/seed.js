const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@keboenbapak.com";
  const adminUsername = "Admin";
  const adminPassword = "123456";

  console.log('--- Memulai Proses Seeding ---');
  
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    await prisma.$transaction(async (tx) => {
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

      await tx.staffs.upsert({
        where: { email: adminEmail },
        update: { updatedAt: new Date() },
        create: {
          id: user.id,
          email: adminEmail,
          firstName: "Super",
          lastName: "Admin",
          gender: "Male",
          staffId: "ADM-001",
          role: "Admin",
          designation: "System Administrator",
          updatedAt: new Date(),
        },
      });

      await tx.purchasing.upsert({
        where: { noPO: 'PO-2026-SEED-01' },
        update: {},
        create: {
          noPO: 'PO-2026-SEED-01',
          item: 'PAKAN AYAM A1',
          qty: 1000,    
          unit: 'KG',
          price: '10000000',
          category: 'Feed',
          requestedBy: 'System',
          status: 'PENDING',
        },
      });

      console.log('✅ Seed Admin, Staff, dan Purchasing Berhasil!');
    });

  } catch (error) {
    console.error('❌ Gagal melakukan seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
const { PrismaClient, PurchaseStatus, ContactType, ProductionStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@keboenbapak.com";
  const adminUsername = "Admin";
  const adminPassword = "123456";

  const testUsers = [
    {
      email: "staff1@test.com",
      username: "Staff_Satu",
      password: "password123",
      role: "Staff",
      firstName: "Test",
      lastName: "Staff One",
      staffId: "STF-001",
    },
    {
      email: "staff2@test.com",
      username: "Staff_Dua",
      password: "password123",
      role: "Staff",
      firstName: "Test",
      lastName: "Staff Two",
      staffId: "STF-002",
    },
  ];

  console.log('--- Memulai Proses Seeding ERP Keboen Bapak ---');

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    await prisma.$transaction(async (tx) => {

      const user = await tx.user.upsert({
        where: { email: adminEmail },
        update: { password: hashedPassword },
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

      for (const testData of testUsers) {
        const hashedTestPassword = await bcrypt.hash(testData.password, 10);

        const testUser = await tx.user.upsert({
          where: { email: testData.email },
          update: { password: hashedTestPassword },
          create: {
            username: testData.username,
            email: testData.email,
            password: hashedTestPassword,
            role: testData.role,
          },
        });

        await tx.staffs.upsert({
          where: { email: testData.email },
          update: { updatedAt: new Date() },
          create: {
            id: testUser.id,
            email: testData.email,
            firstName: testData.firstName,
            lastName: testData.lastName,
            gender: "Male",
            staffId: testData.staffId,
            role: testData.role,
            designation: "Testing Account",
            updatedAt: new Date(),
          },
        });
      }

      await tx.contact.upsert({
        where: { email: 'supplier.pakan@email.com' },
        update: {},
        create: {
          name: 'PT Pakan Jaya',
          type: ContactType.SUPPLIER,
          email: 'supplier.pakan@email.com',
          phone: '021-555666',
          address: 'Kawasan Industri Jakarta',
        },
      });

      await tx.contact.upsert({
        where: { email: 'customer1@email.com' },
        update: {},
        create: {
          name: 'Toko Berkah Telur',
          type: ContactType.CUSTOMER,
          email: 'customer1@email.com',
          phone: '0812999000',
          address: 'Pasar Minggu, Jakarta',
        },
      });

      await tx.stock.upsert({
        where: { name: 'Pakan Ayam Starter' },
        update: {},
        create: {
          name: 'Pakan Ayam Starter',
          category: 'Feed',
          stock: 500,
          unit: 'KG',
          type: 'STOCKS',
          price: '15000',
        },
      });

      const existingPO = await tx.purchasing.findFirst({
        where: { noPO: 'PO-2026-001' },
      });

      if (!existingPO) {
        await tx.purchasing.create({
          data: {
            noPO: 'PO-2026-001',
            item: 'Pakan Ayam Starter',
            qty: 1000,
            unit: 'KG',
            price: '1000000',
            category: 'Feed',
            supplier: 'PT Pakan Jaya',
            requestedBy: 'Admin',
            status: PurchaseStatus.PENDING,
          },
        });
      }

      await tx.production.upsert({
        where: { noBatch: 'BATCH-001' },
        update: {},
        create: {
          noBatch: 'BATCH-001',
          productName: 'Telur Ayam Grade A',
          targetQty: 100,
          status: ProductionStatus.SCHEDULLING,
          createdBy: 'Admin',
          components: {
            create: [
              { itemName: 'Pakan Ayam Starter', qtyNeeded: 50, unit: 'KG' },
            ],
          },
        },
      });

      const existingTask = await tx.task.findFirst({
        where: { title: 'Cek kesehatan ayam kandang A' },
      });

      if (!existingTask) {
        await tx.task.create({
          data: {
            title: 'Cek kesehatan ayam kandang A',
            time: '08:00',
            priority: 'High',
            category: 'Maintenance',
            assignee: 'Admin',
          },
        });
      }

      const existingTrx = await tx.transaction.findFirst({
        where: { trxNo: 'TRX-INIT-2026' },
      });

      if (!existingTrx) {
        await tx.transaction.create({
          data: {
            trxNo: 'TRX-INIT-2026',
            category: 'Modal Awal',
            amount: 50000000,
            type: 'INCOME',
            method: 'BANK TRANSFER',
            createdBy: 'Admin',
            description: 'Saldo awal operasional keboen bapak',
          },
        });
      }

      console.log('✅ Seeding Selesai: Semua data berhasil dibuat.');
    });
  } catch (error) {
    console.error('❌ Gagal melakukan seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
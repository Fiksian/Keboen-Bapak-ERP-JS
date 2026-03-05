const { PrismaClient, ContactType} = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@keboenbapak.com";
  const adminUsername = "Admin";
  const adminPassword = "123456";

  const testUsers = [
    {
      email: "staff1@test.com",
      username: "staff_satu",
      password: "password123",
      role: "Staff",
      firstName: "Test",
      lastName: "Staff One",
      staffId: "STF-001",
    },
    {
      email: "staff2@test.com",
      username: "staff_dua",
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

      console.log('📡 Seeding Role Permissions...');
      const roles = [
        {
          roleName: 'Admin',
          permissions: ['dashboard', 'cuaca', 'report', 'staff', 'contacts', 'tasks', 'kandang', 'produksi', 'arrival', 'warehouse', 'purchasing', 'penjualan', 'finance', 'history']
        },
        {
          roleName: 'Staff',
          permissions: ['dashboard', 'tasks', 'kandang', 'produksi']
        },
        {
          roleName: 'Owner',
          permissions: ['*']
        }
      ];

      for (const role of roles) {
        await tx.rolePermission.upsert({
          where: { roleName: role.roleName },
          update: { permissions: role.permissions },
          create: role,
        });
      }

      console.log('👤 Seeding Users & Staffs...');
      const user = await tx.user.upsert({
        where: { email: adminEmail },
        update: { password: hashedPassword, role: "Admin" },
        create: {
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          role: "Admin",
        },
      });

      await tx.staffs.upsert({
        where: { email: adminEmail },
        update: { updatedAt: new Date(), role: "Admin" },
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
          update: { password: hashedTestPassword, role: testData.role },
          create: {
            username: testData.username,
            email: testData.email,
            password: hashedTestPassword,
            role: testData.role,
          },
        });

        await tx.staffs.upsert({
          where: { email: testData.email },
          update: { updatedAt: new Date(), role: testData.role },
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

      console.log('📞 Seeding Contacts...');
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
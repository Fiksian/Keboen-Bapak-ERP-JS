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
      username: "sali",
      password: "Kebun2026!",
      role: "Staff",
      firstName: "Test",
      lastName: "Staff One",
      staffId: "STF-001",
    },
  ];

  console.log('--- Memulai Proses Seeding ERP Keboen Bapak ---');

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    await prisma.$transaction(async (tx) => {

      console.log('📦 Seeding Warehouses...');
      const warehouses = [
        { id: 'wh-a', name: 'Warehouse A', code: 'WH-A', address: 'Ciparay, Bandung' },
        { id: 'wh-b', name: 'Warehouse B', code: 'WH-B', address: 'Baleendah, Bandung' }
      ];

      for (const wh of warehouses) {
        await tx.warehouse.upsert({
          where: { id: wh.id },
          update: { name: wh.name, code: wh.code, address: wh.address },
          create: wh,
        });
      }

      console.log('👤 Seeding Admin...');
      const adminUser = await tx.user.upsert({
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
          id: adminUser.id,
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

      console.log('👥 Seeding Test Users...');
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

      const bahanBakuMakro = [
        "Dedak", "Polard", "Bungkil Kedelai", "Bungkil Kelapa", "Bungkil Sawit", 
        "Onggok", "Gaplek", "Menir Jagung", "Kulit Kopi", "Molases", "Kulit Coklat", 
        "CGF", "Biskuit", "Roti Giling", "Sekam Giling", "DDGS", "Ampas Kecap", 
        "Habbatussauda", "Bungkil Abede", "Millet Putih", "Dust Pollard", "CGF Lokal", 
        "Janggel Jagung Giling", "Jagung Pipil", "Homini Jagung", "Ampas Gandum", 
        "Kulit Kacang Tanah", "Separator", "CSL"
      ];

      const bahanBakuMikro = [
        "CaCO3 (Kapur)", "Urea", "Garam", "PREMIX", "Sydpro", "Natura", "GAA", 
        "BEC Premix Advance", "T-Fibre Premix", "Betafine", "ESS 40", "DCP", 
        "FINISHER", "Calsea Powder", "Socalphost", "PREMIX AJO - 01", "LIPTOMOLD", 
        "Nutrigromos", "Betaine Hydrocil", "FENANZA", "BEC Premix Base", 
        "Organic Chrome", "Lagantor ZDI 2", "Sodium Bicarbonat", "Premix Rum CST FPT", 
        "Premix XPC", "CMR Dufafeed", "Paragin", "Amonium Sulfate", 
        "BEC MIX BEEF BASE PLUS", "PSE-300 BASEMIX RUMINANT-AG", "PERFORMAX STARTER", 
        "PERFORMAX GROWER", "BIOZIM", "PERFORMAX FINISHER", "SELENOMETHIONIN", 
        "suenzym"
      ];

      const bahanBakuHijauan = ["SILASE"];

      console.log('🌾 Seeding Stocks: Bahan Baku...');
      const allBahanBaku = [
        ...bahanBakuMakro.map(n => ({ name: n.toUpperCase(), cat: 'MAKRO' })),
        ...bahanBakuMikro.map(n => ({ name: n.toUpperCase(), cat: 'MIKRO' })),
        ...bahanBakuHijauan.map(n => ({ name: n.toUpperCase(), cat: 'HIJAUAN' }))
      ];

      for (const item of allBahanBaku) {
        await tx.stock.upsert({
          where: { 
            name_warehouseId: { 
              name: item.name, 
              warehouseId: 'wh-a'
            } 
          },
          update: {},
          create: {
            name: item.name,
            category: item.cat,
            stock: 0,
            unit: 'KG',
            type: 'STOCKS',
            price: '0',
            warehouseId: 'wh-a',
          },
        });
      }

      console.log('📝 Seeding Tasks...');
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
            assignee: adminUsername,
          },
        });
      }

      console.log('💰 Seeding Transactions...');
      const existingTrx = await tx.transaction.findFirst({
        where: { trxNo: 'TRX-INIT-2026' },
      });

      if (!existingTrx) {
        await tx.transaction.create({
          data: {
            trxNo: 'TRX-INIT-2026',
            category: 'Modal Awal',
            amount: 50000000.0,
            type: 'INCOME',
            method: 'BANK TRANSFER',
            createdBy: adminUsername,
            description: 'Saldo awal operasional keboen bapak',
          },
        });
      }

      console.log('✅ Seeding Selesai: Semua data berhasil disesuaikan.');
    });
  } catch (error) {
    console.error('❌ Gagal melakukan seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
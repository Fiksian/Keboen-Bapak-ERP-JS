// prisma/seed.js
const { PrismaClient, PurchaseStatus, ContactType, ProductionStatus, CattleDOStatus, CattlePOStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@keboenbapak.com";
  const adminUsername = "Admin";
  const adminPassword = "123456";

  const testUsers = [
    {
      email: "staff1@test.com",
      username: "erpdev",
      password: "Kebun2026!",
      role: "Staff",
      firstName: "Erpdev",
      lastName: "Test Akun",
      staffId: "STF-001",
    },
  ];

  console.log('--- Memulai Proses Seeding ERP Keboen Bapak ---');

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    await prisma.$transaction(async (tx) => {

      // ──────────────────────────────────────────────────────────────────────
      // 1. SEED WAREHOUSES (Kandang untuk sapi + gudang barang)
      // ──────────────────────────────────────────────────────────────────────
      console.log('📦 Seeding Warehouses / Kandang...');
      const warehouses = [
        { id: 'wh-a', name: 'Gudang A', code: 'WH-A', address: 'Ciparay, Bandung' },
        { id: 'wh-b', name: 'Gudang B', code: 'WH-B', address: 'Baleendah, Bandung' },
        { id: 'kandang-1', name: 'Kandang Utama 1', code: 'KD-1', address: 'Blok A, Area Utara' },
        { id: 'kandang-2', name: 'Kandang Utama 2', code: 'KD-2', address: 'Blok B, Area Timur' },
        { id: 'kandang-karantina', name: 'Kandang Karantina', code: 'KDK', address: 'Area Karantina Khusus' },
      ];

      for (const wh of warehouses) {
        await tx.warehouse.upsert({
          where: { id: wh.id },
          update: { name: wh.name, code: wh.code, address: wh.address },
          create: wh,
        });
      }

      // ──────────────────────────────────────────────────────────────────────
      // 2. SEED ROLE PERMISSIONS
      // ──────────────────────────────────────────────────────────────────────
      console.log('🔐 Seeding Role Permissions...');
      const roles = ['SuperAdmin', 'Admin', 'Manager', 'Supervisor', 'Staff', 'Test'];

      const Permissions = {
        "SuperAdmin": ["*"],
        "Admin": ["dashboard", "penjualan", "produksi", "purchasing", "cattle"],
        "Manager": ["dashboard", "reports", "approval"],
        "Supervisor": ["dashboard", "production", "cattle_monitor"],
        "Staff": ["dashboard", "input_data"],
        "Test": ["dashboard"],
      };

      for (const roleName of roles) {
        await tx.rolePermission.upsert({
          where: { roleName: roleName },
          update: {},
          create: {
            roleName: roleName,
            permissions: Permissions[roleName] || [],
          },
        });
      }

      // ──────────────────────────────────────────────────────────────────────
      // 3. SEED USERS & STAFFS
      // ──────────────────────────────────────────────────────────────────────
      console.log('👤 Seeding Admin...');
      const adminUser = await tx.user.upsert({
        where: { email: adminEmail },
        update: { password: hashedPassword },
        create: {
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          role: "SuperAdmin",
        },
      });

      await tx.staffs.upsert({
        where: { email: adminEmail },
        update: { updatedAt: new Date() },
        create: {
          id: adminUser.id,
          email: adminEmail,
          firstName: "Super",
          lastName: "Admin",
          gender: "Male",
          staffId: "ADM-001",
          role: "SuperAdmin",
          designation: "System Administrator",
          image: null,
          updatedAt: new Date(),
        },
      });

      console.log('👥 Seeding Test Users...');
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
            image: null,
            updatedAt: new Date(),
          },
        });
      }

      // ──────────────────────────────────────────────────────────────────────
      // 4. SEED CONTACTS (Supplier & Customer)
      // ──────────────────────────────────────────────────────────────────────
      console.log('📞 Seeding Contacts...');
      
      const contacts = [
        { name: 'PT Pakan Jaya', type: ContactType.SUPPLIER, email: 'supplier.pakan@email.com', phone: '021-555666', address: 'Kawasan Industri Jakarta' },
        { name: 'PT Kedua', type: ContactType.SUPPLIER, email: 'test.pakan@email.com', phone: '021-132141', address: 'Jakarta' },
        { name: 'PT Sapi Unggul', type: ContactType.SUPPLIER, email: 'sapi@unggul.com', phone: '021-777888', address: 'Australia' },
        { name: 'Toko Berkah Telur', type: ContactType.CUSTOMER, email: 'customer1@email.com', phone: '0812999000', address: 'Pasar Minggu, Jakarta' },
      ];

      for (const contact of contacts) {
        await tx.contact.upsert({
          where: { email: contact.email },
          update: {},
          create: contact,
        });
      }

      // ──────────────────────────────────────────────────────────────────────
      // 5. SEED CATTLE BREEDS (Jenis Sapi)
      // ──────────────────────────────────────────────────────────────────────
      console.log('🐄 Seeding Cattle Breeds...');
      const breeds = [
        { id: 'lim', name: 'LIMOUSIN', description: 'Sapi potong asal Prancis, kualitas daging premium' },
        { id: 'sim', name: 'SIMENTAL', description: 'Sapi asal Swiss, pertumbuhan cepat' },
        { id: 'bra', name: 'BRAHMAN', description: 'Sapi impor asal Amerika, tahan panas' },
        { id: 'ang', name: 'ANGUS', description: 'Sapi premium asal Skotlandia' },
        { id: 'bx', name: 'BX', description: 'Brahman Cross Australia, persilangan unggul' },
        { id: 'wag', name: 'WAGYU', description: 'Sapi premium Jepang, marbling tinggi' },
        { id: 'ong', name: 'ONGOLE', description: 'Sapi PO lokal' },
        { id: 'cam', name: 'CAMPURAN', description: 'Campuran berbagai jenis' },
      ];

      for (const breed of breeds) {
        await tx.cattleBreed.upsert({
          where: { id: breed.id },
          update: { name: breed.name, description: breed.description },
          create: breed,
        });
      }

      // ──────────────────────────────────────────────────────────────────────
      // 6. SEED STOCKS (Barang)
      // ──────────────────────────────────────────────────────────────────────
      console.log('🌾 Seeding Stocks...');
      
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

      const pakan = ["Pakan A", "Pakan B"];
      const bahanBakuHijauan = ["SILASE"];

      const allBahanBaku = [
        ...bahanBakuMakro.map(n => ({ name: n.toUpperCase(), cat: 'MAKRO' })),
        ...bahanBakuMikro.map(n => ({ name: n.toUpperCase(), cat: 'MIKRO' })),
        ...bahanBakuHijauan.map(n => ({ name: n.toUpperCase(), cat: 'HIJAUAN' })),
        ...pakan.map(n => ({ name: n.toUpperCase(), cat: 'PAKAN' }))
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

      // ──────────────────────────────────────────────────────────────────────
      // 7. SEED TASKS
      // ──────────────────────────────────────────────────────────────────────
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

      // ──────────────────────────────────────────────────────────────────────
      // 8. SEED TRANSACTIONS
      // ──────────────────────────────────────────────────────────────────────
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
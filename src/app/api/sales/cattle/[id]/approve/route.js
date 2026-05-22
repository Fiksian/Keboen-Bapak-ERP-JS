// /app/api/sales/cattle/[id]/approve/route.js
// PATCH — Multi-stage approval untuk SalesOrder sapi
// ============================================================
// Flow (sama persis dengan penjualan/[id]/approve):
//   sales      : PENDING_SALES      → PENDING_ADMIN
//   admin      : PENDING_ADMIN      → PENDING_SUPERVISOR
//   supervisor : PENDING_SUPERVISOR → PENDING_MANAGER
//   manager    : PENDING_MANAGER    → COMPLETED
//                  → update Cattle.status = SOLD per item
//                  → create History & Transaction keuangan
//   reject     : → CANCELLED
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

// ── Generate TRX number ───────────────────────────────────────
const generateTrxNo = async (tx) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix  = `TRX-${dateStr}-`;
  const last    = await tx.transaction.findFirst({
    where  : { trxNo: { startsWith: prefix } },
    orderBy: { trxNo: 'desc' },
    select : { trxNo: true },
  });
  const next = last ? parseInt(last.trxNo.split('-').pop()) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
};

const leanOrder = (o) => ({
  id                  : o.id,
  invoiceNo           : o.invoiceNo,
  status              : o.status,
  totalAmount         : o.totalAmount,
  isCattleReleased    : o.isCattleReleased,
  salesApprovedBy     : o.salesApprovedBy,
  salesApprovedAt     : o.salesApprovedAt,
  adminApprovedBy     : o.adminApprovedBy,
  adminApprovedAt     : o.adminApprovedAt,
  supervisorApprovedBy: o.supervisorApprovedBy,
  supervisorApprovedAt: o.supervisorApprovedAt,
  managerApprovedBy   : o.managerApprovedBy,
  managerApprovedAt   : o.managerApprovedAt,
  rejectedBy          : o.rejectedBy,
  rejectedNotes       : o.rejectedNotes,
  paidAt              : o.paidAt,
});

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id }           = await params;
    const { stage, notes } = await req.json();

    const approver = session.user.name  || session.user.email;
    const role     = session.user.role;
    const now      = new Date();

    // ── Load order ─────────────────────────────────────────────
    const order = await prisma.salesOrder.findFirst({
      where  : { OR: [{ id }, { invoiceNo: id }] },
      include: {
        customer : { select: { name: true } },
        items    : { select: { id: true, rfidNo: true, cattleId: true, subTotal: true, hppPerEkor: true, finalWeightKg: true } },
      },
    });

    if (!order) return NextResponse.json({ message: 'Sales order tidak ditemukan.' }, { status: 404 });

    if (['COMPLETED', 'CANCELLED'].includes(order.status) && stage !== 'reject')
      return NextResponse.json({ message: `Order sudah ${order.status}, tidak bisa diubah.` }, { status: 400 });

    // ══════════════════════════════════════════════════════════
    // REJECT
    // ══════════════════════════════════════════════════════════
    if (stage === 'reject') {
      if (order.status === 'COMPLETED')
        return NextResponse.json({ message: 'Tidak bisa menolak order yang sudah COMPLETED.' }, { status: 400 });

      const ALLOW = ['Admin', 'Sales', 'Supervisor', 'Manager', 'SuperAdmin'];
      if (!ALLOW.includes(role))
        return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });

      const updated = await prisma.salesOrder.update({
        where : { id: order.id },
        data  : { status: 'CANCELLED', rejectedBy: approver, rejectedAt: now, rejectedNotes: notes || '' },
        select: { id: true, invoiceNo: true, status: true, rejectedBy: true, rejectedNotes: true },
      });

      prisma.history.create({ data: {
        action: 'CATTLE_SALE_REJECTED', item: order.invoiceNo, category: 'Sales Sapi', type: 'MONEY',
        quantity: order.totalAmount, unit: 'IDR', user: approver, referenceId: order.id,
        notes: `Ditolak: ${notes || '-'}`,
      }}).catch(console.error);

      return NextResponse.json({ message: `Invoice ${order.invoiceNo} ditolak.`, order: leanOrder({ ...order, ...updated }) });
    }

    // ══════════════════════════════════════════════════════════
    // STAGE 1 — Sales: PENDING_SALES → PENDING_ADMIN
    // ══════════════════════════════════════════════════════════
    if (stage === 'sales') {
      if (order.status !== 'PENDING_SALES')
        return NextResponse.json({ message: `Status harus PENDING_SALES. Saat ini: ${order.status}` }, { status: 400 });
      if (!['Sales', 'Admin', 'Supervisor', 'Manager', 'SuperAdmin'].includes(role))
        return NextResponse.json({ message: 'Akses ditolak untuk tahap Sales.' }, { status: 403 });

      const updated = await prisma.salesOrder.update({
        where : { id: order.id },
        data  : { status: 'PENDING_ADMIN', salesApprovedBy: approver, salesApprovedAt: now },
        select: { id: true, invoiceNo: true, status: true, salesApprovedBy: true },
      });
      return NextResponse.json({
        message: `Sales approved. Invoice ${order.invoiceNo} menunggu Admin.`,
        order  : leanOrder({ ...order, ...updated }),
      });
    }

    // ══════════════════════════════════════════════════════════
    // STAGE 2 — Admin: PENDING_ADMIN → PENDING_SUPERVISOR
    // ══════════════════════════════════════════════════════════
    if (stage === 'admin') {
      if (order.status !== 'PENDING_ADMIN')
        return NextResponse.json({ message: `Status harus PENDING_ADMIN. Saat ini: ${order.status}` }, { status: 400 });
      if (!['Admin', 'SuperAdmin'].includes(role))
        return NextResponse.json({ message: "Tahap Admin hanya untuk role 'Admin' atau 'SuperAdmin'." }, { status: 403 });

      const updated = await prisma.salesOrder.update({
        where : { id: order.id },
        data  : { status: 'PENDING_SUPERVISOR', adminApprovedBy: approver, adminApprovedAt: now },
        select: { id: true, invoiceNo: true, status: true, adminApprovedBy: true },
      });
      return NextResponse.json({
        message: `Admin approved. Invoice ${order.invoiceNo} menunggu Supervisor.`,
        order  : leanOrder({ ...order, ...updated }),
      });
    }

    // ══════════════════════════════════════════════════════════
    // STAGE 3 — Supervisor: PENDING_SUPERVISOR → PENDING_MANAGER
    // ══════════════════════════════════════════════════════════
    if (stage === 'supervisor') {
      if (order.status !== 'PENDING_SUPERVISOR')
        return NextResponse.json({ message: `Status harus PENDING_SUPERVISOR. Saat ini: ${order.status}` }, { status: 400 });
      if (!['Supervisor', 'SuperAdmin'].includes(role))
        return NextResponse.json({ message: 'Hanya Supervisor / SuperAdmin.' }, { status: 403 });

      const updated = await prisma.salesOrder.update({
        where : { id: order.id },
        data  : { status: 'PENDING_MANAGER', supervisorApprovedBy: approver, supervisorApprovedAt: now },
        select: { id: true, invoiceNo: true, status: true, supervisorApprovedBy: true },
      });
      return NextResponse.json({
        message: `Supervisor approved. Invoice ${order.invoiceNo} menunggu Manager.`,
        order  : leanOrder({ ...order, ...updated }),
      });
    }

    // ══════════════════════════════════════════════════════════
    // STAGE 4 — Manager: PENDING_MANAGER → COMPLETED
    //   → update Cattle.status = SOLD
    //   → create Transaction keuangan
    //   → history
    // ══════════════════════════════════════════════════════════
    if (stage === 'manager') {
      if (order.status !== 'PENDING_MANAGER')
        return NextResponse.json({ message: `Status harus PENDING_MANAGER. Saat ini: ${order.status}` }, { status: 400 });
      if (!['Manager', 'SuperAdmin'].includes(role))
        return NextResponse.json({ message: 'Hanya Manager / SuperAdmin yang bisa final approve.' }, { status: 403 });

      const result = await prisma.$transaction(async (tx) => {

        // a. Ambil cattleId dari items (bisa via rfidNo jika cattleId null)
        const cattleIds = [];
        for (const item of order.items) {
          let cid = item.cattleId;
          if (!cid && item.rfidNo) {
            const c = await tx.cattle.findFirst({ where: { rfidNo: item.rfidNo }, select: { id: true } });
            cid = c?.id || null;
          }
          if (cid) cattleIds.push(cid);
        }

        // b. Update semua Cattle yang terlibat → SOLD + keluarkan dari kandang
        if (cattleIds.length > 0) {
          await tx.cattle.updateMany({
            where: { id: { in: cattleIds } },
            data : {
              status     : 'SOLD',
              warehouseId: null,         // keluar dari kandang
              updatedAt  : now,
            },
          });
        }

        // c. Kalkulasi HPP total & margin
        const totalHpp    = order.items.reduce((s, i) => s + (i.hppPerEkor || 0), 0);
        const totalRevenue = order.items.reduce((s, i) => s + (i.subTotal || 0), 0);
        const marginTotal  = parseFloat((totalRevenue - totalHpp).toFixed(2));

        // d. Transaksi keuangan
        const trxNo = await generateTrxNo(tx);
        await tx.transaction.create({
          data: {
            trxNo,
            category   : 'Penjualan Sapi',
            description: `${order.invoiceNo} — ${order.customer?.name || 'Pembeli Umum'}`,
            amount     : order.totalAmount,
            type       : 'INCOME',
            date       : now,
            method     : order.paymentMethod || 'TRANSFER',
            createdBy  : approver,
            referenceId: order.id,
          },
        });

        // e. Update SalesOrder → COMPLETED
        const updated = await tx.salesOrder.update({
          where : { id: order.id },
          data  : {
            status           : 'COMPLETED',
            managerApprovedBy: approver,
            managerApprovedAt: now,
            paidAt           : now,
            isCattleReleased : cattleIds.length > 0,
          },
          select: {
            id: true, invoiceNo: true, status: true,
            managerApprovedBy: true, managerApprovedAt: true,
            paidAt: true, isCattleReleased: true,
          },
        });

        // f. History
        await tx.history.create({
          data: {
            action     : 'CATTLE_SALE_COMPLETED',
            item       : order.invoiceNo,
            category   : 'Sales Sapi',
            type       : 'MONEY',
            quantity   : order.totalAmount,
            unit       : 'IDR',
            user       : approver,
            referenceId: order.id,
            notes      : `COMPLETED | ${order.totalEkor} ekor | ${order.totalWeightKg} kg | Revenue: Rp ${order.totalAmount.toLocaleString('id-ID')} | HPP: Rp ${totalHpp.toLocaleString('id-ID')} | Margin: Rp ${marginTotal.toLocaleString('id-ID')} | TRX: ${trxNo}`,
          },
        });

        return { updated, trxNo, totalHpp, marginTotal, cattleReleased: cattleIds.length };
      });

      return NextResponse.json({
        message: `Invoice ${order.invoiceNo} COMPLETED. ${result.cattleReleased} ekor dilepas dari kandang.`,
        order  : leanOrder({ ...order, ...result.updated }),
        summary: {
          trxNo        : result.trxNo,
          totalHpp     : result.totalHpp,
          marginTotal  : result.marginTotal,
          cattleReleased: result.cattleReleased,
        },
      });
    }

    return NextResponse.json({
      message: 'Stage tidak dikenal. Gunakan: sales | admin | supervisor | manager | reject',
    }, { status: 400 });

  } catch (err) {
    console.error('CATTLE_SALE_APPROVE:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

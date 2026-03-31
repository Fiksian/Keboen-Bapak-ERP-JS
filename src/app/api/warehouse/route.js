import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: 'asc' }
    });
    return new Response(JSON.stringify(warehouses), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Gagal mengambil data gudang" }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const newWarehouse = await prisma.warehouse.create({
      data: {
        name: body.name,
        code: body.code,
        address: body.address,
      }
    });
    return new Response(JSON.stringify(newWarehouse), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Gagal menambah gudang" }), { status: 400 });
  }
}
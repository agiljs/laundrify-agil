import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not defined");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@laundrify.com" },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      name: "Laundrify Owner",
      email: "admin@laundrify.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const staffPassword = await bcrypt.hash("staff123", 12);

  const staff = await prisma.user.upsert({
    where: { email: "staff@laundrify.com" },
    update: { role: "STAFF", status: "ACTIVE" },
    create: {
      name: "Laundrify Staff",
      email: "staff@laundrify.com",
      passwordHash: staffPassword,
      role: "STAFF",
      status: "ACTIVE",
    },
  });

  const customerPassword = await bcrypt.hash("customer123", 12);

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@laundrify.com" },
    update: { role: "CUSTOMER", status: "ACTIVE" },
    create: {
      name: "Customer Demo",
      email: "customer@laundrify.com",
      passwordHash: customerPassword,
      phone: "081234567891",
      role: "CUSTOMER",
      status: "ACTIVE",
    },
  });

  await prisma.customer.upsert({
    where: { phone: "081234567891" },
    update: {
      userId: customerUser.id,
      email: customerUser.email,
      name: customerUser.name,
    },
    create: {
      customerCode: "CUS-DEMO001",
      name: customerUser.name,
      phone: "081234567891",
      email: customerUser.email,
      userId: customerUser.id,
    },
  });

  // Pelanggan lama TANPA akun login (seperti yang dibuat admin/kasir) - untuk menguji pendaftaran + penautan.
  // Daftar di app customer dengan HP 081234567892 dan Kode Customer CUS-DEMO002.
  await prisma.customer.upsert({
    where: { phone: "081234567892" },
    update: {},
    create: { customerCode: "CUS-DEMO002", name: "Pelanggan Lama Demo", phone: "081234567892" },
  });

  // Customer hanya bisa memilih layanan yang aktif; isi layanan contoh HANYA bila tabel masih kosong.
  if ((await prisma.service.count()) === 0) {
    await prisma.service.createMany({
      data: [
        { name: "Cuci Kiloan Reguler", description: "Cuci + lipat, selesai 2-3 hari", unit: "KG", price: 7000 },
        { name: "Cuci + Setrika", description: "Cuci, kering, setrika, lipat", unit: "KG", price: 10000 },
        { name: "Setrika Saja", description: "Setrika pakaian bersih", unit: "KG", price: 6000 },
        { name: "Bed Cover", description: "Cuci bed cover ukuran besar", unit: "PCS", price: 35000 },
        { name: "Selimut", description: "Cuci selimut", unit: "PCS", price: 25000 },
      ],
    });
    console.log("Layanan contoh dibuat (5 layanan)");
  }

  console.log("Admin:", admin.email, "password: admin123");
  console.log("Staff:", staff.email, "password: staff123");
  console.log("Customer:", customerUser.email, "password: customer123");
  console.log("Pelanggan lama (tanpa akun): HP 081234567892, kode CUS-DEMO002 -> uji lewat halaman Daftar");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

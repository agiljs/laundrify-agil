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

  console.log("Admin:", admin.email, "password: admin123");
  console.log("Staff:", staff.email, "password: staff123");
  console.log("Customer:", customerUser.email, "password: customer123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

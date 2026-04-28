import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // 🔐 HASH PASSWORD
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  // 🧹 OPTIONAL: reset data biar clean
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.court.deleteMany();
  await prisma.user.deleteMany(); // biar gak nyampur password lama

  // 👤 ADMIN
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@gmail.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // 👤 USER
  await prisma.user.create({
    data: {
      name: "User",
      email: "user@gmail.com",
      password: userPassword,
      role: "USER",
    },
  });

  // 🏟 COURTS
  const result = await prisma.court.createMany({
    data: [
      {
        name: "Padel Court A (Premium)",
        location: "Banyumanik, Semarang",
        pricePerHour: 150000,
        images: ["/images/court-1.jpg"],
        description: "Lapangan premium",
      },
      {
        name: "Indoor Panoramic Court",
        location: "Tembalang, Semarang",
        pricePerHour: 200000,
        images: ["/images/court-2.jpg"],
        description: "Lapangan indoor santai",
      },
      {
        name: "Outdoor Classic Court",
        location: "Simpang Lima, Semarang",
        pricePerHour: 120000,
        images: ["/images/court-3.jpg"],
        description: "Lapangan outdoor santai",
      },
    ],
  });

  console.log(`✅ Courts created: ${result.count}`);
  console.log("✅ Users created: admin & user");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

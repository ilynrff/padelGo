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
  await prisma.user.deleteMany();

  // 👤 ADMIN
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@padelgo.id",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // 👤 USER
  await prisma.user.create({
    data: {
      name: "Apiipp",
      email: "user@padelgo.id",
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
        pricePerHour: 500000,
        images: [
          { url: "/images/padel-premium.jpg", isDefault: true, isActive: true },
        ],
        description:
          "Lapangan padel premium dengan kualitas permukaan terbaik, pencahayaan optimal, dan area bermain yang luas. Cocok untuk pemain serius yang mengutamakan performa dan kenyamanan dalam setiap pertandingan.",
      },
      {
        name: "Indoor Panoramic Court",
        location: "Tembalang, Semarang",
        pricePerHour: 200000,
        images: [
          { url: "/images/padel-indoor.jpg", isDefault: true, isActive: true },
        ],
        description:
          "Lapangan indoor modern dengan desain panoramic yang memberikan pengalaman bermain eksklusif. Terlindung dari cuaca, dilengkapi pencahayaan maksimal, ideal untuk bermain kapan saja tanpa gangguan.",
      },
      {
        name: "Outdoor Classic Court",
        location: "Simpang Lima, Semarang",
        pricePerHour: 300000,
        images: [
          { url: "/images/padel-outdoor.jpg", isDefault: true, isActive: true },
        ],
        description:
          "Lapangan outdoor dengan suasana santai dan udara terbuka di pusat kota. Cocok untuk bermain bersama teman atau keluarga sambil menikmati atmosfer kota yang hidup.",
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

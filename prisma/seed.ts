import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (for idempotent re-runs)
  await prisma.booking.deleteMany();
  await prisma.court.deleteMany();
  await prisma.user.deleteMany();

  // Seed Users
  const user = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi@padelgo.id",
      password: "password123", // plain-text for dev; swap to bcrypt hash in prod
      role: "USER",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin PadelGo",
      email: "admin@padelgo.id",
      password: "admin123",
      role: "ADMIN",
    },
  });

  console.log("✅ Users created:", user.email, adminUser.email);

  // Seed Courts
  const court1 = await prisma.court.create({
    data: {
      name: "Padel Court A (Premium)",
      location: "Banyumanik, Semarang",
      price: 150000,
      description: "Lapangan indoor premium dengan standar internasional. Pencahayaan anti-silau, lantai turf berkualitas, cocok untuk semua level.",
      isActive: true,
    },
  });

  const court2 = await prisma.court.create({
    data: {
      name: "Indoor Panoramic Court",
      location: "Tembalang, Semarang",
      price: 200000,
      description: "Satu-satunya lapangan padel dengan pemandangan kota Semarang. Kaca tembus pandang dan ventilasi AC terbaik.",
      isActive: true,
    },
  });

  const court3 = await prisma.court.create({
    data: {
      name: "Outdoor Classic Court",
      location: "Simpang Lima, Semarang",
      price: 120000,
      description: "Lapangan outdoor dengan suasana terbuka. Angin alami dan cahaya siang yang optimal. Harga terjangkau!",
      isActive: true,
    },
  });

  console.log("✅ Courts created:", court1.name, court2.name, court3.name);
  console.log("\n📋 Login credentials:");
  console.log("  User  → budi@padelgo.id / password123");
  console.log("  Admin → admin@padelgo.id / admin123");
  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

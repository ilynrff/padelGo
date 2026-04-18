require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: [],
});

async function main() {
  console.log("🌱 Seeding database (JS)...");

  try {
    // Clear existing data (for idempotent re-runs)
    await prisma.booking.deleteMany();
    await prisma.court.deleteMany();
    await prisma.user.deleteMany();

    // Seed Users
    const user = await prisma.user.create({
      data: {
        name: "Budi Santoso",
        email: "budi@padelgo.id",
        password: "password123",
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
        image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800&auto=format&fit=crop",
        description: "Lapangan indoor premium dengan standar internasional. Pencahayaan anti-silau, lantai turf berkualitas, cocok untuk semua level.",
        isActive: true,
      },
    });

    const court2 = await prisma.court.create({
      data: {
        name: "Indoor Panoramic Court",
        location: "Tembalang, Semarang",
        price: 200000,
        image: "https://images.unsplash.com/photo-1626245917164-21ed202b3145?q=80&w=800&auto=format&fit=crop",
        description: "Satu-satunya lapangan padel dengan pemandangan kota Semarang. Kaca tembus pandang dan ventilasi AC terbaik.",
        isActive: true,
      },
    });

    const court3 = await prisma.court.create({
      data: {
        name: "Outdoor Classic Court",
        location: "Simpang Lima, Semarang",
        price: 120000,
        image: "https://images.unsplash.com/photo-1599423300746-b625333973c4?q=80&w=800&auto=format&fit=crop",
        description: "Lapangan outdoor dengan suasana terbuka. Angin alami dan cahaya siang yang optimal. Harga terjangkau!",
        isActive: true,
      },
    });

    console.log("✅ Courts created:", court1.name, court2.name, court3.name);
    console.log("\n✅ Seed complete!");
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

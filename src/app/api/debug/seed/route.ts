import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Check if data already exists to avoid duplication (optional)
    const count = await prisma.court.count();
    if (count > 0) {
      return NextResponse.json({ message: "Database already has data. No seeding needed.", count });
    }

    console.log("🌱 Seeding database via API...");

    // Seed Courts
    await prisma.court.createMany({
      data: [
        {
          name: "Padel Court A (Premium)",
          location: "Banyumanik, Semarang",
          price: 150000,
          image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800&auto=format&fit=crop",
          description: "Lapangan indoor premium dengan standar internasional. Pencahayaan anti-silau, lantai turf berkualitas, cocok untuk semua level.",
          isActive: true,
        },
        {
          name: "Indoor Panoramic Court",
          location: "Tembalang, Semarang",
          price: 200000,
          image: "https://images.unsplash.com/photo-1626245917164-21ed202b3145?q=80&w=800&auto=format&fit=crop",
          description: "Satu-satunya lapangan padel dengan pemandangan kota Semarang. Kaca tembus pandang dan ventilasi AC terbaik.",
          isActive: true,
        },
        {
          name: "Outdoor Classic Court",
          location: "Simpang Lima, Semarang",
          price: 120000,
          image: "https://images.unsplash.com/photo-1599423300746-b625333973c4?q=80&w=800&auto=format&fit=crop",
          description: "Lapangan outdoor dengan suasana terbuka. Angin alami dan cahaya siang yang optimal. Harga terjangkau!",
          isActive: true,
        }
      ]
    });

    return NextResponse.json({ success: true, message: "Database seeded successfully!" });
  } catch (error: any) {
    console.error("Seed API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courtId = searchParams.get("courtId");
  const dateStr = searchParams.get("date");

  if (!courtId || !dateStr) {
    return NextResponse.json({ error: "Missing courtId or date" }, { status: 400 });
  }

  try {
    const queryDate = new Date(dateStr);
    
    // Ambil data booking yang sudah fix / overlap
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId: courtId,
        date: queryDate,
        status: { in: ["PENDING", "CONFIRMED"] }
      },
      select: { timeSlot: true }
    });

    const bookedSlots = existingBookings.map(b => b.timeSlot);

    // Bikin slot default (e.g., 08:00 - 20:00)
    const allSlots = [
      "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
      "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
      "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00"
    ];

    const availability = allSlots.map(time => ({
       time,
       available: !bookedSlots.includes(time)
    }));

    return NextResponse.json(availability, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }
}

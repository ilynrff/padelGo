import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  console.log("API: Fetching bookings...");
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.warn("API: Unauthorized booking fetch attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    console.log(`API: Fetching for user ${userId} with role ${userRole}`);

    const bookings = await prisma.booking.findMany({
      where: userRole === "ADMIN" ? {} : { userId },
      include: {
        user: { select: { name: true, email: true } },
        court: { select: { name: true, location: true, price: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    console.log(`API: Found ${bookings.length} bookings.`);
    return NextResponse.json(bookings, { status: 200 });
  } catch (err: any) {
    console.error("API Error [GET /api/bookings]:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  console.log("API: Creating new booking...");
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.warn("API: Unauthorized booking creation attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { courtId, date, timeSlots } = body;
    console.log(`API: Booking request from ${userId} for court ${courtId} on date ${date} with slots:`, timeSlots);
    
    if (!courtId || !date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    const bookingDate = new Date(date);

    const result = await prisma.$transaction(async (tx) => {
      console.log("API: Starting transaction check for double booking...");
      const existingBookings = await tx.booking.findMany({
        where: {
          courtId,
          date: bookingDate,
          timeSlot: { in: timeSlots },
          status: { in: ["PENDING", "CONFIRMED"] }
        }
      });

      if (existingBookings.length > 0) {
        console.warn("API: Double booking detected!", existingBookings.map(b => b.timeSlot));
        throw new Error("SLOT_TAKEN");
      }

      const court = await tx.court.findUnique({ where: { id: String(courtId) } });
      if (!court) {
        console.error(`API: Court ID ${courtId} not found.`);
        throw new Error("COURT_NOT_FOUND");
      }

      console.log(`API: Creating ${timeSlots.length} slot entries...`);
      const createdBookings = [];
      for (const t of timeSlots) {
         const b = await tx.booking.create({
           data: {
             userId,
             courtId: String(courtId),
             date: bookingDate,
             timeSlot: t,
             status: "PENDING",
             paymentStatus: "UNPAID"
           }
         });
         createdBookings.push(b);
      }
      return { createdBookings, courtPrice: court.price };
    });

    console.log(`API: Booking success for ID(s):`, result.createdBookings.map(b => b.id));
    return NextResponse.json({ success: true, count: result.createdBookings.length, priceAssigned: result.courtPrice }, { status: 201 });

  } catch (err: any) {
    console.error("API Error [POST /api/bookings]:", err);
    if (err.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "Beberapa jam yang dipilih sudah direservasi oleh pengguna lain. Silakan pilih jadwal lain." }, { status: 409 });
    }
    if (err.message === "COURT_NOT_FOUND") {
       return NextResponse.json({ error: "Lapangan tidak valid." }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}

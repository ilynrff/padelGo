import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingCode } = await req.json();
    if (!bookingCode) {
      return NextResponse.json({ error: "Booking code is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Allow check-in if CONFIRMED or RESCHEDULE_APPROVED
    if (!["CONFIRMED", "RESCHEDULE_APPROVED"].includes(booking.status)) {
      return NextResponse.json({ 
        error: `Cannot check-in. Booking status is ${booking.status}` 
      }, { status: 400 });
    }

    // Optional: Check if time is within valid range (30 mins before start until end)
    const now = new Date();
    // Booking date is in UTC, midnight. Start/End times are minutes from midnight.
    const startTime = new Date(booking.date);
    startTime.setUTCMinutes(startTime.getUTCMinutes() + booking.startTime - 30); // 30 mins before
    
    const endTime = new Date(booking.date);
    endTime.setUTCMinutes(endTime.getUTCMinutes() + booking.endTime);

    if (now < startTime) {
      return NextResponse.json({ 
        error: "Terlalu cepat untuk check-in. Maksimal 30 menit sebelum jadwal." 
      }, { status: 400 });
    }

    if (now > endTime) {
      return NextResponse.json({ 
        error: "Jadwal sudah berakhir, tidak bisa check-in." 
      }, { status: 400 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CHECKED_IN" as any },
      include: {
        user: { select: { name: true, email: true } },
        court: { select: { name: true, location: true } }
      }
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: unknown) {
    console.error("Check-in Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(error) }, { status: 500 });
  }
}

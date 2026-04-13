import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courtId = searchParams.get("courtId");
    const date = searchParams.get("date");

    if (courtId && date) {
      const bookings = await prisma.booking.findMany({
        where: {
          courtId,
          date: new Date(date),
        },
      });
      return NextResponse.json(bookings);
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    if (session.user.role === "ADMIN") {
      const allBookings = await prisma.booking.findMany({
        include: { user: true, court: true },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(allBookings);
    } else {
      const userBookings = await prisma.booking.findMany({
        // @ts-ignore
        where: { userId: session.user.id },
        include: { court: true },
        orderBy: { date: 'desc' }
      });
      return NextResponse.json(userBookings);
    }
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { courtId, date, timeSlot } = body;

    if (!courtId || !date || !timeSlot) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const targetDate = new Date(date);
    
    // 1. Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
        return new NextResponse("Cannot book in the past", { status: 400 });
    }

    // 2. Prevent Double Booking of the same court slot
    const existingCourtBooking = await prisma.booking.findFirst({
      where: {
        courtId,
        date: targetDate,
        timeSlot,
        status: { not: "CANCELLED" }
      }
    });

    if (existingCourtBooking) {
      return new NextResponse("Time slot already booked", { status: 400 });
    }

    // 3. User cannot book 2 different courts at the same time
    const existingUserBooking = await prisma.booking.findFirst({
        where: {
            // @ts-ignore
            userId: session.user.id,
            date: targetDate,
            timeSlot,
            status: { not: "CANCELLED" }
        }
    });

    if (existingUserBooking) {
        return new NextResponse("You already have a booking at this time", { status: 400 });
    }

    // Create booking as PENDING and UNPAID
    const booking = await prisma.booking.create({
      data: {
        // @ts-ignore
        userId: session.user.id,
        courtId,
        date: targetDate,
        timeSlot,
        status: "PENDING",
        paymentStatus: "UNPAID"
      }
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.log(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

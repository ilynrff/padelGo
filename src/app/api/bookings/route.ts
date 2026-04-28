import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DEFAULT_CLOSE_MINUTES,
  DEFAULT_OPEN_MINUTES,
  parseHHmmToMinutes,
  parseSlotToRange,
  coerceDateOnlyUTC,
} from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";
import { validateBookingMonth } from "@/lib/dateValidation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseBookingTimeRange(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  // Preferred legacy payload: { timeSlots: ["08:00 - 09:00", ...] }
  if (Array.isArray(b.timeSlots) && b.timeSlots.length > 0) {
    const rawSlots = b.timeSlots as unknown[];
    const ranges = rawSlots
      .map((s: unknown) => (typeof s === "string" ? parseSlotToRange(s) : null))
      .filter(Boolean) as { start: number; end: number }[];

    if (ranges.length !== rawSlots.length) {
      return { error: "Invalid timeSlots format" as const };
    }

    ranges.sort((a, b) => a.start - b.start);

    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i].start !== ranges[i - 1].end) {
        return { error: "Time slots must be contiguous" as const };
      }
    }

    const startTime = ranges[0].start;
    const endTime = ranges[ranges.length - 1].end;
    return { startTime, endTime };
  }

  // New payload: { startTime, endTime } in minutes OR "HH:mm"
  const startRaw = b.startTime;
  const endRaw = b.endTime;

  const startTime =
    typeof startRaw === "number"
      ? Math.round(startRaw)
      : typeof startRaw === "string"
        ? parseHHmmToMinutes(startRaw)
        : null;
  const endTime =
    typeof endRaw === "number"
      ? Math.round(endRaw)
      : typeof endRaw === "string"
        ? parseHHmmToMinutes(endRaw)
        : null;

  if (startTime === null || endTime === null) {
    return { error: "Missing startTime/endTime" as const };
  }

  return { startTime, endTime };
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date");

    const userRole = session.user.role;
    const userId = session.user.id;

    const whereClause: any = userRole === "ADMIN" ? {} : { userId };

    if (dateQuery) {
      const parsedDate = coerceDateOnlyUTC(dateQuery);
      if (parsedDate) {
        whereClause.date = parsedDate;
      }
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        court: { select: { id: true, name: true, location: true, pricePerHour: true, images: true } },
        payment: { select: { id: true, status: true, proofImage: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (err: unknown) {
    console.error("API Error [GET /api/bookings]:", err);
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(err) }, { status: 500 });
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

    // Admin tidak boleh booking
    if (session.user.role === "ADMIN") {
      console.warn("API: Admin attempt to create booking denied.");
      return NextResponse.json({ error: "Admin tidak boleh melakukan booking" }, { status: 403 });
    }

    const userId = session.user.id;

    const body: unknown = await req.json();
    const payload = (body ?? {}) as Record<string, unknown>;
    const courtId = payload.courtId;
    const date = payload.date;

    if (!courtId || !date) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    const bookingDate = coerceDateOnlyUTC(String(date));
    if (!bookingDate) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
    }

    const monthValidation = validateBookingMonth(bookingDate);
    if (!monthValidation.valid) {
      return NextResponse.json({ error: monthValidation.error }, { status: 400 });
    }

    const parsed = parseBookingTimeRange(payload);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const startTime = parsed.startTime;
    const endTime = parsed.endTime;

    if (endTime <= startTime) {
      return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
    }
    if (startTime < DEFAULT_OPEN_MINUTES || endTime > DEFAULT_CLOSE_MINUTES) {
      return NextResponse.json({ error: "Time range is outside operating hours" }, { status: 400 });
    }
    if ((endTime - startTime) % 60 !== 0) {
      return NextResponse.json({ error: "Booking duration must be in full hours" }, { status: 400 });
    }

    // Past time validation
    const now = new Date();
    const localDateStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const bookingDateStr = bookingDate.toISOString().split('T')[0];
    
    if (bookingDateStr < localDateStr) {
      return NextResponse.json({ error: "Tidak bisa booking untuk tanggal yang sudah lewat." }, { status: 400 });
    }
    if (bookingDateStr === localDateStr && startTime <= nowMinutes) {
      return NextResponse.json({ error: "Waktu booking sudah terlewat hari ini." }, { status: 400 });
    }

    const lockKey = `${courtId}:${bookingDate.toISOString().slice(0, 10)}`;

    const created = await prisma.$transaction(async (tx) => {
      // Serialize booking creation per (court, date) to prevent races.
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`,
      );

      // Auto-expire PENDING bookings where expiresAt < now
      const now = new Date();
      await tx.booking.updateMany({
        where: { status: "PENDING", courtId: String(courtId), date: bookingDate, expiresAt: { lt: now } },
        data: { status: "EXPIRED" },
      });

      const court = await tx.court.findUnique({ where: { id: String(courtId) } });
      if (!court) {
        throw new Error("COURT_NOT_FOUND");
      }

      const conflict = await tx.booking.findFirst({
        where: {
          courtId: String(courtId),
          date: bookingDate,
          status: { in: ["PENDING", "CONFIRMED"] },
          AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
        },
        select: { id: true },
      });

      if (conflict) {
        throw new Error("SLOT_TAKEN");
      }

      const durationHours = (endTime - startTime) / 60;
      const totalPrice = court.pricePerHour * durationHours;

      // Generate bookingCode: PDL-YYYY-NNNN
      const year = new Date().getFullYear();
      const count = await tx.booking.count({
        where: {
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
        },
      });
      const sequence = String(count + 1).padStart(4, "0");
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      const bookingCode = `PDL-${year}-${sequence}-${randomSuffix}`;

      // Set expiresAt = now + 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const booking = await tx.booking.create({
        data: {
          bookingCode,
          userId,
          courtId: String(courtId),
          date: bookingDate,
          startTime,
          endTime,
          status: "PENDING",
          totalPrice,
          expiresAt,
        },
        include: {
          court: { select: { id: true, name: true, location: true, pricePerHour: true, images: true } },
        },
      });

      return booking;
    });

    console.log(`API: Booking created: ${created.id}`);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    console.error("API Error [POST /api/bookings]:", err);
    const message = getErrorMessage(err);
    if (message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "Slot bentrok: jadwal sudah dibooking pengguna lain. Silakan pilih jam lain." },
        { status: 409 },
      );
    }
    if (message === "COURT_NOT_FOUND") {
      return NextResponse.json({ error: "Lapangan tidak valid." }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}

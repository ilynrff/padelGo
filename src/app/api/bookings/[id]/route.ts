import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Must be the owner or admin
    // @ts-ignore
    if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return new NextResponse("Not found", { status: 404 });

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const updated = await prisma.booking.update({
      where: { id },
      data: { 
          status: "CONFIRMED",
          paymentStatus: "PAID"
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

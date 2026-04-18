import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  console.log("API: Fetching courts from database...");
  try {
    const courts = await prisma.court.findMany({
      where: { isActive: true },
    });
    console.log(`API: Found ${courts.length} active courts.`);
    return NextResponse.json(courts, { status: 200 });
  } catch (error: any) {
    console.error("API Error [GET /api/courts]:", error);
    return NextResponse.json({ 
      error: "Failed to fetch courts.",
      details: error.message 
    }, { status: 500 });
  }
}

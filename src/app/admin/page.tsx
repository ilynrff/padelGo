import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookingManager } from "@/components/admin/BookingManager";
import { CourtManager } from "@/components/admin/CourtManager";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch initial data on server
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { name: true, email: true } },
      court: { select: { name: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert dates to strings for client components
  const serializedBookings = bookings.map((b) => ({
    ...b,
    date: b.date.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    payment: b.payment
      ? {
          ...b.payment,
          createdAt: b.payment.createdAt.toISOString(),
          updatedAt: b.payment.updatedAt.toISOString(),
        }
      : null,
    paymentProofUrl: b.paymentProofUrl || undefined,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 font-medium">
              Selamat datang, {session.user.name}
            </p>
          </div>
          <Link href="/">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
              Ke Beranda
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800 px-2">
              Daftar Reservasi
            </h2>
            <BookingManager initialBookings={serializedBookings} />
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800 px-2">
              Pengaturan Lapangan
            </h2>
            <CourtManager />
          </div>
        </div>
      </div>
    </div>
  );
}

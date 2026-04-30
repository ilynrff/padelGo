import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { manageBookingLifecycle } from "@/lib/manageLifecycle";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  // Manage lifecycle before fetching
  await manageBookingLifecycle();

  // Fetch initial data on server
  const [bookings, courts] = await Promise.all([
    prisma.booking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        court: { select: { id: true, name: true, location: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.court.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Calculate stats
  const totalBookings = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const needVerif = bookings.filter((b) => b.status === "PERLU_VERIFIKASI").length;
  const confirmedCount = bookings.filter(
    (b) => ["CONFIRMED", "RESCHEDULE_APPROVED"].includes(b.status),
  ).length;
  const totalRevenue = bookings
    .filter((b) => ["CONFIRMED", "RESCHEDULE_APPROVED", "COMPLETED"].includes(b.status))
    .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
  const rescheduleRequests = bookings.filter((b) => b.status === "RESCHEDULE_REQUESTED").length;

  const stats = [
    {
      label: "Total Booking",
      value: totalBookings,
      icon: <span className="text-2xl">📋</span>,
      color: "blue",
    },
    {
      label: "Perlu Tindakan",
      value: needVerif + rescheduleRequests + pendingCount,
      trend: `${needVerif} verifikasi · ${rescheduleRequests} reschedule`,
      icon: <span className="text-2xl">⚡</span>,
      color: "yellow",
    },
    {
      label: "Confirmed Aktif",
      value: confirmedCount,
      trend: `${courts.length} lapangan terdaftar`,
      icon: <span className="text-2xl">✅</span>,
      color: "green",
    },
    {
      label: "Total Revenue",
      value: `Rp ${totalRevenue.toLocaleString("id-ID")}`,
      trend: "Dari booking confirmed",
      icon: <span className="text-2xl">💰</span>,
      color: "purple",
    },
  ];

  // Serialize dates for client components
  const serializedBookings = bookings.map((b) => ({
    ...b,
    date: b.date.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    expiresAt: b.expiresAt?.toISOString() ?? undefined,
    rescheduleDate: b.rescheduleDate?.toISOString() ?? null,
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                A
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-tight">Admin Dashboard</h1>
                <p className="text-xs text-slate-400 font-medium">PadelGo Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm font-semibold text-slate-500">
                {session.user.name}
              </span>
              <Link href="/">
                <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors">
                  ← Beranda
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AdminDashboard — handles its own tab nav + content */}
      <AdminDashboard initialBookings={serializedBookings} stats={stats} />
    </div>
  );
}
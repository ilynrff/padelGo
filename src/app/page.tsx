import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const COURTS_PREVIEW = [
  { id: 1, name: "Padel Court A (Premium)", location: "Kuningan, Jaksel", type: "Indoor", price: 150000, desc: "Lapangan panoramic glass dengan standar WPT, dilengkapi LED anti-silau.", image: "/images/court-1.jpg" },
  { id: 2, name: "Indoor Panoramic Court", location: "Menteng, Jakpus", type: "Outdoor", price: 200000, desc: "Full enclosed panoramic court, cocok untuk latihan intensif malam hari.", image: "/images/court-2.jpg" },
  { id: 3, name: "Outdoor Classic Court", location: "Kemang, Jaksel", type: "Outdoor", price: 120000, desc: "Lapangan outdoor dengan rumput sintetis premium dan sirkulasi udara alami.", image: "/images/court-3.jpg" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-padel.jpg"
            alt="Padel Court Background"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Dark overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/30 bg-blue-500/20 backdrop-blur-md text-sm text-blue-200 font-bold mb-8">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-400"></span>
            </span>
            PadelX is Live in Jakarta
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[1.05] text-white mb-6 drop-shadow-lg">
            Book your court.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">Play your game.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform booking lapangan padel paling simpel. Cek jadwal, pilih jam, langsung main. Tanpa ribet, tanpa telepon.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href="/booking" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg shadow-[0_8px_30px_-4px_rgba(59,130,246,0.6)]">
                Book Now →
              </Button>
            </Link>
            <Link href="/booking" className="w-full sm:w-auto">
               <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg border-white/30 text-white hover:bg-white/10 hover:border-white/50">
                Lihat Jadwal
               </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Courts List Section - With Real Images */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Fasilitas Premium</h2>
            <p className="text-slate-500 font-medium">Nikmati pengalaman bermain di lapangan padel berstandar internasional.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {COURTS_PREVIEW.map((court) => (
              <Card key={court.id} hoverEffect className="flex flex-col overflow-hidden p-0 border-slate-100 rounded-[2rem]">
                <div className="h-52 w-full relative overflow-hidden">
                  <Image
                    src={court.image}
                    alt={court.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-700">
                    {court.type}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white text-xs font-bold bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg">
                    {court.location}
                  </div>
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 mb-2">{court.name}</h3>
                  <p className="text-slate-500 font-medium text-sm mb-6 flex-1 leading-relaxed">
                    {court.desc}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <span className="text-lg font-extrabold text-slate-900">Rp {(court.price / 1000)}k <span className="text-sm text-slate-400 font-medium">/ jam</span></span>
                    <Link href="/booking">
                      <Button size="sm" variant="secondary">Cek Jadwal</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Cara Booking</h2>
          <p className="text-slate-500 font-medium mb-16">3 langkah mudah, langsung main.</p>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Pilih Lapangan", desc: "Lihat fasilitas dan harga masing-masing court." },
              { step: "2", title: "Pilih Jadwal", desc: "Tentukan tanggal dan jam sesuai ketersediaan." },
              { step: "3", title: "Konfirmasi & Bayar", desc: "Selesaikan pembayaran, jadwalmu otomatis terkunci." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl mb-5 shadow-inner">
                  {item.step}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
           <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Padel<span className="text-blue-600">X</span>
           </span>
           <p className="text-slate-400 font-medium text-sm">© 2026 PadelX Booking System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

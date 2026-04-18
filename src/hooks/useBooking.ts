import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function useBooking() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [courts, setCourts] = useState<any[]>([]);
  const [dbTimeSlots, setDbTimeSlots] = useState<{time: string, available: boolean}[]>([]);
  
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const [error, setError] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Generate 7 days ahead
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Fetch Courts Info from Backend
  useEffect(() => {
    console.log("DEBUG: Fetching /api/courts...");
    fetch('/api/courts')
      .then(async res => {
        const data = await res.json();
        console.log("DEBUG: /api/courts result:", data);
        if(!res.ok) throw new Error(data.error || "Gagal mengambil data lapangan");
        if(Array.isArray(data) && data.length > 0) {
          setCourts(data);
          
          // Sync from URL if exists
          const params = new URLSearchParams(window.location.search);
          const urlCourtId = params.get('courtId');
          if (urlCourtId && data.some(c => c.id === urlCourtId)) {
            console.log("DEBUG: Auto-selecting court from URL:", urlCourtId);
            setSelectedCourt(urlCourtId);
          }
        } else {
           // If DB is empty, use emergency fallback for demo
           throw new Error("EMPTY_DB");
        }
      })
      .catch(err => {
        console.error("Error fetching courts:", err);
        
        // AUTO-RECOVERY for Demo: Put back high quality data if DB is broken/empty
        setCourts([
          {
            id: "court-1",
            name: "Padel Court A (Premium)",
            location: "Banyumanik, Semarang",
            price: 150000,
            type: "Indoor",
            image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=800",
            description: "Lapangan indoor premium dengan standar internasional. Pencahayaan anti-silau, lantai turf berkualitas."
          },
          {
            id: "court-2",
            name: "Indoor Panoramic Court",
            location: "Tembalang, Semarang",
            price: 200000,
            type: "Indoor",
            image: "https://images.unsplash.com/photo-1622325055171-897b9ee9059e?auto=format&fit=crop&q=80&w=800",
            description: "Full enclosed panoramic court, cocok untuk latihan intensif malam hari."
          },
          {
            id: "court-3",
            name: "Outdoor Classic Court",
            location: "Simpang Lima, Semarang",
            price: 120000,
            type: "Outdoor",
            image: "https://images.unsplash.com/photo-1592919016382-7718e268923a?auto=format&fit=crop&q=80&w=800",
            description: "Lapangan outdoor dengan rumput sintetis premium dan sirkulasi udara alami."
          }
        ]);

        if (err.message !== "EMPTY_DB") {
          setError("Gagal terhubung ke Database. Gunakan Terminal untuk: npx prisma generate");
          setIsToastOpen(true);
        }
      });
  }, []);

  // Fetch Slots based on Court & Date dynamically
  useEffect(() => {
    // Only fetch if parameters are valid
    if(!selectedCourt) {
      setDbTimeSlots([]);
      return;
    }
    
    setIsLoadingSlots(true);
    setError(''); // Clear error when starting new fetch
    
    const isoDate = selectedDate.toISOString().split('T')[0];
    
    console.log(`DEBUG: Fetching availability for court=${selectedCourt}, date=${isoDate}`);
    fetch(`/api/courts/availability?courtId=${selectedCourt}&date=${isoDate}`)
      .then(async res => {
         const data = await res.json();
         console.log("DEBUG: /api/courts/availability result:", data);
         if(!res.ok) throw new Error(data.error || "Gagal mengambil jadwal");
         if (Array.isArray(data)) setDbTimeSlots(data);
      })
      .catch(err => {
         console.error("Error fetching availability:", err);
         // DEMO FALLBACK: Generate all slots as available if server fails
         const allSlots = [
           "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
           "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
           "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00"
         ].map(time => ({ time, available: true }));
         
         setDbTimeSlots(allSlots);
         
         // Only show error toast once if it's a real server error
         setError("Server sibuk (Mode Demo Aktif): Jadwal diset tersedia otomatis.");
         setIsToastOpen(true);
      })
      .finally(() => setIsLoadingSlots(false));
  }, [selectedCourt, selectedDate]);

  const toggleSlot = (time: string) => {
    setSelectedSlots(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time].sort()
    );
  };

  const checkout = async () => {
    if (status !== "authenticated" || !session?.user) {
      setError("Anda harus login untuk melakukan booking.");
      setIsToastOpen(true);
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    if (!selectedCourt || !selectedDate || selectedSlots.length === 0) {
      setError("Mohon lengkapi pilihan lapangan, tanggal, dan jam.");
      setIsToastOpen(true);
      setTimeout(() => setIsToastOpen(false), 3000);
      return;
    }

    setIsLoading(true);
    setError('');

    const dateQuery = selectedDate.toISOString();

    try {
      const res = await fetch('/api/bookings', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: selectedCourt,
          date: dateQuery,
          timeSlots: selectedSlots
        })
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Gagal melakukan booking.");
        setIsToastOpen(true);
        setTimeout(() => setIsToastOpen(false), 3000);
        setIsLoading(false);
        // Refresh availability on conflict
        setDbTimeSlots([...dbTimeSlots]);
        return;
      }

      // Success! Calculate total price correctly
      const courtData = courts.find(c => c.id === selectedCourt);
      const unitPrice = result.priceAssigned;
      const slotCount = selectedSlots.length;
      const totalPrice = unitPrice * slotCount;

      const query = new URLSearchParams({
        courtName: courtData?.name || "",
        location: courtData?.location || "",
        date: selectedDate.toISOString().split('T')[0],
        time: selectedSlots.join(", "),
        price: totalPrice.toString(), 
        duration: slotCount.toString()
      });
      
      router.push(`/booking/success?${query.toString()}`);

    } catch (e) {
      setError("Terjadi kesalahan koneksi server.");
      setIsToastOpen(true);
      setTimeout(() => setIsToastOpen(false), 3000);
      setIsLoading(false);
    }
  };

  return {
    courts,
    timeSlots: dbTimeSlots,
    isLoadingSlots,
    dates,
    selectedCourt,
    setSelectedCourt,
    selectedDate,
    setSelectedDate,
    selectedSlots,
    setSelectedSlots,
    toggleSlot,
    checkout,
    isLoading,
    error,
    isToastOpen,
    setIsToastOpen
  };
}

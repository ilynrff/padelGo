import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const MOCK_COURTS = [
  { id: 1, name: "Padel Court A (Premium)", location: "Banyumanik, Semarang", price: 150000, image: "/images/court-premium.jpg" },
  { id: 2, name: "Indoor Panoramic Court", location: "Tembalang, Semarang", price: 200000, image: "/images/court-1.jpg" },
  { id: 3, name: "Outdoor Classic Court", location: "Simpang Lima, Semarang", price: 120000, image: "/images/court-3.jpg" },
];

export const MOCK_TIME_SLOTS = [
  { time: "08:00 - 09:00", available: true },
  { time: "09:00 - 10:00", available: false },
  { time: "10:00 - 11:00", available: false },
  { time: "11:00 - 12:00", available: true },
  { time: "12:00 - 13:00", available: true },
  { time: "13:00 - 14:00", available: true },
  { time: "14:00 - 15:00", available: true },
  { time: "15:00 - 16:00", available: false },
  { time: "16:00 - 17:00", available: true },
  { time: "17:00 - 18:00", available: true },
  { time: "18:00 - 19:00", available: true },
  { time: "19:00 - 20:00", available: true },
];

export function useBooking() {
  const router = useRouter();
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Generate 7 days ahead
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const toggleSlot = (time: string) => {
    setSelectedSlots(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time].sort() // Sort to maintain chronological order
    );
  };

  const checkout = async () => {
    if (!selectedCourt || !selectedDate || selectedSlots.length === 0) {
      setError("Mohon lengkapi pilihan lapangan, tanggal, dan jam.");
      setSuccessMsg('');
      setIsToastOpen(true);
      setTimeout(() => setIsToastOpen(false), 3000);
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Simulate network latency & checking
    await new Promise(res => setTimeout(res, 1200));

    // Simulate 20% bentrok chance per request
    const isBentrok = Math.random() < 0.2;
    if (isBentrok) {
      setError("Mohon maaf, salah satu slot yang dipilih baru saja diambil orang lain.");
      setSuccessMsg('');
      setIsLoading(false);
      setIsToastOpen(true);
      setTimeout(() => setIsToastOpen(false), 3000);
    } else {
      // BERHASIL DIPESAN, ROUTE KE HALAMAN MVP+ CONFIRMATION PAGE!
      const courtData = MOCK_COURTS.find(c => c.id === selectedCourt);
      const query = new URLSearchParams({
        courtName: courtData?.name || "",
        location: courtData?.location || "",
        date: selectedDate.toString(),
        time: selectedSlots.join(", "),
        price: (courtData?.price || 0).toString(),
        duration: selectedSlots.length.toString()
      });
      
      router.push(`/booking/success?${query.toString()}`);
    }
  };

  return {
    MOCK_COURTS,
    MOCK_TIME_SLOTS,
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
    successMsg,
    isToastOpen,
    setIsToastOpen
  };
}

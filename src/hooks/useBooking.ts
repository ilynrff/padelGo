import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const MOCK_COURTS = [
  { id: 1, name: "Padel Court A (Premium)", location: "Kuningan, Jaksel", price: 150000 },
  { id: 2, name: "Indoor Panoramic Court", location: "Menteng, Jakpus", price: 200000 },
  { id: 3, name: "Outdoor Classic Court", location: "Kemang, Jaksel", price: 120000 },
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
  const router = useRouter(); // Router di deklarasikan di sini
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
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

  const checkout = async () => {
    if (!selectedCourt || !selectedDate || !selectedSlot) {
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

    // Simulate 20% bentrok chance
    const isBentrok = Math.random() < 0.2;
    if (isBentrok) {
      setError("Mohon maaf, slot ini baru saja diambil orang lain.");
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
        time: selectedSlot,
        price: courtData?.price.toString() || "0"
      });
      
      // Tunggu sedetk sebelum routing untuk estetika Loading
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
    selectedSlot,
    setSelectedSlot,
    checkout,
    isLoading,
    error,
    successMsg,
    isToastOpen,
    setIsToastOpen
  };
}

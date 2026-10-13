'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { RoomCard } from '@/components/RoomCard';
import { AvailabilityTimeline } from '@/components/AvailabilityTimeline';
import { VisualCalendar } from '@/components/VisualCalendar';
import { BookingModal } from '@/components/BookingModal';
import { BookingConfirmationModal } from '@/components/BookingConfirmationModal';
import { CancellationModal } from '@/components/CancellationModal';
import { BookingDetailModal } from '@/components/BookingDetailModal';
import { RoomWithStatus, Booking, MeetingRoom } from '@/lib/types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  CheckCircle2, 
  PlusCircle, 
  RefreshCw, 
  AlertCircle,
  Building2,
  Users,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rooms, setRooms] = useState<RoomWithStatus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<Booking | null>(null);

  // Pre-fill parameters for BookingModal
  const [modalRoomId, setModalRoomId] = useState<string | undefined>(undefined);
  const [modalStartTime, setModalStartTime] = useState<string | undefined>(undefined);
  const [modalEndTime, setModalEndTime] = useState<string | undefined>(undefined);

  const scheduleSectionRef = useRef<HTMLDivElement>(null);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Fetch rooms and bookings
  const fetchData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      // 1. Fetch rooms with operational status for selected date
      const roomsRes = await fetch(`/api/rooms?date=${dateString}`);
      const roomsJson = await roomsRes.json();
      if (roomsJson.success) {
        setRooms(roomsJson.data);
      }

      // 2. Fetch all confirmed bookings for calendar
      const bookingsRes = await fetch(`/api/bookings?status=Confirmed`);
      const bookingsJson = await bookingsRes.json();
      if (bookingsJson.success) {
        setBookings(bookingsJson.data);
      }
    } catch (err) {
      console.error('Failed to load room data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateString]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds for real-time status updates
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handlers
  const handleOpenBooking = (roomId?: string, start?: string, end?: string) => {
    setModalRoomId(roomId);
    setModalStartTime(start || '09:00');
    setModalEndTime(end || '10:00');
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (booking: Booking) => {
    setConfirmedBooking(booking);
    fetchData(true);
  };

  const handleCancellationSuccess = () => {
    fetchData(true);
  };

  const scrollToSchedule = () => {
    scheduleSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Convert RoomWithStatus to MeetingRoom for components that require it
  const basicRooms: MeetingRoom[] = rooms.map(r => ({
    id: r.id,
    room_code: r.room_code,
    room_name: r.room_name,
    capacity: r.capacity,
    description: r.description,
    facilities: r.facilities,
    is_active: r.is_active,
    created_at: r.created_at,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        onOpenBooking={() => handleOpenBooking()}
        onOpenCancel={() => setIsCancelModalOpen(true)}
        onScrollToSchedule={scrollToSchedule}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* HERO SECTION */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          {/* Subtle industrial background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                Booking Ruang Meeting
              </h1>

              {/* Quick Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleOpenBooking()}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-md transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Pesan Ruangan Sekarang</span>
                </button>

                <button
                  onClick={scrollToSchedule}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl backdrop-blur-xs transition border border-white/10 cursor-pointer"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>Lihat Jadwal & Kalender</span>
                </button>
              </div>
            </div>

            {/* Quick Summary Pill / Today Widget */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between min-w-[260px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-semibold text-slate-300">Status 4 Ruangan:</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Aktif Real-Time
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3">
                <div className="bg-black/20 p-2.5 rounded-xl">
                  <span className="text-[11px] text-slate-400 block">Tersedia</span>
                  <span className="text-xl font-black text-emerald-400">
                    {rooms.filter(r => r.currentStatus === 'available').length} Ruang
                  </span>
                </div>
                <div className="bg-black/20 p-2.5 rounded-xl">
                  <span className="text-[11px] text-slate-400 block">Terpakai</span>
                  <span className="text-xl font-black text-rose-400">
                    {rooms.filter(r => r.currentStatus === 'occupied').length} Ruang
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Rapat Hari Ini:</span>
                <strong className="text-white font-mono">
                  {bookings.filter(b => b.meeting_date === dateString).length} Acara
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: ROOM DASHBOARD & DATE SELECTOR */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Status 4 Ruang Meeting
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cek ketersediaan dan status langsung untuk tanggal yang Anda tentukan
              </p>
            </div>

            {/* Date Selector & Manual Refresh */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white rounded-xl border border-slate-300 px-3 py-1.5 shadow-2xs">
                <CalendarIcon className="w-4 h-4 text-slate-500 mr-2" />
                <input
                  type="date"
                  value={dateString}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setSelectedDate(new Date(y, m - 1, d));
                    }
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition shadow-2xs"
                title="Refresh Status Ruangan"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* 4 Room Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                selectedDate={dateString}
                onBookRoom={(r) => handleOpenBooking(r.id)}
              />
            ))}
          </div>
        </section>

        {/* INTERACTIVE AVAILABILITY TIMELINE */}
        <section>
          <AvailabilityTimeline
            rooms={rooms}
            selectedDate={dateString}
            onSelectSlot={(roomId, start, end) => handleOpenBooking(roomId, start, end)}
            onViewBookingDetails={(b) => setSelectedDetailBooking(b)}
          />
        </section>

        {/* SECTION 7: VISUAL CALENDAR SCHEDULE */}
        <section ref={scheduleSectionRef} className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-900" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Jadwal & Kalender Meeting
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tinjau jadwal harian, mingguan, dan bulanan untuk seluruh ruang rapat
              </p>
            </div>

            <button
              onClick={() => handleOpenBooking()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Jadwal</span>
            </button>
          </div>

          <VisualCalendar
            bookings={bookings}
            rooms={basicRooms}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            onViewBookingDetails={(b) => setSelectedDetailBooking(b)}
            onQuickBook={(roomId, dateStr) => {
              const [y, m, d] = dateStr.split('-').map(Number);
              setSelectedDate(new Date(y, m - 1, d));
              handleOpenBooking(roomId);
            }}
          />
        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-600" />
            <span className="font-bold text-slate-800">Meeting Room Booking System</span>
            <span>• Solusi Reservasi Terpusat Perusahaan</span>
          </div>
          <div>
            <span>Sistem dilengkapi proteksi pencegahan jadwal bentrok transaksional PostgreSQL.</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        rooms={basicRooms}
        initialRoomId={modalRoomId}
        initialDate={dateString}
        initialStartTime={modalStartTime}
        initialEndTime={modalEndTime}
        onBookingSuccess={handleBookingSuccess}
      />

      <BookingConfirmationModal
        booking={confirmedBooking}
        onClose={() => setConfirmedBooking(null)}
      />

      <CancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onCancellationSuccess={handleCancellationSuccess}
      />

      <BookingDetailModal
        booking={selectedDetailBooking}
        onClose={() => setSelectedDetailBooking(null)}
      />

    </div>
  );
}

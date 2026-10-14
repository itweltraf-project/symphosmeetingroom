'use client';

import React from 'react';
import { RoomWithStatus } from '@/lib/types';
import { Users, Clock, Calendar, CheckCircle2, AlertCircle, PlayCircle, Sparkles, Tv, Wifi, Video } from 'lucide-react';

interface RoomCardProps {
  room: RoomWithStatus;
  onBookRoom: (room: RoomWithStatus) => void;
  selectedDate: string;
}

const ROOM_BACKGROUNDS: Record<string, string> = {
  R1: '/rooms/room-r1.jpg',
  R2: '/rooms/room-r2.jpg',
  R3: '/rooms/room-r3.jpg',
  R4: '/rooms/room-r4.jpg',
};

export function RoomCard({ room, onBookRoom, selectedDate }: RoomCardProps) {
  const isAvailable = room.currentStatus === 'available';
  const isOccupied = room.currentStatus === 'occupied';
  const isUpcoming = room.currentStatus === 'upcoming';

  const roomBg = ROOM_BACKGROUNDS[room.room_code] || '/rooms/room-r1.jpg';

  const statusConfig = {
    available: {
      badgeBg: 'bg-emerald-50/90 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
      pulseClass: 'status-pulse-available',
      label: 'Ruangan Tersedia',
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      headerBg: 'bg-emerald-500/10',
      ringColor: 'ring-emerald-500/10',
    },
    occupied: {
      badgeBg: 'bg-rose-50/90 text-rose-800 border-rose-300',
      dotColor: 'bg-rose-600',
      pulseClass: 'status-pulse-occupied',
      label: 'Ruangan Terpakai',
      borderColor: 'border-rose-200 hover:border-rose-400',
      headerBg: 'bg-rose-500/10',
      ringColor: 'ring-rose-500/10',
    },
    upcoming: {
      badgeBg: 'bg-amber-50/90 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
      pulseClass: 'status-pulse-upcoming',
      label: 'Akan Datang Segera',
      borderColor: 'border-amber-200 hover:border-amber-400',
      headerBg: 'bg-amber-500/10',
      ringColor: 'ring-amber-500/10',
    },
  }[room.currentStatus];

  const getFacilityIcon = (facilityName: string) => {
    const lower = facilityName.toLowerCase();
    if (lower.includes('tv') || lower.includes('monitor') || lower.includes('proyektor')) {
      return <Tv className="w-3 h-3 text-slate-500 shrink-0" />;
    }
    if (lower.includes('wifi') || lower.includes('lan')) {
      return <Wifi className="w-3 h-3 text-slate-500 shrink-0" />;
    }
    if (lower.includes('video') || lower.includes('conference') || lower.includes('polycom') || lower.includes('jete')) {
      return <Video className="w-3 h-3 text-slate-500 shrink-0" />;
    }
    return null;
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-lg flex flex-col justify-between overflow-hidden ${statusConfig.borderColor} ring-4 ${statusConfig.ringColor}`}
    >
      {/* Top Banner with Transparent Meeting Room Background */}
      <div>
        <div className="relative overflow-hidden border-b border-slate-100">
          {/* Transparent Room Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${roomBg})` }}
          />
          {/* Glassmorphic semi-transparent backdrop overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/80 to-white/95 backdrop-blur-[2px]" />

          <div className="relative z-10 p-5 pb-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900/95 text-white font-black text-base sm:text-lg flex items-center justify-center shadow-md shrink-0 border border-white/40">
                  {room.room_code}
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {room.room_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5">
                    <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Kapasitas {room.capacity} Orang</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border backdrop-blur-md shadow-2xs ${statusConfig.badgeBg}`}
              >
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${statusConfig.dotColor} ${statusConfig.pulseClass}`} />
                <span>{statusConfig.label}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed mb-3">
              {room.description}
            </p>

            {/* Facilities Pills with icons */}
            <div className="flex flex-wrap gap-1.5 mb-1">
              {room.facilities.slice(0, 3).map((f, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold bg-white/90 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/90 shadow-2xs backdrop-blur-xs flex items-center gap-1"
                >
                  {getFacilityIcon(f)}
                  <span>{f}</span>
                </span>
              ))}
              {room.facilities.length > 3 && (
                <span className="text-[11px] font-semibold bg-white/90 text-slate-500 px-1.5 py-0.5 rounded-md border border-slate-200/90 shadow-2xs">
                  +{room.facilities.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current State Detailed Panel */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-b border-slate-100 text-xs">
          {isOccupied && room.currentBooking ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-rose-700 font-semibold">
                <span className="flex items-center gap-1">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Sedang Berlangsung:
                </span>
                <span className="font-mono bg-rose-100 px-2 py-0.5 rounded text-rose-800">
                  {room.currentBooking.start_time} - {room.currentBooking.end_time}
                </span>
              </div>
              <p className="font-bold text-slate-800 text-sm truncate">
                {room.currentBooking.meeting_title}
              </p>
              <div className="flex items-center justify-between text-slate-500 pt-0.5">
                <span className="truncate">Oleh: <strong className="text-slate-700">{room.currentBooking.employee_name}</strong></span>
                <span className="text-slate-400">({room.currentBooking.department})</span>
              </div>
            </div>
          ) : isUpcoming && room.upcomingBooking ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-amber-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Rapat Mendatang:
                </span>
                <span className="font-mono bg-amber-100 px-2 py-0.5 rounded text-amber-800">
                  {room.upcomingBooking.start_time} - {room.upcomingBooking.end_time}
                </span>
              </div>
              <p className="font-bold text-slate-800 text-sm truncate">
                {room.upcomingBooking.meeting_title}
              </p>
              <div className="flex items-center justify-between text-slate-500 pt-0.5">
                <span className="truncate">Oleh: <strong className="text-slate-700">{room.upcomingBooking.employee_name}</strong></span>
                <span className="text-slate-400">({room.upcomingBooking.department})</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-slate-600 py-1">
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tidak ada meeting saat ini
              </span>
              <span className="text-slate-500 font-medium">Bebas dipakai</span>
            </div>
          )}

          {/* Next Available Time Info */}
          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Status Ketersediaan:</span>
            <span className="font-semibold text-slate-700">{room.nextAvailableTime}</span>
          </div>

          {/* Jam Sudah Terbooking Hari Ini */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-red-600" />
                Jam Sudah Terbooking:
              </span>
              <span className="text-[10px] text-slate-600 font-mono font-bold bg-slate-200/70 px-1.5 py-0.5 rounded">
                {room.bookingsToday.length} jadwal
              </span>
            </div>

            {room.bookingsToday.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {room.bookingsToday.map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs"
                    title={`${b.meeting_title} (${b.employee_name} - ${b.department})`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{b.start_time} - {b.end_time}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Kosong seharian (Bebas booking kapan saja)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 bg-white flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          <span>{room.bookingsToday.length} agenda hari ini</span>
        </div>

        <button
          onClick={() => onBookRoom(room)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition shadow-xs hover:shadow cursor-pointer min-h-[38px]"
        >
          <span>Booking {room.room_code}</span>
        </button>
      </div>
    </div>
  );
}

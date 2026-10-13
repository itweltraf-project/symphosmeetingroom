'use client';

import React from 'react';
import { RoomWithStatus } from '@/lib/types';
import { Users, Clock, Calendar, CheckCircle2, AlertCircle, PlayCircle, Sparkles } from 'lucide-react';

interface RoomCardProps {
  room: RoomWithStatus;
  onBookRoom: (room: RoomWithStatus) => void;
  selectedDate: string;
}

export function RoomCard({ room, onBookRoom, selectedDate }: RoomCardProps) {
  const isAvailable = room.currentStatus === 'available';
  const isOccupied = room.currentStatus === 'occupied';
  const isUpcoming = room.currentStatus === 'upcoming';

  const statusConfig = {
    available: {
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      pulseClass: 'status-pulse-available',
      label: 'Ruangan Tersedia',
      borderColor: 'border-emerald-200 hover:border-emerald-300',
      headerBg: 'bg-emerald-500/10',
      ringColor: 'ring-emerald-500/10',
    },
    occupied: {
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-600',
      pulseClass: 'status-pulse-occupied',
      label: 'Ruangan Terpakai',
      borderColor: 'border-rose-200 hover:border-rose-300',
      headerBg: 'bg-rose-500/10',
      ringColor: 'ring-rose-500/10',
    },
    upcoming: {
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      pulseClass: 'status-pulse-upcoming',
      label: 'Akan Datang Segera',
      borderColor: 'border-amber-200 hover:border-amber-300',
      headerBg: 'bg-amber-500/10',
      ringColor: 'ring-amber-500/10',
    },
  }[room.currentStatus];

  return (
    <div
      className={`relative bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${statusConfig.borderColor} ring-4 ${statusConfig.ringColor}`}
    >
      {/* Top Banner & Room Code */}
      <div>
        <div className="p-5 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white font-black text-base sm:text-lg flex items-center justify-center shadow-xs shrink-0">
                {room.room_code}
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {room.room_name}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Kapasitas {room.capacity} Orang</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${statusConfig.badgeBg}`}
            >
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${statusConfig.dotColor} ${statusConfig.pulseClass}`} />
              <span>{statusConfig.label}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
            {room.description}
          </p>

          {/* Facilities Pills */}
          <div className="flex flex-wrap gap-1 mb-4">
            {room.facilities.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
              >
                {f}
              </span>
            ))}
            {room.facilities.length > 3 && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                +{room.facilities.length - 3}
              </span>
            )}
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
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 bg-white flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          <span>{room.bookingsToday.length} agenda hari ini</span>
        </div>

        <button
          onClick={() => onBookRoom(room)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition shadow-xs hover:shadow cursor-pointer"
        >
          <span>Pesan {room.room_code}</span>
        </button>
      </div>
    </div>
  );
}

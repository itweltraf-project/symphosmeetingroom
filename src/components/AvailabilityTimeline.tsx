'use client';

import React from 'react';
import { RoomWithStatus, Booking } from '@/lib/types';
import { Clock, Info } from 'lucide-react';

interface AvailabilityTimelineProps {
  rooms: RoomWithStatus[];
  selectedDate: string;
  onSelectSlot: (roomId: string, startTime: string, endTime: string) => void;
  onViewBookingDetails: (booking: Booking) => void;
}

export function AvailabilityTimeline({
  rooms,
  selectedDate,
  onSelectSlot,
  onViewBookingDetails,
}: AvailabilityTimelineProps) {
  // Operating hours: 07:00 to 20:00 (13 hours)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 to 20

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const startHourMin = 7 * 60; // 07:00 in minutes
  const totalDurationMin = 14 * 60; // 14 hours in minutes (07:00 - 21:00)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600" />
            Matriks Ketersediaan Ruangan Harian
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal operasional 07:00 - 21:00 WIB. Klik area kosong untuk memesan ruangan langsung.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
            <span className="text-slate-600">Tersedia (Bebas)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 shadow-xs" />
            <span className="text-slate-600">Terisi (Confirmed)</span>
          </div>
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[760px]">
          
          {/* Header Hours Grid */}
          <div className="flex pl-24 pr-4 pb-2 border-b border-slate-200 text-xs font-mono text-slate-500 font-semibold">
            {hours.map((h) => (
              <div key={h} className="flex-1 text-center border-l border-slate-200/60 first:border-l-0">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Rooms Rows */}
          <div className="divide-y divide-slate-100">
            {rooms.map((room) => {
              const bookings = room.bookingsToday || [];

              return (
                <div key={room.id} className="flex items-center py-3 group">
                  {/* Room Label */}
                  <div className="w-24 shrink-0 pr-3">
                    <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs flex items-center justify-center font-black">
                        {room.room_code}
                      </span>
                      <span>{room.room_code}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate block">
                      {room.capacity} org
                    </span>
                  </div>

                  {/* Visual Bar Timeline */}
                  <div
                    className="flex-1 h-12 bg-slate-50 rounded-xl relative border border-slate-200/70 overflow-hidden cursor-pointer hover:border-slate-300 transition"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                      const clickedMinute = startHourMin + percentage * totalDurationMin;
                      
                      const roundHour = Math.floor(clickedMinute / 60);
                      const roundMin = Math.floor((clickedMinute % 60) / 15) * 15;
                      
                      const startStr = `${String(roundHour).padStart(2, '0')}:${String(roundMin).padStart(2, '0')}`;
                      const endHour = roundHour + 1;
                      const endStr = `${String(endHour).padStart(2, '0')}:${String(roundMin).padStart(2, '0')}`;

                      onSelectSlot(room.id, startStr, endStr);
                    }}
                    title="Klik di sini untuk memilih waktu booking"
                  >
                    {/* Hour grid vertical separators */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {hours.map((h) => (
                        <div key={h} className="flex-1 border-r border-slate-200/40 last:border-r-0" />
                      ))}
                    </div>

                    {/* Bookings Blocks */}
                    {bookings.map((b) => {
                      const bStart = timeToMinutes(b.start_time);
                      const bEnd = timeToMinutes(b.end_time);

                      // Calculate percentage position
                      const leftPercent = Math.max(0, ((bStart - startHourMin) / totalDurationMin) * 100);
                      const rightPercent = Math.min(100, ((bEnd - startHourMin) / totalDurationMin) * 100);
                      const widthPercent = Math.max(2, rightPercent - leftPercent);

                      return (
                        <div
                          key={b.id}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewBookingDetails(b);
                          }}
                          className="absolute top-1 bottom-1 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs px-2 flex flex-col justify-center cursor-pointer transition z-10 overflow-hidden group/block border border-red-700"
                          title={`${b.start_time} - ${b.end_time}: ${b.meeting_title} (${b.employee_name})`}
                        >
                          <div className="text-[11px] font-bold truncate leading-tight">
                            {b.meeting_title}
                          </div>
                          <div className="text-[9px] text-red-100 font-mono truncate leading-tight opacity-90">
                            {b.start_time}-{b.end_time} • {b.employee_name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

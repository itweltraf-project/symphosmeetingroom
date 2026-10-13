'use client';

import React, { useState, useMemo } from 'react';
import { Booking, RoomCode, MeetingRoom } from '@/lib/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Filter, 
  Clock, 
  User, 
  Briefcase,
  Users
} from 'lucide-react';
import { 
  format, 
  addDays, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  startOfMonth, 
  endOfMonth,
  isToday
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface VisualCalendarProps {
  bookings: Booking[];
  rooms: MeetingRoom[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onViewBookingDetails: (booking: Booking) => void;
  onQuickBook?: (roomId: string, dateStr: string) => void;
}

type CalendarViewMode = 'daily' | 'weekly' | 'monthly';

export function VisualCalendar({
  bookings,
  rooms,
  selectedDate,
  onSelectDate,
  onViewBookingDetails,
  onQuickBook,
}: VisualCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('daily');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');

  // Filtered rooms
  const activeRooms = useMemo(() => {
    if (selectedRoomFilter === 'all') return rooms;
    return rooms.filter((r) => r.room_code === selectedRoomFilter || r.id === selectedRoomFilter);
  }, [rooms, selectedRoomFilter]);

  // Date navigation handlers
  const handlePrev = () => {
    if (viewMode === 'daily') onSelectDate(subDays(selectedDate, 1));
    else if (viewMode === 'weekly') onSelectDate(subDays(selectedDate, 7));
    else if (viewMode === 'monthly') onSelectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNext = () => {
    if (viewMode === 'daily') onSelectDate(addDays(selectedDate, 1));
    else if (viewMode === 'weekly') onSelectDate(addDays(selectedDate, 7));
    else if (viewMode === 'monthly') onSelectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    onSelectDate(new Date());
  };

  // Week interval
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month days
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthGridDays = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) });

  // Hours 07:00 to 20:00
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  // Filter bookings by room
  const activeBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (b.status !== 'Confirmed') return false;
      if (selectedRoomFilter === 'all') return true;
      return b.room_code === selectedRoomFilter || b.room_id === selectedRoomFilter;
    });
  }, [bookings, selectedRoomFilter]);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Calendar Control Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
        
        {/* Navigation & Date Display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg capitalize leading-tight">
              {viewMode === 'daily' && format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })}
              {viewMode === 'weekly' && `Minggu: ${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy', { locale: localeId })}`}
              {viewMode === 'monthly' && format(selectedDate, 'MMMM yyyy', { locale: localeId })}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {activeBookings.length} total agenda terkonfirmasi
            </span>
          </div>
        </div>

        {/* View Mode & Room Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Room Filter Dropdown */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Semua Ruangan (R1 - R4)</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.room_code}>
                  Ruang {r.room_code} - {r.room_name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-2xs text-xs font-bold">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'daily'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian (Daily)
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'weekly'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mingguan (Weekly)
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'monthly'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan (Monthly)
            </button>
          </div>
        </div>

      </div>

      {/* VIEW MODE 1: DAILY VIEW (Columns per Room) */}
      {viewMode === 'daily' && (
        <div className="p-4 sm:p-6 overflow-x-auto">
          <div className="min-w-[720px] grid grid-cols-4 gap-4">
            {activeRooms.map((room) => {
              const roomBookings = activeBookings
                .filter((b) => b.room_id === room.id && b.meeting_date === dateString)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <div key={room.id} className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 flex flex-col">
                  {/* Room Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                        {room.room_code}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs truncate max-w-[120px]">
                          {room.room_name}
                        </h4>
                        <span className="text-[10px] text-slate-500">Kapasitas {room.capacity} org</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                      {roomBookings.length}
                    </span>
                  </div>

                  {/* Bookings Stack for this room */}
                  <div className="space-y-2.5 flex-1 min-h-[220px]">
                    {roomBookings.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                        <CalendarIcon className="w-8 h-8 stroke-1 text-slate-300 mb-1" />
                        <span className="text-xs font-medium">Tidak ada meeting</span>
                        <span className="text-[10px] text-slate-400">Ruangan bebas seharian</span>
                        {onQuickBook && (
                          <button
                            onClick={() => onQuickBook(room.id, dateString)}
                            className="mt-3 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                          >
                            + Pesan Jam Bebas
                          </button>
                        )}
                      </div>
                    ) : (
                      roomBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => onViewBookingDetails(b)}
                          className="bg-white hover:bg-red-50/40 border border-slate-200/90 hover:border-red-300 rounded-xl p-3 shadow-2xs transition cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-red-700 mb-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-red-500" />
                              {b.start_time} - {b.end_time}
                            </span>
                            <span className="text-[10px] font-sans font-medium text-slate-400">
                              Ref #{b.booking_reference.split('-').pop()}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-xs group-hover:text-red-700 transition line-clamp-2">
                            {b.meeting_title}
                          </h5>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="truncate font-medium text-slate-700">{b.employee_name}</span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[80px]">({b.department})</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: WEEKLY VIEW */}
      {viewMode === 'weekly' && (
        <div className="p-4 sm:p-6 overflow-x-auto">
          <div className="min-w-[840px] grid grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isCurrentDay = isToday(day);
              const dayBookings = activeBookings
                .filter((b) => b.meeting_date === dayStr)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <div
                  key={dayStr}
                  className={`rounded-xl border p-2.5 flex flex-col min-h-[300px] ${
                    isCurrentDay
                      ? 'bg-red-50/20 border-red-300 ring-2 ring-red-400/20'
                      : 'bg-slate-50/50 border-slate-200/80'
                  }`}
                >
                  <div className="text-center pb-2 border-b border-slate-200 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      {format(day, 'EEE', { locale: localeId })}
                    </span>
                    <span
                      className={`text-sm font-black inline-block mt-0.5 px-2 py-0.5 rounded-full ${
                        isCurrentDay ? 'bg-red-600 text-white' : 'text-slate-900'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayBookings.length === 0 ? (
                      <span className="text-[10px] text-slate-400 block text-center mt-6">
                        Kosong
                      </span>
                    ) : (
                      dayBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => onViewBookingDetails(b)}
                          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-2 text-left shadow-2xs cursor-pointer transition"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-red-700">
                            <span className="bg-slate-900 text-white px-1 rounded text-[9px]">
                              {b.room_code}
                            </span>
                            <span className="font-mono">{b.start_time}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-800 line-clamp-1 mt-1">
                            {b.meeting_title}
                          </p>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {b.employee_name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: MONTHLY VIEW */}
      {viewMode === 'monthly' && (
        <div className="p-4 sm:p-6">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthGridDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
              const isCurrentDay = isToday(day);
              const dayBookings = activeBookings.filter((b) => b.meeting_date === dayStr);

              return (
                <div
                  key={dayStr}
                  onClick={() => {
                    onSelectDate(day);
                    setViewMode('daily');
                  }}
                  className={`min-h-[90px] p-2 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer hover:border-red-300 ${
                    !isCurrentMonth
                      ? 'bg-slate-50/30 text-slate-300 border-slate-100'
                      : isCurrentDay
                      ? 'bg-red-50/30 border-red-300 ring-2 ring-red-400/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isCurrentDay
                          ? 'bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-black'
                          : isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayBookings.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="text-[10px] truncate bg-red-50 text-red-800 font-medium px-1.5 py-0.5 rounded border border-red-100"
                      >
                        <strong className="text-slate-900">{b.room_code}</strong> {b.start_time}: {b.meeting_title}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <span className="text-[9px] font-bold text-slate-400 block text-right">
                        +{dayBookings.length - 2} lagi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

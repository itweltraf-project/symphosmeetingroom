'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, PlusCircle, XCircle, Shield, Building2 } from 'lucide-react';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenCancel: () => void;
  onScrollToSchedule: () => void;
}

export function Navbar({ onOpenBooking, onOpenCancel, onScrollToSchedule }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Indonesian Date format: Selasa, 13 Oktober 2026
      const dateFormatted = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);

      // Time format: 14:35:10 WIB
      const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

      setCurrentDate(dateFormatted);
      setCurrentTime(timeFormatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  MEETING ROOM
                </span>
                <span className="text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  BOOKING
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Sistem Reservasi Ruang Rapat Terpusat
              </p>
            </div>
          </div>

          {/* Live Date & Time Display */}
          <div className="hidden lg:flex items-center space-x-6 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center text-sm font-semibold text-slate-700 space-x-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{currentDate || 'Memuat tanggal...'}</span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center text-sm font-bold text-red-600 space-x-2 font-mono">
              <Clock className="w-4 h-4 text-red-500" />
              <span>{currentTime || '--:--:-- WIB'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onScrollToSchedule}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              Jadwal Meeting
            </button>

            <button
              onClick={onOpenCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition border border-slate-200"
              title="Batalkan Booking dengan Kode Referensi"
            >
              <XCircle className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
              <span className="hidden sm:inline">Batal Booking</span>
            </button>

            <button
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Pesan Ruangan</span>
            </button>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200"
              title="Masuk ke Dashboard Administrator"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}

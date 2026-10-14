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
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(now);

      // Time format: 14:35 WIB
      const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

      setCurrentDate(dateFormatted);
      setCurrentTime(timeFormatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & System Title */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink mr-1">
            <div className="h-9 sm:h-11 flex items-center justify-center shrink-0">
              <img
                src="/weltraf-logo-transparent.png"
                alt="Weltraf Transformer Logo"
                className="h-7 sm:h-9 w-auto max-w-[130px] sm:max-w-none object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div className="border-l border-slate-200 pl-2 sm:pl-2.5 hidden min-[440px]:block min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 leading-none truncate">
                  MEETING ROOM
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full leading-none shrink-0">
                  BOOKING
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block mt-0.5">
                PT. Symphos Electric
              </p>
            </div>
          </Link>

          {/* Live Date & Time Display (Desktop) */}
          <div className="hidden lg:flex items-center space-x-5 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center text-sm font-semibold text-slate-700 space-x-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{currentDate || 'Memuat...'}</span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center text-sm font-bold text-red-600 space-x-2 font-mono">
              <Clock className="w-4 h-4 text-red-500" />
              <span>{currentTime || '--:-- WIB'}</span>
            </div>
          </div>

          {/* Action Buttons (Separated, Never Colliding) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tombol Batal */}
            <button
              onClick={onOpenCancel}
              className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:text-red-700 hover:bg-red-50 bg-white rounded-xl transition border border-slate-200 shadow-2xs shrink-0 cursor-pointer active:scale-95"
              title="Batalkan Booking"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 shrink-0" />
              <span className="text-[11px] sm:text-xs">Batal</span>
            </button>

            {/* Tombol Booking */}
            <button
              onClick={onOpenBooking}
              className="inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition cursor-pointer shrink-0 active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Booking</span>
            </button>

            {/* Tombol Admin */}
            <Link
              href="/admin"
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200 shrink-0 active:scale-95"
              title="Masuk ke Dashboard Administrator"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          </div>

        </div>

        {/* Mobile Clock Sub-bar */}
        <div className="lg:hidden flex items-center justify-between py-1.5 px-1 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-1 font-medium">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{currentDate}</span>
          </div>
          <div className="flex items-center gap-1 font-mono font-bold text-red-600">
            <Clock className="w-3 h-3 text-red-500" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

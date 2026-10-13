'use client';

import React, { useEffect, useState } from 'react';
import { Booking } from '@/lib/types';
import { CheckCircle2, Copy, Check, Printer, Calendar, Clock, MapPin, User, Building2, KeyRound, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export function BookingConfirmationModal({ booking, onClose }: BookingConfirmationModalProps) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (booking) {
      // Trigger confetti animation
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#dc2626', '#16a34a', '#0f172a', '#f59e0b'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [booking]);

  if (!booking) return null;

  const copyToClipboard = (text: string, type: 'ref' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'ref') {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 sm:p-6 text-white text-center relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-800/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest bg-emerald-800/60 text-emerald-100 px-3 py-1 rounded-full">
            BOOKING BERHASIL DISETUJUI OTOMATIS
          </span>
          <h2 className="text-2xl font-black text-white mt-2">
            Reservasi Terkonfirmasi!
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto">
            Ruangan telah berhasil dipesan dan slot waktu telah dikunci dalam sistem.
          </p>
        </div>

        {/* Ticket Pass Body */}
        <div className="p-6 space-y-5">
          
          {/* Unique Booking Reference Code */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Kode Referensi Booking Unik:
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-wider">
                {booking.booking_reference}
              </span>
              <button
                onClick={() => copyToClipboard(booking.booking_reference, 'ref')}
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition shadow-2xs"
                title="Salin Kode Referensi"
              >
                {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Simpan kode ini sebagai bukti reservasi ruangan meeting Anda.
            </span>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs">
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                Ruangan:
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {booking.room_name || `Ruang ${booking.room_code}`}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Tanggal:
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {booking.meeting_date}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                Waktu Pelaksanaan:
              </span>
              <span className="font-bold text-red-700 font-mono bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200">
                {booking.start_time} - {booking.end_time} WIB
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Pemesan:
              </span>
              <span className="font-semibold text-slate-800">
                {booking.employee_name} ({booking.department})
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                Agenda / Judul:
              </span>
              <span className="font-bold text-slate-800 truncate max-w-[220px]">
                {booking.meeting_title}
              </span>
            </div>
          </div>

          {/* Cancellation Info & Token */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-amber-950">Mekanisme Pembatalan Reservasi:</span>
              <p className="mt-0.5">
                Jika Anda ingin membatalkan jadwal ini, gunakan menu <strong>Batal Booking</strong> di header dengan memasukkan kode referensi di atas dan token keamanan berikut:
              </p>
              <div className="flex items-center gap-2 mt-1.5 font-mono font-bold text-amber-950 bg-amber-100/80 px-2 py-1 rounded-lg">
                <span className="truncate">{booking.cancellation_token}</span>
                <button
                  onClick={() => copyToClipboard(booking.cancellation_token, 'token')}
                  className="p-1 hover:bg-amber-200 rounded text-amber-800 transition"
                  title="Salin Token Pembatalan"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Tiket / Pass</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition shadow-xs cursor-pointer"
            >
              Selesai & Tutup
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

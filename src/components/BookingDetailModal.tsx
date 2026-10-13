'use client';

import React from 'react';
import { Booking } from '@/lib/types';
import { X, Calendar, Clock, MapPin, User, Building2, Users, FileText } from 'lucide-react';

interface BookingDetailModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
              {booking.room_code || 'MR'}
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">Detail Jadwal Rapat</h3>
              <span className="text-[10px] text-slate-400 font-mono">Ref: {booking.booking_reference}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Agenda Meeting
            </span>
            <h4 className="text-base font-extrabold text-slate-900 leading-snug">
              {booking.meeting_title}
            </h4>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                Ruangan:
              </span>
              <span className="font-bold text-slate-800">
                {booking.room_name || `Ruang ${booking.room_code}`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Tanggal:
              </span>
              <span className="font-semibold text-slate-800 font-mono">
                {booking.meeting_date}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                Waktu:
              </span>
              <span className="font-bold text-red-700 font-mono bg-red-100/60 px-2 py-0.5 rounded">
                {booking.start_time} - {booking.end_time} WIB
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Pemesan:
              </span>
              <span className="font-semibold text-slate-800">
                {booking.employee_name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                Departemen:
              </span>
              <span className="font-medium text-slate-700">
                {booking.department}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Peserta:
              </span>
              <span className="font-medium text-slate-700">
                {booking.participant_count || 1} orang
              </span>
            </div>

            {booking.notes && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Catatan:
                </span>
                <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200">
                  {booking.notes}
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

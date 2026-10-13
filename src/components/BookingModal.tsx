'use client';

import React, { useState, useEffect } from 'react';
import { MeetingRoom, Booking, AlternativeSlot } from '@/lib/types';
import { X, Calendar, Clock, User, Briefcase, FileText, Users, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: MeetingRoom[];
  initialRoomId?: string;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  onBookingSuccess: (booking: Booking) => void;
}

const DEPARTMENTS = [
  'Direksi / Management',
  'Human Resources (HR)',
  'Finance & Accounting',
  'Information Technology (IT)',
  'Engineering & Maintenance',
  'Production & Fabrication',
  'Supply Chain & Logistik',
  'Marketing & Penjualan',
  'Quality Control / HSE',
  'Lainnya (Tulis Sendiri)'
];

export function BookingModal({
  isOpen,
  onClose,
  rooms,
  initialRoomId,
  initialDate,
  initialStartTime,
  initialEndTime,
  onBookingSuccess,
}: BookingModalProps) {
  const [roomId, setRoomId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [department, setDepartment] = useState<string>('Information Technology (IT)');
  const [customDepartment, setCustomDepartment] = useState<string>('');
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [participantCount, setParticipantCount] = useState<number>(4);
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);

  // Pre-fill initial values
  useEffect(() => {
    if (isOpen) {
      setRoomId(initialRoomId || (rooms[0]?.id ?? ''));
      setMeetingDate(initialDate || new Date().toISOString().split('T')[0]);
      if (initialStartTime) setStartTime(initialStartTime);
      if (initialEndTime) setEndTime(initialEndTime);
      setErrorMessage(null);
      setAlternatives([]);
    }
  }, [isOpen, initialRoomId, initialDate, initialStartTime, initialEndTime, rooms]);

  if (!isOpen) return null;

  const selectedRoom = rooms.find((r) => r.id === roomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAlternatives([]);

    // Validation
    if (!employeeName.trim()) {
      setErrorMessage('Nama lengkap karyawan wajib diisi.');
      return;
    }
    const finalDept = department === 'Lainnya (Tulis Sendiri)' ? customDepartment.trim() : department;
    if (!finalDept) {
      setErrorMessage('Departemen wajib diisi.');
      return;
    }
    if (!meetingTitle.trim()) {
      setErrorMessage('Judul atau agenda rapat wajib diisi.');
      return;
    }
    if (!meetingDate) {
      setErrorMessage('Tanggal meeting wajib dipilih.');
      return;
    }
    if (endTime <= startTime) {
      setErrorMessage('Jam selesai harus lebih akhir daripada jam mulai (contoh: 08:15 - 09:45).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          employee_name: employeeName.trim(),
          department: finalDept,
          meeting_title: meetingTitle.trim(),
          meeting_date: meetingDate,
          start_time: startTime,
          end_time: endTime,
          participant_count: Number(participantCount) || 1,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal melakukan pemesanan ruangan');
        if (data.alternatives && data.alternatives.length > 0) {
          setAlternatives(data.alternatives);
        }
        return;
      }

      // Success
      onBookingSuccess(data.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                FORMULIR PEMESANAN
              </span>
              <span className="text-xs text-slate-400">Tanpa Login</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Booking Ruang Meeting
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Error & Conflict Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-rose-900 mb-1">
                    Ruangan Tidak Tersedia
                  </h4>
                  <p>{errorMessage}</p>

                  {/* Suggest alternatives if available */}
                  {alternatives.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-rose-200/80">
                      <span className="font-bold block text-slate-800 mb-1.5">
                        Rekomendasi Ruangan Lain yang Kosong pada Jam Ini:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {alternatives.map((alt) => {
                          const target = rooms.find((r) => r.room_code === alt.room_code);
                          return (
                            <button
                              key={alt.room_code}
                              type="button"
                              onClick={() => {
                                if (target) setRoomId(target.id);
                                setErrorMessage(null);
                                setAlternatives([]);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 hover:border-red-600 rounded-xl text-xs font-bold text-slate-800 hover:text-red-700 transition shadow-2xs"
                            >
                              <span>Pilih {alt.room_name}</span>
                              <ArrowRight className="w-3 h-3 text-red-600" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Room Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Ruangan Meeting <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoomId(r.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    roomId === r.id
                      ? 'border-red-600 bg-red-50/40 ring-2 ring-red-600/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                      {r.room_code}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {r.capacity} org
                    </span>
                  </div>
                  <span className="font-bold text-xs text-slate-800 mt-2 truncate">
                    {r.room_name.split('(')[1]?.replace(')', '') || r.room_name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tanggal Meeting <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={meetingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jam Mulai <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jam Selesai <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            * Waktu bebas dipilih (contoh: 08:15 - 09:45 atau 13:15 - 15:00). Tidak terikat slot kaku.
          </p>

          {/* Employee & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap Karyawan <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Departemen / Divisi <span className="text-red-600">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {department === 'Lainnya (Tulis Sendiri)' && (
            <div>
              <input
                type="text"
                placeholder="Ketik nama departemen Anda..."
                value={customDepartment}
                onChange={(e) => setCustomDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>
          )}

          {/* Meeting Title & Purpose */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul / Keperluan Rapat <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Evaluasi Target Produksi & Quality Review Q4"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              required
            />
          </div>

          {/* Participant Count & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jumlah Peserta (Opsional)
              </label>
              <input
                type="number"
                min="1"
                max={selectedRoom?.capacity || 30}
                value={participantCount}
                onChange={(e) => setParticipantCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Butuh mic wireless & setting zoom"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Jadwal...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Konfirmasi & Simpan Booking</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

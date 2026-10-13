'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MeetingRoom, Booking, AlternativeSlot } from '@/lib/types';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Briefcase, 
  FileText, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

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

  const formBodyRef = useRef<HTMLDivElement>(null);

  // Pre-fill initial values with smart mobile defaults
  useEffect(() => {
    if (isOpen) {
      // Pick room
      const defaultRoomId = initialRoomId || (rooms.length > 0 ? rooms[0].id : '');
      setRoomId(defaultRoomId);

      // Pick date
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setMeetingDate(initialDate || localDate);

      // Smart default time
      if (initialStartTime) {
        setStartTime(initialStartTime);
      } else {
        const curHour = today.getHours();
        if (curHour >= 7 && curHour < 20) {
          const nextH = curHour + 1;
          setStartTime(`${String(nextH).padStart(2, '0')}:00`);
        } else {
          setStartTime('09:00');
        }
      }

      if (initialEndTime) {
        setEndTime(initialEndTime);
      } else {
        const curHour = today.getHours();
        if (curHour >= 7 && curHour < 20) {
          const nextH = curHour + 2;
          setEndTime(`${String(Math.min(nextH, 21)).padStart(2, '0')}:00`);
        } else {
          setEndTime('10:00');
        }
      }

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
      showError('Nama lengkap karyawan wajib diisi.');
      return;
    }
    const finalDept = department === 'Lainnya (Tulis Sendiri)' ? customDepartment.trim() : department;
    if (!finalDept) {
      showError('Departemen wajib diisi.');
      return;
    }
    if (!meetingTitle.trim()) {
      showError('Judul atau agenda rapat wajib diisi.');
      return;
    }
    if (!meetingDate) {
      showError('Tanggal meeting wajib dipilih.');
      return;
    }
    if (endTime <= startTime) {
      showError('Jam selesai harus lebih akhir daripada jam mulai (contoh: 08:15 - 09:45).');
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
        showError(data.error || 'Gagal melakukan pemesanan ruangan');
        if (data.alternatives && data.alternatives.length > 0) {
          setAlternatives(data.alternatives);
        }
        return;
      }

      // Success
      onBookingSuccess(data.data);
      onClose();
    } catch (err: any) {
      showError(err.message || 'Terjadi gangguan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    // Auto-scroll to top smoothly so mobile user immediately sees the alert
    if (formBodyRef.current) {
      formBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      {/* Modal Container */}
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Header - Fixed */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full">
              FORMULIR
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Booking Ruang Meeting
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div ref={formBodyRef} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          
          {/* Error & Conflict Alert */}
          {errorMessage && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-extrabold text-xs sm:text-sm text-rose-950 mb-1">
                    Jadwal Tidak Tersedia / Terjadi Kesalahan
                  </h4>
                  <p className="leading-relaxed font-medium">{errorMessage}</p>

                  {/* Suggest alternatives if available */}
                  {alternatives.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-rose-200">
                      <span className="font-bold block text-slate-900 mb-2">
                        💡 Rekomendasi Ruangan Kosong pada Jam Ini:
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-400 hover:border-red-600 rounded-xl text-xs font-bold text-slate-900 hover:text-red-700 transition shadow-xs cursor-pointer"
                            >
                              <span>Pilih {alt.room_name}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-red-600" />
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
                  onClick={() => {
                    setRoomId(r.id);
                    setErrorMessage(null);
                  }}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer min-h-[58px] ${
                    roomId === r.id
                      ? 'border-red-600 bg-red-50/50 ring-2 ring-red-600/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
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
                  <span className="font-extrabold text-xs text-slate-900 mt-1 truncate">
                    Ruang {r.room_code}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Meeting <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => {
                  setMeetingDate(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3 py-2.5 text-sm sm:text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Mulai <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3 py-2.5 text-sm sm:text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Selesai <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3 py-2.5 text-sm sm:text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>
          </div>

          {/* Employee & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Karyawan <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={employeeName}
                onChange={(e) => {
                  setEmployeeName(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Departemen / Divisi <span className="text-red-600">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
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
                className="w-full px-3 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>
          )}

          {/* Meeting Title & Purpose */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul / Agenda Rapat <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Koordinasi Proyek Fabrikasi & QC"
              value={meetingTitle}
              onChange={(e) => {
                setMeetingTitle(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full px-3 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              required
            />
          </div>

          {/* Participant Count & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jumlah Peserta
              </label>
              <input
                type="number"
                min="1"
                max={selectedRoom?.capacity || 30}
                value={participantCount}
                onChange={(e) => setParticipantCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Butuh mic wireless"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>
          </div>

        </div>

        {/* Sticky Action Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 shrink-0 flex flex-col gap-2">
          {/* Quick error reminder above buttons */}
          {errorMessage && (
            <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1.5 truncate">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer min-h-[42px]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 rounded-xl shadow-md transition cursor-pointer min-h-[42px]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Konfirmasi & Simpan Booking</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

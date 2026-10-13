'use client';

import React, { useState, useEffect } from 'react';
import { Booking, MeetingRoom } from '@/lib/types';
import { X, Save, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';

interface AdminEditModalProps {
  booking: Booking | null;
  rooms: MeetingRoom[];
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export function AdminEditModal({
  booking,
  rooms,
  isOpen,
  onClose,
  onSaveSuccess,
}: AdminEditModalProps) {
  const [roomId, setRoomId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Confirmed' | 'Cancelled'>('Confirmed');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setRoomId(booking.room_id);
      setEmployeeName(booking.employee_name);
      setDepartment(booking.department);
      setMeetingTitle(booking.meeting_title);
      setMeetingDate(booking.meeting_date);
      setStartTime(booking.start_time);
      setEndTime(booking.end_time);
      setParticipantCount(booking.participant_count || 1);
      setNotes(booking.notes || '');
      setStatus(booking.status);
      setErrorMessage(null);
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (endTime <= startTime) {
      setErrorMessage('Jam selesai harus lebih akhir dari jam mulai.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          employee_name: employeeName,
          department,
          meeting_title: meetingTitle,
          meeting_date: meetingDate,
          start_time: startTime,
          end_time: endTime,
          participant_count: Number(participantCount),
          notes,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal mengubah data booking');
        return;
      }

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan booking ini? Slot ruangan akan dilepas untuk karyawan lain.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal membatalkan booking');
        return;
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              PANEL ADMINISTRATOR
            </span>
            <h3 className="font-extrabold text-base text-white">
              Edit Reservasi: {booking.booking_reference}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pilih Ruangan
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Ruang {r.room_code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Status Booking
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-bold"
              >
                <option value="Confirmed">Confirmed (Aktif)</option>
                <option value="Cancelled">Cancelled (Dibatalkan)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jam Mulai
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jam Selesai
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-mono font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Judul / Agenda Meeting
            </label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Pemesan
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Departemen
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Peserta
              </label>
              <input
                type="number"
                min="1"
                value={participantCount}
                onChange={(e) => setParticipantCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Catatan
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {booking.status === 'Confirmed' ? (
              <button
                type="button"
                onClick={handleCancelReservation}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl transition font-bold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Batalkan Reservasi</span>
              </button>
            ) : (
              <span className="text-slate-400 italic">Status telah dibatalkan</span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { XCircle, X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancellationSuccess: () => void;
}

export function CancellationModal({
  isOpen,
  onClose,
  onCancellationSuccess,
}: CancellationModalProps) {
  const [bookingRef, setBookingRef] = useState<string>('');
  const [cancellationToken, setCancellationToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!bookingRef.trim() || !cancellationToken.trim()) {
      setErrorMessage('Kode referensi booking dan token pembatalan wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_reference: bookingRef.trim(),
          cancellation_token: cancellationToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal membatalkan pemesanan');
        return;
      }

      setSuccessMessage(data.message || 'Pemesanan berhasil dibatalkan');
      onCancellationSuccess();
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
        setBookingRef('');
        setCancellationToken('');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 px-4 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600 rounded-xl">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Batalkan Booking
              </h2>
              <p className="text-xs text-slate-400">
                Mekanisme Pembatalan Aman
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Masukkan kode referensi unik dan token keamanan yang Anda terima saat melakukan reservasi. Slot waktu ruangan akan langsung dibebaskan untuk karyawan lain.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kode Referensi Booking <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: MRB-20261013-ABCD"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 text-sm sm:text-xs font-mono font-bold tracking-wider rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Token Keamanan Pembatalan <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Masukkan token keamanan..."
              value={cancellationToken}
              onChange={(e) => setCancellationToken(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm sm:text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer min-h-[42px]"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 rounded-xl transition cursor-pointer min-h-[42px]"
            >
              {loading ? 'Memproses...' : 'Konfirmasi Batal'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

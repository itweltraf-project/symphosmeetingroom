'use client';

import React, { useState } from 'react';
import { XCircle, X, AlertCircle, CheckCircle2, User, CheckSquare, Square } from 'lucide-react';

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
  const [employeeName, setEmployeeName] = useState<string>('');
  const [agreeCancel, setAgreeCancel] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!employeeName.trim()) {
      setErrorMessage('Nama lengkap karyawan wajib diisi.');
      return;
    }

    if (!agreeCancel) {
      setErrorMessage('Silakan centang persetujuan pembatalan terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_name: employeeName.trim(),
          agree_cancel: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal membatalkan booking');
        return;
      }

      setSuccessMessage(data.message || 'Booking berhasil dibatalkan');
      onCancellationSuccess();
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
        setEmployeeName('');
        setAgreeCancel(false);
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-4 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600 rounded-xl shrink-0">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Batalkan Booking
              </h2>
              <p className="text-xs text-slate-400">
                Pelepasan Jadwal Ruangan Rapat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Tidak perlu memasukkan kode booking. Cukup masukkan nama lengkap yang Anda gunakan saat memesan, lalu setujui pembatalan. Slot ruangan akan otomatis dibebaskan kembali.
          </p>

          {/* Input Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Lengkap Karyawan <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={employeeName}
                onChange={(e) => {
                  setEmployeeName(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm sm:text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
            </div>
          </div>

          {/* Persetujuan Checkbox */}
          <div 
            onClick={() => setAgreeCancel(!agreeCancel)}
            className={`p-3.5 rounded-xl border transition cursor-pointer select-none flex items-start gap-3 ${
              agreeCancel 
                ? 'bg-red-50/50 border-red-300 ring-1 ring-red-200' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="mt-0.5 shrink-0 text-red-600">
              {agreeCancel ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-slate-900 block">
                Saya setuju untuk membatalkan booking ruangan ini
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Jadwal yang dibatalkan akan langsung dibuka kembali agar dapat digunakan oleh rekan kerja lain.
              </span>
            </div>
          </div>

          {/* Action Footer */}
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
              disabled={loading || !agreeCancel || !employeeName.trim()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 rounded-xl transition cursor-pointer min-h-[42px] shadow-sm"
            >
              {loading ? 'Memproses Batal...' : 'Konfirmasi Batal Booking'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

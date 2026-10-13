'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DashboardStats, 
  Booking, 
  MeetingRoom, 
  RoomWithStatus, 
  BookingAuditLog 
} from '@/lib/types';
import { VisualCalendar } from '@/components/VisualCalendar';
import { AdminEditModal } from '@/components/AdminEditModal';
import { BookingModal } from '@/components/BookingModal';
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarRange, 
  DoorClosed, 
  FileSpreadsheet, 
  History, 
  Settings, 
  LogOut, 
  Search, 
  Filter, 
  Download, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Building2, 
  RefreshCw,
  ShieldAlert,
  ArrowUpRight,
  Menu,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

type AdminTab = 
  | 'dashboard' 
  | 'all_bookings' 
  | 'room_schedule' 
  | 'meeting_rooms' 
  | 'reports' 
  | 'booking_history' 
  | 'settings';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [roomsWithStatus, setRoomsWithStatus] = useState<RoomWithStatus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [auditLogs, setAuditLogs] = useState<BookingAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Table filters for All Bookings
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Selected booking for editing
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Calendar selected date
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // 1. Verify admin session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        setAdminUser(data.user);
        setAuthChecked(true);
      } catch {
        router.push('/admin/login');
      }
    }
    checkAuth();
  }, [router]);

  // 2. Fetch admin data
  const loadAdminData = useCallback(async () => {
    if (!authChecked) return;
    setRefreshing(true);
    try {
      // Stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      // Rooms with status
      const roomsRes = await fetch('/api/rooms');
      if (roomsRes.ok) {
        const data = await roomsRes.json();
        setRoomsWithStatus(data.data);
        setRooms(data.data);
      }

      // All bookings
      const bookingsRes = await fetch('/api/bookings');
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.data);
      }

      // Audit logs
      const auditRes = await fetch('/api/admin/audit-logs');
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authChecked]);

  useEffect(() => {
    if (authChecked) {
      loadAdminData();
    }
  }, [authChecked, loadAdminData]);

  // Logout handler
  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Export CSV handler
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (filterRoom !== 'all') params.append('roomCode', filterRoom);
    if (filterStatus !== 'all') params.append('status', filterStatus);
    if (filterDepartment !== 'all') params.append('department', filterDepartment);
    if (filterStartDate) params.append('startDate', filterStartDate);
    if (filterEndDate) params.append('endDate', filterEndDate);
    if (searchTerm) params.append('search', searchTerm);

    window.open(`/api/admin/export?${params.toString()}`, '_blank');
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Room
      if (filterRoom !== 'all' && b.room_code !== filterRoom) return false;
      // Status
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      // Department
      if (filterDepartment !== 'all' && !b.department.toLowerCase().includes(filterDepartment.toLowerCase())) return false;
      // Dates
      if (filterStartDate && b.meeting_date < filterStartDate) return false;
      if (filterEndDate && b.meeting_date > filterEndDate) return false;
      // Search
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const match =
          b.employee_name.toLowerCase().includes(s) ||
          b.meeting_title.toLowerCase().includes(s) ||
          b.booking_reference.toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });
  }, [bookings, filterRoom, filterStatus, filterDepartment, filterStartDate, filterEndDate, searchTerm]);

  // Departments list for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (b.department) set.add(b.department);
    });
    return Array.from(set).sort();
  }, [bookings]);

  // Room config toggle active
  const toggleRoomActive = async (room: MeetingRoom) => {
    try {
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !room.is_active }),
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      alert('Gagal mengubah status aktif ruangan');
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span>Memverifikasi otorisasi administrator...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Brand Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between md:block">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black shadow-md shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-sm tracking-tight leading-none">
                  ADMIN PORTAL
                </h2>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Meeting Room System
                </span>
              </div>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700 cursor-pointer"
              title="Menu Navigasi"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:block mt-4 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Logged In As:</span>
              <strong className="text-white truncate block">{adminUser?.email}</strong>
            </div>
          </div>

          {/* Mobile Horizontal Quick Tab Bar (when menu collapsed) */}
          <div className="md:hidden flex overflow-x-auto p-2 gap-1.5 border-b border-slate-800 bg-slate-950/40">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'all_bookings', label: 'Bookings', icon: FileSpreadsheet },
              { id: 'room_schedule', label: 'Jadwal', icon: CalendarRange },
              { id: 'meeting_rooms', label: 'Ruangan', icon: DoorClosed },
              { id: 'reports', label: 'Laporan', icon: BarChart3 },
              { id: 'booking_history', label: 'Audit', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as AdminTab);
                    setMobileNavOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Links */}
          <nav className={`${mobileNavOpen ? 'block' : 'hidden md:block'} p-3 sm:p-4 space-y-1 text-xs font-semibold`}>
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('all_bookings');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer ${
                activeTab === 'all_bookings'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>All Bookings</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('room_schedule');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer ${
                activeTab === 'room_schedule'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              <span>Room Schedule</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('meeting_rooms');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer ${
                activeTab === 'meeting_rooms'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <DoorClosed className="w-4 h-4" />
              <span>Meeting Rooms</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('reports');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('booking_history');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer ${
                activeTab === 'booking_history'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Booking History (Audit)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className={`${mobileNavOpen ? 'block' : 'hidden md:block'} p-3 sm:p-4 border-t border-slate-800 space-y-2`}>
          <div className="md:hidden p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] mb-2">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Logged In As:</span>
            <strong className="text-white truncate block">{adminUser?.email}</strong>
          </div>

          <Link
            href="/"
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <span>Halaman Publik</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Administrator</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 capitalize">
              {activeTab.replace('_', ' ')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola data reservasi, konfigurasi ruangan, dan log audit perusahaan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Buat Booking Baru</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* 6 STATISTIC CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              
              {/* Stat 1: Total Bookings Today */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block">Bookings Hari Ini</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {stats?.totalBookingsToday ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Total terkonfirmasi</span>
              </div>

              {/* Stat 2: Available Rooms */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-700 block">Ruangan Tersedia</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {stats?.availableRoomsCount ?? 0}
                </span>
                <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Siap digunakan</span>
              </div>

              {/* Stat 3: Occupied Rooms */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-rose-700 block">Ruangan Terpakai</span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">
                  {stats?.occupiedRoomsCount ?? 0}
                </span>
                <span className="text-[10px] text-rose-600/80 mt-0.5 block">Sedang meeting</span>
              </div>

              {/* Stat 4: Upcoming Meetings */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-amber-700 block">Akan Datang</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">
                  {stats?.upcomingMeetingsCount ?? 0}
                </span>
                <span className="text-[10px] text-amber-600/80 mt-0.5 block">Dalam 90 menit</span>
              </div>

              {/* Stat 5: Total Meeting Hours Today */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block">Total Jam Rapat</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {stats?.totalMeetingHoursToday ?? 0} <span className="text-xs font-semibold text-slate-400">jam</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Durasi hari ini</span>
              </div>

              {/* Stat 6: Most Used Room */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block">Ruangan Favorit</span>
                <span className="text-xl font-black text-slate-900 mt-1 block truncate">
                  {stats?.mostUsedRoom ? `Ruang ${stats.mostUsedRoom.room_code}` : '-'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                  {stats?.mostUsedRoom?.bookingCount ?? 0}x pemesanan
                </span>
              </div>

            </div>

            {/* Room Operational Live Status Overview */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">
                Status Operasional 4 Ruang Meeting Saat Ini
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {roomsWithStatus.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-xl border text-xs ${
                      r.currentStatus === 'occupied'
                        ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                        : r.currentStatus === 'upcoming'
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-sm">{r.room_code}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white shadow-2xs">
                        {r.currentStatus}
                      </span>
                    </div>
                    <span className="block font-semibold truncate">{r.room_name}</span>
                    <span className="block text-[11px] opacity-80 mt-1">{r.nextAvailableTime}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bookings Feed */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">
                  10 Jadwal Booking Terkini
                </h3>
                <button
                  onClick={() => setActiveTab('all_bookings')}
                  className="text-xs font-bold text-red-600 hover:text-red-700"
                >
                  Lihat Semua Booking &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Kode Ref</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Ruang</th>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Pemesan</th>
                      <th className="py-2.5 px-3">Agenda</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {bookings.slice(0, 10).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{b.booking_reference}</td>
                        <td className="py-2.5 px-3 font-mono">{b.meeting_date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{b.room_code}</td>
                        <td className="py-2.5 px-3 font-mono text-red-700 font-bold">{b.start_time}-{b.end_time}</td>
                        <td className="py-2.5 px-3">{b.employee_name} ({b.department})</td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate">{b.meeting_title}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ALL BOOKINGS MANAGEMENT */}
        {activeTab === 'all_bookings' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            
            {/* Filter Toolbar */}
            <div className="p-5 border-b border-slate-200 space-y-3 bg-slate-50/60">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari nama karyawan, judul agenda, atau kode ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition shadow-2xs cursor-pointer"
                  title="Ekspor seluruh data atau data terfilter ke format CSV"
                >
                  <Download className="w-4 h-4 text-red-600" />
                  <span>Ekspor CSV</span>
                </button>
              </div>

              {/* Secondary Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {/* Room */}
                <select
                  value={filterRoom}
                  onChange={(e) => setFilterRoom(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                >
                  <option value="all">Semua Ruang (R1-R4)</option>
                  <option value="R1">Ruang R1</option>
                  <option value="R2">Ruang R2</option>
                  <option value="R3">Ruang R3</option>
                  <option value="R4">Ruang R4</option>
                </select>

                {/* Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                >
                  <option value="all">Semua Status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                {/* Department */}
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                >
                  <option value="all">Semua Departemen</option>
                  {departmentsList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Start Date */}
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700"
                  title="Filter dari tanggal"
                />

                {/* End Date */}
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700"
                  title="Filter sampai tanggal"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Ditemukan <strong>{filteredBookings.length}</strong> reservasi</span>
                {(filterRoom !== 'all' || filterStatus !== 'all' || filterDepartment !== 'all' || filterStartDate || filterEndDate || searchTerm) && (
                  <button
                    onClick={() => {
                      setFilterRoom('all');
                      setFilterStatus('all');
                      setFilterDepartment('all');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setSearchTerm('');
                    }}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

            </div>

            {/* Management Table as specified in Section 9 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Room</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Meeting Title</th>
                    <th className="py-3 px-3">Start Time</th>
                    <th className="py-3 px-3">End Time</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada reservasi yang sesuai dengan filter pencarian
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">{b.meeting_date}</td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold bg-slate-900 text-white px-1.5 py-0.5 rounded text-[10px]">
                            {b.room_code}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{b.employee_name}</td>
                        <td className="py-3 px-4 text-slate-600">{b.department}</td>
                        <td className="py-3 px-4 text-slate-900 font-semibold max-w-[200px] truncate" title={b.meeting_title}>
                          {b.meeting_title}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{b.start_time}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{b.end_time}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingBooking(b);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
                            title="Edit Booking"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 3: ROOM SCHEDULE CALENDAR */}
        {activeTab === 'room_schedule' && (
          <div className="space-y-4">
            <VisualCalendar
              bookings={bookings}
              rooms={rooms}
              selectedDate={calendarDate}
              onSelectDate={(d) => setCalendarDate(d)}
              onViewBookingDetails={(b) => {
                setEditingBooking(b);
                setIsEditModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 4: MEETING ROOMS CONFIGURATION */}
        {activeTab === 'meeting_rooms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {room.room_code}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{room.room_name}</h3>
                      <span className="text-xs text-slate-500">Kapasitas: {room.capacity} orang</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleRoomActive(room)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      room.is_active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    {room.is_active ? 'Aktif' : 'Non-Aktif'}
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {room.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  {room.facilities.map((f, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: REPORTS & STATISTICS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">
                Laporan Utilisasi Ruang Meeting Perusahaan
              </h3>
              <p className="text-xs text-slate-500">
                Analisis frekuensi peminjaman dan distribusi penggunaan ruangan oleh berbagai divisi.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                {rooms.map((r) => {
                  const roomBookings = bookings.filter((b) => b.room_id === r.id && b.status === 'Confirmed');
                  let totalMins = 0;
                  roomBookings.forEach((b) => {
                    const [sh, sm] = b.start_time.split(':').map(Number);
                    const [eh, em] = b.end_time.split(':').map(Number);
                    totalMins += (eh * 60 + em) - (sh * 60 + sm);
                  });

                  return (
                    <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-extrabold text-slate-900 text-base">{r.room_code}</span>
                      <span className="text-xs text-slate-600 block">{r.room_name}</span>
                      <div className="pt-2 text-xs font-bold text-red-600">
                        {roomBookings.length} total agenda ({Math.round(totalMins / 60 * 10) / 10} jam)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: BOOKING HISTORY & AUDIT LOGS */}
        {activeTab === 'booking_history' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="font-extrabold text-sm text-slate-900">
                Log Audit & Riwayat Perubahan Sistem
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Merekam setiap aktivitas pembuatan, pembaruan, dan pembatalan reservasi beserta pihak yang melakukan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Waktu (Timestamp)</th>
                    <th className="py-3 px-3">Aksi</th>
                    <th className="py-3 px-4">Dilakukan Oleh</th>
                    <th className="py-3 px-4">Detail Perubahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Belum ada riwayat audit log
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.action === 'CREATED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.action === 'UPDATED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{log.performed_by}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-[320px] truncate">
                          {log.new_values ? JSON.stringify(log.new_values) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 max-w-2xl">
            <h3 className="font-extrabold text-base text-slate-900">
              Konfigurasi Sistem
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Jam Operasional Peminjaman:</span>
                <span className="text-slate-600">07:00 - 21:00 WIB (Senin - Minggu)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Enjin Penyimpanan Data:</span>
                <span className="text-slate-600 font-mono">
                  PostgreSQL Supabase (Production) / SQLite WAL (Local Persistent)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Integritas Transaksional:</span>
                <span className="text-slate-600">
                  Perlindungan jadwal bentrok dijamin di tingkat database (PostgreSQL exclusion constraint / SQLite immediate transactions).
                </span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODALS FOR ADMIN */}
      <AdminEditModal
        booking={editingBooking}
        rooms={rooms}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBooking(null);
        }}
        onSaveSuccess={loadAdminData}
      />

      <BookingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        rooms={rooms}
        onBookingSuccess={() => loadAdminData()}
      />

    </div>
  );
}

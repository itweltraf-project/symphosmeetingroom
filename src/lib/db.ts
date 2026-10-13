import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  MeetingRoom, 
  Booking, 
  BookingAuditLog, 
  RoomWithStatus, 
  RoomOperationalStatus,
  BookingFilter,
  DashboardStats,
  RoomCode,
  AlternativeSlot
} from './types';

// Detect Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const useSupabase = Boolean(supabaseUrl && supabaseKey);

let supabaseClient: SupabaseClient | null = null;
if (useSupabase) {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
}

// ----------------------------------------------------------------------------
// Local SQLite Engine (Robust zero-dependency persistent storage & fallback)
// ----------------------------------------------------------------------------
let sqliteInstance: DatabaseSync | null = null;

function getSqliteDb(): DatabaseSync {
  if (!sqliteInstance) {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const dbPath = isServerless
      ? path.join('/tmp', 'meeting_rooms.db')
      : path.resolve(process.cwd(), 'meeting_rooms.db');
    sqliteInstance = new DatabaseSync(dbPath);
    sqliteInstance.exec('PRAGMA journal_mode = WAL;');
    initSqliteSchema(sqliteInstance);
  }
  return sqliteInstance;
}

function initSqliteSchema(db: DatabaseSync) {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS meeting_rooms (
      id TEXT PRIMARY KEY,
      room_code TEXT UNIQUE NOT NULL,
      room_name TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 10,
      description TEXT,
      facilities TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_reference TEXT UNIQUE NOT NULL,
      room_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      department TEXT NOT NULL,
      meeting_title TEXT NOT NULL,
      meeting_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      participant_count INTEGER DEFAULT 1,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      cancellation_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      cancelled_at TEXT,
      FOREIGN KEY (room_id) REFERENCES meeting_rooms(id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS booking_audit_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      previous_values TEXT,
      new_values TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_date_room ON bookings(meeting_date, room_id, status);
  `);

  // Ensure room names are simplified to Ruang R1, Ruang R2, Ruang R3, Ruang R4
  db.exec(`
    UPDATE meeting_rooms SET room_name = 'Ruang R1' WHERE room_code = 'R1';
    UPDATE meeting_rooms SET room_name = 'Ruang R2' WHERE room_code = 'R2';
    UPDATE meeting_rooms SET room_name = 'Ruang R3' WHERE room_code = 'R3';
    UPDATE meeting_rooms SET room_name = 'Ruang R4' WHERE room_code = 'R4';
  `);

  // Seed default 4 rooms: R1, R2, R3, R4
  const existingRooms = db.prepare('SELECT COUNT(*) as count FROM meeting_rooms').get() as { count: number };
  if (existingRooms.count === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO meeting_rooms (id, room_code, room_name, capacity, description, facilities, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const now = new Date().toISOString();
    insertRoom.run(
      'room-r1-uuid-0001',
      'R1',
      'Ruang R1',
      16,
      'Ruang rapat dengan proyektor laser 4K, sistem video conference Polycom, sound system, whiteboard kaca, dan AC VIP.',
      JSON.stringify(['Proyektor Laser 4K', 'Video Conference Polycom', 'Wireless Mic & Audio', 'Whiteboard Kaca', 'AC VIP']),
      now
    );

    insertRoom.run(
      'room-r2-uuid-0002',
      'R2',
      'Ruang R2',
      10,
      'Ruang kolaborasi dilengkapi Smart TV 75 inch interaktif, konektivitas wireless screen-cast, dan whiteboard dinding penuh.',
      JSON.stringify(['Smart TV 75" 4K', 'Glass Whiteboard', 'Wireless Presentation', 'Audio Speakerphone', 'AC']),
      now
    );

    insertRoom.run(
      'room-r3-uuid-0003',
      'R3',
      'Ruang R3',
      8,
      'Ruang rapat tim dilengkapi monitor LED 55 inch, whiteboard, conference mic, dan konektivitas LAN/WiFi.',
      JSON.stringify(['Monitor LED 55"', 'Whiteboard', 'Conference Mic', 'High-Speed LAN/WiFi', 'AC']),
      now
    );

    insertRoom.run(
      'room-r4-uuid-0004',
      'R4',
      'Ruang R4',
      6,
      'Ruang diskusi kedap suara untuk sesi rapat internal kecil dan konsultasi tertutup.',
      JSON.stringify(['Monitor LED 50"', 'Soundproofing Panel', 'Whiteboard', 'AC']),
      now
    );

    // Seed default admin
    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (id, email, role, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    // Default pass: Admin#2026!
    insertAdmin.run(
      'admin-uuid-0001',
      'admin@company.com',
      'admin',
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      now
    );

    // Seed initial demo bookings for today so dashboard is immediately rich & demonstrative
    const today = new Date().toISOString().split('T')[0];
    const insertBooking = db.prepare(`
      INSERT INTO bookings (
        id, booking_reference, room_id, employee_name, department, 
        meeting_title, meeting_date, start_time, end_time, participant_count, 
        notes, status, cancellation_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?, ?)
    `);

    // Booking 1: R1 (Morning Review)
    insertBooking.run(
      'b-demo-01',
      `MRB-${today.replace(/-/g, '')}-A101`,
      'room-r1-uuid-0001',
      'Budi Santoso',
      'Direksi / Manajemen',
      'Executive Board Monthly Review Q4',
      today,
      '09:00',
      '11:00',
      12,
      'Mohon siapkan proyektor dan snack box',
      'token-demo-01',
      now,
      now
    );

    // Booking 2: R2 (Design Sprint)
    insertBooking.run(
      'b-demo-02',
      `MRB-${today.replace(/-/g, '')}-B202`,
      'room-r2-uuid-0002',
      'Siti Rahmawati',
      'Product & Design',
      'Design Sprint: New Mobile UI Dashboard',
      today,
      '13:30',
      '15:00',
      8,
      'Menggunakan smart TV untuk screen mirror',
      'token-demo-02',
      now,
      now
    );

    // Booking 3: R3 (Engineering Standup)
    insertBooking.run(
      'b-demo-03',
      `MRB-${today.replace(/-/g, '')}-C303`,
      'room-r3-uuid-0003',
      'Ahmad Fauzi',
      'Engineering & Maintenance',
      'Daily Production & Maintenance Sync',
      today,
      '10:30',
      '11:30',
      6,
      'Evaluasi shift pagi',
      'token-demo-03',
      now,
      now
    );
  }
}

// ----------------------------------------------------------------------------
// Helpers: Time & String Formatting
// ----------------------------------------------------------------------------
export function normalizeTime(t: string): string {
  if (!t) return '00:00';
  const parts = t.trim().split(':');
  const hh = parts[0].padStart(2, '0');
  const mm = (parts[1] || '00').padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Checks overlap between two time spans:
 * requested_start < existing_end AND requested_end > existing_start
 * Back-to-back (start == end) returns false (no conflict).
 */
export function isOverlapping(
  startA: string, 
  endA: string, 
  startB: string, 
  endB: string
): boolean {
  const normStartA = normalizeTime(startA);
  const normEndA = normalizeTime(endA);
  const normStartB = normalizeTime(startB);
  const normEndB = normalizeTime(endB);

  return normStartA < normEndB && normEndA > normStartB;
}

export function generateBookingReference(date: string): string {
  const cleanDate = date.replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MRB-${cleanDate}-${rand}`;
}

export function generateCancellationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ----------------------------------------------------------------------------
// Core DB Operations
// ----------------------------------------------------------------------------

export async function getMeetingRooms(includeInactive = false): Promise<MeetingRoom[]> {
  if (useSupabase && supabaseClient) {
    let query = supabaseClient.from('meeting_rooms').select('*').order('room_code', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({
      ...r,
      facilities: Array.isArray(r.facilities) ? r.facilities : (typeof r.facilities === 'string' ? JSON.parse(r.facilities) : []),
    }));
  }

  const db = getSqliteDb();
  const sql = includeInactive 
    ? 'SELECT * FROM meeting_rooms ORDER BY room_code ASC' 
    : 'SELECT * FROM meeting_rooms WHERE is_active = 1 ORDER BY room_code ASC';
  
  const rows = db.prepare(sql).all() as any[];
  return rows.map((r) => ({
    id: r.id,
    room_code: r.room_code as RoomCode,
    room_name: r.room_name,
    capacity: r.capacity,
    description: r.description,
    facilities: r.facilities ? JSON.parse(r.facilities) : [],
    is_active: Boolean(r.is_active),
    created_at: r.created_at,
  }));
}

export async function getMeetingRoomById(id: string): Promise<MeetingRoom | null> {
  const rooms = await getMeetingRooms(true);
  return rooms.find((r) => r.id === id) || null;
}

export async function getMeetingRoomByCode(code: string): Promise<MeetingRoom | null> {
  const rooms = await getMeetingRooms(true);
  return rooms.find((r) => r.room_code.toLowerCase() === code.toLowerCase()) || null;
}

export async function updateMeetingRoom(id: string, updates: Partial<MeetingRoom>): Promise<MeetingRoom> {
  if (useSupabase && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('meeting_rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const db = getSqliteDb();
  const room = await getMeetingRoomById(id);
  if (!room) throw new Error('Ruangan tidak ditemukan');

  const newName = updates.room_name !== undefined ? updates.room_name : room.room_name;
  const newCap = updates.capacity !== undefined ? updates.capacity : room.capacity;
  const newDesc = updates.description !== undefined ? updates.description : room.description;
  const newActive = updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : (room.is_active ? 1 : 0);
  const newFac = updates.facilities !== undefined ? JSON.stringify(updates.facilities) : JSON.stringify(room.facilities);

  db.prepare(`
    UPDATE meeting_rooms 
    SET room_name = ?, capacity = ?, description = ?, facilities = ?, is_active = ?
    WHERE id = ?
  `).run(newName, newCap, newDesc, newFac, newActive, id);

  return (await getMeetingRoomById(id))!;
}

export async function getBookings(filter: BookingFilter = {}): Promise<Booking[]> {
  const rooms = await getMeetingRooms(true);
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  if (useSupabase && supabaseClient) {
    let query = supabaseClient.from('bookings').select('*').order('meeting_date', { ascending: false }).order('start_time', { ascending: true });
    
    if (filter.date) query = query.eq('meeting_date', filter.date);
    if (filter.startDate) query = query.gte('meeting_date', filter.startDate);
    if (filter.endDate) query = query.lte('meeting_date', filter.endDate);
    if (filter.roomId) query = query.eq('room_id', filter.roomId);
    if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status);
    if (filter.department) query = query.ilike('department', `%${filter.department}%`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let results: Booking[] = (data || []).map((b) => {
      const room = roomMap.get(b.room_id);
      return {
        ...b,
        start_time: normalizeTime(b.start_time),
        end_time: normalizeTime(b.end_time),
        room_code: room?.room_code,
        room_name: room?.room_name,
      };
    });

    if (filter.roomCode) {
      results = results.filter((b) => b.room_code === filter.roomCode);
    }
    if (filter.search) {
      const s = filter.search.toLowerCase();
      results = results.filter(
        (b) =>
          b.employee_name.toLowerCase().includes(s) ||
          b.meeting_title.toLowerCase().includes(s) ||
          b.booking_reference.toLowerCase().includes(s)
      );
    }

    return results;
  }

  const db = getSqliteDb();
  let sql = 'SELECT * FROM bookings WHERE 1=1';
  const params: any[] = [];

  if (filter.date) {
    sql += ' AND meeting_date = ?';
    params.push(filter.date);
  }
  if (filter.startDate) {
    sql += ' AND meeting_date >= ?';
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    sql += ' AND meeting_date <= ?';
    params.push(filter.endDate);
  }
  if (filter.roomId) {
    sql += ' AND room_id = ?';
    params.push(filter.roomId);
  }
  if (filter.status && filter.status !== 'all') {
    sql += ' AND status = ?';
    params.push(filter.status);
  }
  if (filter.department) {
    sql += ' AND department LIKE ?';
    params.push(`%${filter.department}%`);
  }

  sql += ' ORDER BY meeting_date DESC, start_time ASC';

  const rows = db.prepare(sql).all(...params) as any[];

  let results: Booking[] = rows.map((r) => {
    const room = roomMap.get(r.room_id);
    return {
      id: r.id,
      booking_reference: r.booking_reference,
      room_id: r.room_id,
      room_code: room?.room_code,
      room_name: room?.room_name,
      employee_name: r.employee_name,
      department: r.department,
      meeting_title: r.meeting_title,
      meeting_date: r.meeting_date,
      start_time: normalizeTime(r.start_time),
      end_time: normalizeTime(r.end_time),
      participant_count: r.participant_count,
      notes: r.notes,
      status: r.status,
      cancellation_token: r.cancellation_token,
      created_at: r.created_at,
      updated_at: r.updated_at,
      cancelled_at: r.cancelled_at,
    };
  });

  if (filter.roomCode) {
    results = results.filter((b) => b.room_code === filter.roomCode);
  }
  if (filter.search) {
    const s = filter.search.toLowerCase();
    results = results.filter(
      (b) =>
        b.employee_name.toLowerCase().includes(s) ||
        b.meeting_title.toLowerCase().includes(s) ||
        b.booking_reference.toLowerCase().includes(s)
    );
  }

  return results;
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const bookings = await getBookings();
  return bookings.find((b) => b.id === id) || null;
}

export async function getBookingByReference(reference: string): Promise<Booking | null> {
  const bookings = await getBookings();
  return bookings.find((b) => b.booking_reference.toUpperCase() === reference.toUpperCase()) || null;
}

/**
 * Find conflicting active bookings for the specified room and time slot.
 * Overlap formula: requested_start < existing_end AND requested_end > existing_start
 */
export async function findConflictingBookings(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<Booking[]> {
  const normStart = normalizeTime(startTime);
  const normEnd = normalizeTime(endTime);

  const existingBookings = await getBookings({
    date,
    roomId,
    status: 'Confirmed',
  });

  return existingBookings.filter((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    return isOverlapping(normStart, normEnd, b.start_time, b.end_time);
  });
}

/**
 * Suggest alternatives when a room is conflicted:
 * 1. Other rooms that are free at that exact time
 * 2. Next free slot in the requested room
 */
export async function findAlternatives(
  requestedRoomId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<AlternativeSlot[]> {
  const allRooms = await getMeetingRooms(false);
  const alternatives: AlternativeSlot[] = [];

  // Check which other rooms are free for this slot
  for (const room of allRooms) {
    if (room.id === requestedRoomId) continue;
    const conflicts = await findConflictingBookings(room.id, date, startTime, endTime);
    if (conflicts.length === 0) {
      alternatives.push({
        room_code: room.room_code,
        room_name: room.room_name,
        available_start: startTime,
        available_end: endTime,
      });
    }
  }

  return alternatives;
}

export interface CreateBookingInput {
  room_id: string;
  employee_name: string;
  department: string;
  meeting_title: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  participant_count?: number;
  notes?: string;
  performed_by?: string;
}

export interface BookingResult {
  success: boolean;
  booking?: Booking;
  error?: string;
  conflicts?: Booking[];
  alternatives?: AlternativeSlot[];
}

/**
 * ATOMIC BOOKING CREATION WITH CONFLICT PREVENTION
 * Prevents overlapping bookings for the same room on the same date.
 */
export async function createBookingAtomic(input: CreateBookingInput): Promise<BookingResult> {
  const startTime = normalizeTime(input.start_time);
  const endTime = normalizeTime(input.end_time);

  // Validation 1: End time must be later than start time
  if (endTime <= startTime) {
    return {
      success: false,
      error: 'Jam selesai harus lebih akhir dari jam mulai (contoh: 09:00 - 10:30).',
    };
  }

  // Validation 2: Operating hours (07:00 - 21:00)
  if (startTime < '07:00' || endTime > '21:00') {
    return {
      success: false,
      error: 'Jam operasional peminjaman ruangan adalah antara 07:00 sampai 21:00 WIB.',
    };
  }

  // Validation 3: Date cannot be in the past
  const todayStr = new Date().toISOString().split('T')[0];
  if (input.meeting_date < todayStr) {
    return {
      success: false,
      error: 'Tidak dapat melakukan pemesanan ruangan untuk tanggal yang sudah lewat.',
    };
  }

  // Execute database transaction
  const db = getSqliteDb();
  try {
    db.exec('BEGIN IMMEDIATE;'); // Exclusive write lock to prevent race conditions

    // Check conflict inside transaction
    const conflictQuery = db.prepare(`
      SELECT b.*, r.room_code, r.room_name 
      FROM bookings b
      JOIN meeting_rooms r ON b.room_id = r.id
      WHERE b.room_id = ? 
        AND b.meeting_date = ? 
        AND b.status = 'Confirmed'
        AND ? < b.end_time 
        AND ? > b.start_time
    `);

    const conflicts = conflictQuery.all(input.room_id, input.meeting_date, startTime, endTime) as any[];

    if (conflicts.length > 0) {
      db.exec('ROLLBACK;');
      const alternatives = await findAlternatives(input.room_id, input.meeting_date, startTime, endTime);
      return {
        success: false,
        error: `Jadwal bentrok! Ruangan sudah terisi untuk jadwal ${conflicts[0].start_time} - ${conflicts[0].end_time} ("${conflicts[0].meeting_title}").`,
        conflicts: conflicts.map((c) => ({
          ...c,
          start_time: normalizeTime(c.start_time),
          end_time: normalizeTime(c.end_time),
        })),
        alternatives,
      };
    }

    // Insert new booking
    const bookingId = `bk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const bookingRef = generateBookingReference(input.meeting_date);
    const cancelToken = generateCancellationToken();
    const nowIso = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO bookings (
        id, booking_reference, room_id, employee_name, department,
        meeting_title, meeting_date, start_time, end_time, participant_count,
        notes, status, cancellation_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?, ?)
    `);

    insertStmt.run(
      bookingId,
      bookingRef,
      input.room_id,
      input.employee_name.trim(),
      input.department.trim(),
      input.meeting_title.trim(),
      input.meeting_date,
      startTime,
      endTime,
      input.participant_count || 1,
      input.notes?.trim() || null,
      cancelToken,
      nowIso,
      nowIso
    );

    // Insert audit log
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const performer = input.performed_by || `${input.employee_name.trim()} (${input.department.trim()})`;
    const insertAudit = db.prepare(`
      INSERT INTO booking_audit_logs (
        id, booking_id, action, performed_by, previous_values, new_values, created_at
      ) VALUES (?, ?, 'CREATED', ?, NULL, ?, ?)
    `);

    insertAudit.run(
      auditId,
      bookingId,
      performer,
      JSON.stringify({
        booking_reference: bookingRef,
        room_id: input.room_id,
        date: input.meeting_date,
        start_time: startTime,
        end_time: endTime,
        meeting_title: input.meeting_title,
      }),
      nowIso
    );

    db.exec('COMMIT;');

    const createdBooking = await getBookingById(bookingId);
    return {
      success: true,
      booking: createdBooking || undefined,
    };
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return {
      success: false,
      error: `Gagal memproses booking: ${err.message}`,
    };
  }
}

export async function updateBookingAdmin(
  id: string,
  updates: Partial<Booking>,
  adminEmail: string
): Promise<BookingResult> {
  const existing = await getBookingById(id);
  if (!existing) {
    return { success: false, error: 'Booking tidak ditemukan' };
  }

  const roomId = updates.room_id || existing.room_id;
  const date = updates.meeting_date || existing.meeting_date;
  const startTime = normalizeTime(updates.start_time || existing.start_time);
  const endTime = normalizeTime(updates.end_time || existing.end_time);

  if (endTime <= startTime) {
    return { success: false, error: 'Jam selesai harus lebih akhir dari jam mulai.' };
  }

  const db = getSqliteDb();
  try {
    db.exec('BEGIN IMMEDIATE;');

    // Check conflict excluding current booking
    const conflictQuery = db.prepare(`
      SELECT b.*, r.room_code, r.room_name 
      FROM bookings b
      JOIN meeting_rooms r ON b.room_id = r.id
      WHERE b.room_id = ? 
        AND b.meeting_date = ? 
        AND b.status = 'Confirmed'
        AND b.id != ?
        AND ? < b.end_time 
        AND ? > b.start_time
    `);

    const conflicts = conflictQuery.all(roomId, date, id, startTime, endTime) as any[];
    if (conflicts.length > 0) {
      db.exec('ROLLBACK;');
      return {
        success: false,
        error: `Jadwal bentrok dengan booking lain: ${conflicts[0].start_time} - ${conflicts[0].end_time} ("${conflicts[0].meeting_title}").`,
        conflicts,
      };
    }

    const nowIso = new Date().toISOString();
    const updateStmt = db.prepare(`
      UPDATE bookings 
      SET room_id = ?, employee_name = ?, department = ?, meeting_title = ?, 
          meeting_date = ?, start_time = ?, end_time = ?, participant_count = ?, 
          notes = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(
      roomId,
      updates.employee_name || existing.employee_name,
      updates.department || existing.department,
      updates.meeting_title || existing.meeting_title,
      date,
      startTime,
      endTime,
      (updates.participant_count !== undefined ? updates.participant_count : existing.participant_count) ?? 1,
      (updates.notes !== undefined ? updates.notes : existing.notes) ?? null,
      updates.status || existing.status,
      nowIso,
      id
    );

    // Audit log
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO booking_audit_logs (
        id, booking_id, action, performed_by, previous_values, new_values, created_at
      ) VALUES (?, ?, 'UPDATED', ?, ?, ?, ?)
    `).run(
      auditId,
      id,
      adminEmail,
      JSON.stringify(existing),
      JSON.stringify({ ...existing, ...updates, updated_at: nowIso }),
      nowIso
    );

    db.exec('COMMIT;');
    const updated = await getBookingById(id);
    return { success: true, booking: updated || undefined };
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return { success: false, error: err.message };
  }
}

export async function cancelBooking(
  id: string,
  performedBy: string,
  cancellationToken?: string
): Promise<{ success: boolean; error?: string }> {
  const existing = await getBookingById(id);
  if (!existing) {
    return { success: false, error: 'Booking tidak ditemukan' };
  }

  // Security check: If cancellationToken is passed, it must match unless performed by Admin
  if (cancellationToken && cancellationToken !== existing.cancellation_token) {
    return { success: false, error: 'Token pembatalan tidak valid' };
  }

  const db = getSqliteDb();
  const nowIso = new Date().toISOString();

  db.prepare(`
    UPDATE bookings 
    SET status = 'Cancelled', cancelled_at = ?, updated_at = ?
    WHERE id = ?
  `).run(nowIso, nowIso, id);

  // Record audit log
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO booking_audit_logs (
      id, booking_id, action, performed_by, previous_values, new_values, created_at
    ) VALUES (?, ?, 'CANCELLED', ?, ?, ?, ?)
  `).run(
    auditId,
    id,
    performedBy,
    JSON.stringify({ status: existing.status }),
    JSON.stringify({ status: 'Cancelled', cancelled_at: nowIso }),
    nowIso
  );

  return { success: true };
}

export async function getAuditLogs(bookingId?: string): Promise<BookingAuditLog[]> {
  const db = getSqliteDb();
  let sql = 'SELECT * FROM booking_audit_logs';
  const params: any[] = [];
  if (bookingId) {
    sql += ' WHERE booking_id = ?';
    params.push(bookingId);
  }
  sql += ' ORDER BY created_at DESC LIMIT 100';

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    booking_id: r.booking_id,
    action: r.action,
    performed_by: r.performed_by,
    previous_values: r.previous_values ? JSON.parse(r.previous_values) : null,
    new_values: r.new_values ? JSON.parse(r.new_values) : null,
    created_at: r.created_at,
  }));
}

/**
 * Computes live room status for 4 cards (Available, Occupied, Upcoming)
 * based on selected date and current time.
 */
export async function getRoomsWithOperationalStatus(
  targetDate: string,
  currentTimeStr?: string
): Promise<RoomWithStatus[]> {
  const rooms = await getMeetingRooms(false);
  const now = new Date();
  
  // Format current time HH:mm
  const timeNow = currentTimeStr || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const bookingsForDate = await getBookings({
    date: targetDate,
    status: 'Confirmed',
  });

  return rooms.map((room) => {
    const roomBookings = bookingsForDate
      .filter((b) => b.room_id === room.id)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Check if currently occupied: start_time <= timeNow < end_time
    const currentBooking = roomBookings.find(
      (b) => b.start_time <= timeNow && timeNow < b.end_time
    ) || null;

    // Check upcoming: next meeting starting after timeNow
    const upcomingBooking = roomBookings.find(
      (b) => b.start_time > timeNow
    ) || null;

    let status: RoomOperationalStatus = 'available';
    let nextAvailable = 'Tersedia Sekarang';

    if (currentBooking) {
      status = 'occupied';
      nextAvailable = `Tersedia pukul ${currentBooking.end_time}`;
    } else if (upcomingBooking) {
      // If starts within 60 minutes, mark as upcoming (orange)
      const [curH, curM] = timeNow.split(':').map(Number);
      const [upH, upM] = upcomingBooking.start_time.split(':').map(Number);
      const diffMins = (upH * 60 + upM) - (curH * 60 + curM);

      if (diffMins > 0 && diffMins <= 90) {
        status = 'upcoming';
      } else {
        status = 'available';
      }
      nextAvailable = `Tersedia sampai ${upcomingBooking.start_time}`;
    }

    return {
      ...room,
      currentStatus: status,
      currentBooking,
      upcomingBooking,
      nextAvailableTime: nextAvailable,
      bookingsToday: roomBookings,
    };
  });
}

/**
 * Computes Admin Dashboard Statistics
 */
export async function getDashboardStats(dateStr?: string): Promise<DashboardStats> {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const roomsWithStatus = await getRoomsWithOperationalStatus(targetDate);
  const bookingsToday = await getBookings({ date: targetDate, status: 'Confirmed' });
  const allConfirmed = await getBookings({ status: 'Confirmed' });

  const totalBookingsToday = bookingsToday.length;
  const availableRoomsCount = roomsWithStatus.filter((r) => r.currentStatus === 'available').length;
  const occupiedRoomsCount = roomsWithStatus.filter((r) => r.currentStatus === 'occupied').length;
  const upcomingMeetingsCount = roomsWithStatus.filter((r) => r.upcomingBooking !== null).length;

  // Calculate total meeting hours today
  let totalHours = 0;
  for (const b of bookingsToday) {
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    const durationMins = (eh * 60 + em) - (sh * 60 + sm);
    if (durationMins > 0) {
      totalHours += durationMins / 60;
    }
  }

  // Calculate most frequently used room
  const roomUsageCount: Record<string, { count: number; hours: number; code: string; name: string }> = {};
  for (const b of allConfirmed) {
    if (!roomUsageCount[b.room_id]) {
      roomUsageCount[b.room_id] = {
        count: 0,
        hours: 0,
        code: b.room_code || 'R1',
        name: b.room_name || 'Ruang Meeting',
      };
    }
    roomUsageCount[b.room_id].count += 1;
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    const duration = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    roomUsageCount[b.room_id].hours += Math.max(0, duration);
  }

  let mostUsedRoom: DashboardStats['mostUsedRoom'] = null;
  let maxCount = -1;
  for (const [_, data] of Object.entries(roomUsageCount)) {
    if (data.count > maxCount) {
      maxCount = data.count;
      mostUsedRoom = {
        room_code: data.code,
        room_name: data.name,
        totalHours: Math.round(data.hours * 10) / 10,
        bookingCount: data.count,
      };
    }
  }

  return {
    totalBookingsToday,
    availableRoomsCount,
    occupiedRoomsCount,
    upcomingMeetingsCount,
    totalMeetingHoursToday: Math.round(totalHours * 10) / 10,
    mostUsedRoom,
  };
}

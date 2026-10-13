import { NextRequest, NextResponse } from 'next/server';
import { getBookings, createBookingAtomic, getMeetingRoomByCode, getMeetingRooms } from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const roomCode = searchParams.get('roomCode') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const search = searchParams.get('search') || undefined;
    const department = searchParams.get('department') || undefined;

    const bookings = await getBookings({
      date,
      startDate,
      endDate,
      roomId,
      roomCode,
      status,
      search,
      department,
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data booking' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      room_id,
      room_code,
      employee_name,
      department,
      meeting_title,
      meeting_date,
      start_time,
      end_time,
      participant_count,
      notes,
    } = body;

    // Validate required fields
    if (!employee_name?.trim()) {
      return NextResponse.json({ success: false, error: 'Nama karyawan wajib diisi' }, { status: 400 });
    }
    if (!department?.trim()) {
      return NextResponse.json({ success: false, error: 'Departemen wajib diisi' }, { status: 400 });
    }
    if (!meeting_title?.trim()) {
      return NextResponse.json({ success: false, error: 'Judul / keperluan rapat wajib diisi' }, { status: 400 });
    }
    if (!meeting_date?.trim()) {
      return NextResponse.json({ success: false, error: 'Tanggal meeting wajib diisi' }, { status: 400 });
    }
    if (!start_time?.trim() || !end_time?.trim()) {
      return NextResponse.json({ success: false, error: 'Jam mulai dan jam selesai wajib diisi' }, { status: 400 });
    }

    // Resolve room_id if room_code is supplied
    let targetRoomId = room_id;
    if (!targetRoomId && room_code) {
      const room = await getMeetingRoomByCode(room_code);
      if (!room) {
        return NextResponse.json({ success: false, error: `Ruang ${room_code} tidak ditemukan` }, { status: 404 });
      }
      targetRoomId = room.id;
    }

    if (!targetRoomId) {
      return NextResponse.json({ success: false, error: 'Ruangan meeting belum dipilih' }, { status: 400 });
    }

    // Check if performed by admin
    const adminSession = getAdminSessionFromRequest(req);
    const performedBy = adminSession ? `Admin (${adminSession.email})` : undefined;

    // Call atomic booking creation
    const result = await createBookingAtomic({
      room_id: targetRoomId,
      employee_name: employee_name.trim(),
      department: department.trim(),
      meeting_title: meeting_title.trim(),
      meeting_date,
      start_time,
      end_time,
      participant_count: Number(participant_count) || 1,
      notes: notes?.trim(),
      performed_by: performedBy,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          conflicts: result.conflicts,
          alternatives: result.alternatives,
        },
        { status: 409 } // 409 Conflict
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Booking berhasil dikonfirmasi secara otomatis!',
        data: result.booking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan sistem saat memproses booking' },
      { status: 500 }
    );
  }
}

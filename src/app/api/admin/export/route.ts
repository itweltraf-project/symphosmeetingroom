import { NextRequest, NextResponse } from 'next/server';
import { getBookings } from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Akses ditolak. Administrator login diperlukan.' }, { status: 401 });
  }

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

    // CSV Headers as requested in Requirement 9:
    // Date | Room | Employee | Department | Meeting Title | Start Time | End Time | Status
    const headers = [
      'Booking Reference',
      'Date',
      'Room Code',
      'Room Name',
      'Employee',
      'Department',
      'Meeting Title',
      'Start Time',
      'End Time',
      'Participants',
      'Status',
      'Notes',
      'Created At'
    ];

    const rows = bookings.map((b) => [
      escapeCsvCell(b.booking_reference),
      escapeCsvCell(b.meeting_date),
      escapeCsvCell(b.room_code || ''),
      escapeCsvCell(b.room_name || ''),
      escapeCsvCell(b.employee_name),
      escapeCsvCell(b.department),
      escapeCsvCell(b.meeting_title),
      escapeCsvCell(b.start_time),
      escapeCsvCell(b.end_time),
      escapeCsvCell(b.participant_count),
      escapeCsvCell(b.status),
      escapeCsvCell(b.notes || ''),
      escapeCsvCell(b.created_at),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const today = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="meeting-room-bookings-${today}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengekspor CSV' },
      { status: 500 }
    );
  }
}

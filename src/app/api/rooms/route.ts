import { NextRequest, NextResponse } from 'next/server';
import { getRoomsWithOperationalStatus, getMeetingRooms } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
    const date = searchParams.get('date') || jakartaDate;
    const time = searchParams.get('time') || undefined;

    const roomsWithStatus = await getRoomsWithOperationalStatus(date, time);
    return NextResponse.json({ success: true, data: roomsWithStatus });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat daftar ruangan' },
      { status: 500 }
    );
  }
}

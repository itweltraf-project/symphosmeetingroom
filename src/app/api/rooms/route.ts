import { NextRequest, NextResponse } from 'next/server';
import { getRoomsWithOperationalStatus, getMeetingRooms } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
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

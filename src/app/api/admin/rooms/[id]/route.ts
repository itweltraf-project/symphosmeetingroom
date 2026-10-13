import { NextRequest, NextResponse } from 'next/server';
import { updateMeetingRoom } from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Akses ditolak. Administrator login diperlukan.' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const updatedRoom = await updateMeetingRoom(id, body);
    return NextResponse.json({
      success: true,
      message: 'Konfigurasi ruangan berhasil diperbarui',
      data: updatedRoom,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengubah konfigurasi ruangan' },
      { status: 500 }
    );
  }
}

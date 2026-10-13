import { NextRequest, NextResponse } from 'next/server';
import { updateBookingAdmin, cancelBooking } from '@/lib/db';
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

    const result = await updateBookingAdmin(id, body, session.email);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, conflicts: result.conflicts },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data booking berhasil diperbarui',
      data: result.booking,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengubah data booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Akses ditolak. Administrator login diperlukan.' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const result = await cancelBooking(id, `Admin (${session.email})`);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking berhasil dibatalkan dan slot ruangan dilepas',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membatalkan booking' },
      { status: 500 }
    );
  }
}

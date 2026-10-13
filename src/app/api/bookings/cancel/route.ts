import { NextRequest, NextResponse } from 'next/server';
import { getBookingByReference, getBookingById, cancelBooking } from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { booking_reference, cancellation_token, booking_id } = body;

    const adminSession = getAdminSessionFromRequest(req);

    let booking = null;
    if (booking_id) {
      booking = await getBookingById(booking_id);
    } else if (booking_reference) {
      booking = await getBookingByReference(booking_reference);
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Pemesanan ruangan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (booking.status === 'Cancelled') {
      return NextResponse.json(
        { success: false, error: 'Pemesanan ini sudah dibatalkan sebelumnya' },
        { status: 400 }
      );
    }

    // Authorization check
    let performer = '';
    if (adminSession) {
      performer = `Admin (${adminSession.email})`;
    } else {
      // Must have valid cancellation token or match reference
      if (!cancellation_token || cancellation_token !== booking.cancellation_token) {
        return NextResponse.json(
          { success: false, error: 'Token pembatalan atau nomor referensi tidak sesuai' },
          { status: 403 }
        );
      }
      performer = `${booking.employee_name} (${booking.department})`;
    }

    const cancelRes = await cancelBooking(booking.id, performer, adminSession ? undefined : cancellation_token);
    if (!cancelRes.success) {
      return NextResponse.json({ success: false, error: cancelRes.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Pemesanan ${booking.booking_reference} berhasil dibatalkan. Slot ruangan kini tersedia kembali.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membatalkan pemesanan' },
      { status: 500 }
    );
  }
}

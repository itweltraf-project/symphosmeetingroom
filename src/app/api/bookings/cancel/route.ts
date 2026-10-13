import { NextRequest, NextResponse } from 'next/server';
import { getBookingByReference, getBookingById, cancelBooking, cancelBookingsByEmployeeName } from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employee_name, agree_cancel, booking_reference, cancellation_token, booking_id } = body;

    const adminSession = getAdminSessionFromRequest(req);

    // 1. User cancellation by employee full name & agreement (No code needed!)
    if (employee_name && typeof employee_name === 'string' && employee_name.trim().length > 0) {
      if (!agree_cancel) {
        return NextResponse.json(
          { success: false, error: 'Silakan centang tanda persetujuan pembatalan terlebih dahulu.' },
          { status: 400 }
        );
      }

      const cancelResult = await cancelBookingsByEmployeeName(employee_name);
      if (!cancelResult.success) {
        return NextResponse.json(
          { success: false, error: cancelResult.error },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Booking atas nama "${employee_name.trim()}" (${cancelResult.cancelledCount} jadwal) berhasil dibatalkan. Ruangan kini kembali tersedia.`,
        data: cancelResult.bookings,
      });
    }

    // 2. Cancellation by booking_id or booking_reference (Admin dashboard or reference)
    let booking = null;
    if (booking_id) {
      booking = await getBookingById(booking_id);
    } else if (booking_reference) {
      booking = await getBookingByReference(booking_reference);
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Silakan masukkan nama lengkap Anda untuk membatalkan booking.' },
        { status: 400 }
      );
    }

    if (booking.status === 'Cancelled') {
      return NextResponse.json(
        { success: false, error: 'Booking ini sudah dibatalkan sebelumnya.' },
        { status: 400 }
      );
    }

    const performer = adminSession ? `Admin (${adminSession.email})` : `${booking.employee_name} (${booking.department})`;
    const cancelRes = await cancelBooking(booking.id, performer);
    if (!cancelRes.success) {
      return NextResponse.json({ success: false, error: cancelRes.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${booking.booking_reference} berhasil dibatalkan. Slot ruangan kini tersedia kembali.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membatalkan booking' },
      { status: 500 }
    );
  }
}

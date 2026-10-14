import { NextRequest, NextResponse } from 'next/server';
import { setAdminCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Username/email dan password wajib diisi' },
        { status: 400 }
      );
    }

    const cleanInput = email.trim();
    const cleanLower = cleanInput.toLowerCase();
    
    // Valid admin credentials: username HRGA
    const isUserMatch = cleanLower === 'hrga' || cleanLower === 'hrga@company.com';
    const isPasswordMatch = password === 'Itweltraf1011#';

    if (!isUserMatch || !isPasswordMatch) {
      return NextResponse.json(
        { success: false, error: 'Username atau kata sandi administrator salah' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: 'Login berhasil sebagai Administrator HRGA',
      user: {
        email: 'HRGA',
        role: 'admin',
      },
    });

    setAdminCookie(res, 'HRGA');
    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan login' },
      { status: 500 }
    );
  }
}

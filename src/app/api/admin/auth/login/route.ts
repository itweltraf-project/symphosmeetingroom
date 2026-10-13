import { NextRequest, NextResponse } from 'next/server';
import { setAdminCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Check default pre-configured credentials
    // admin@company.com / Admin#2026!
    const isValidAdmin = 
      (cleanEmail === 'admin@company.com' || cleanEmail === 'admin@office.com') && 
      password === 'Admin#2026!';

    if (!isValidAdmin) {
      return NextResponse.json(
        { success: false, error: 'Email atau password administrator salah' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: 'Login berhasil sebagai Administrator',
      user: {
        email: cleanEmail,
        role: 'admin',
      },
    });

    setAdminCookie(res, cleanEmail);
    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan login' },
      { status: 500 }
    );
  }
}

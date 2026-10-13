import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'secret-meeting-room-admin-key-2026';
const COOKIE_NAME = 'mrb_admin_session';

export interface AdminPayload {
  email: string;
  role: string;
  exp: number;
}

export function signToken(payload: Omit<AdminPayload, 'exp'>, expiresInSeconds = 86400): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const data: AdminPayload = { ...payload, exp };
  const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(encodedData)
    .digest('base64url');
  return `${encodedData}.${signature}`;
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    const [encodedData, signature] = token.split('.');
    if (!encodedData || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', ADMIN_SECRET)
      .update(encodedData)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const payload: AdminPayload = JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf-8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(req: NextRequest): AdminPayload | null {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyToken(cookie.value);
}

export function setAdminCookie(res: NextResponse, email: string): void {
  const token = signToken({ email, role: 'admin' });
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400, // 24 hours
  });
}

export function clearAdminCookie(res: NextResponse): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

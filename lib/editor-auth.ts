import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const cookieName = 'tdl_editor_session';
const sessionSeconds = 8 * 60 * 60;
const attemptWindow = 10 * 60 * 1000;
let attempts = 0;
let retryAt = 0;

function password() {
  const value = process.env.TDL_ADMIN_PASSWORD;
  return value && value.length >= 12 ? value : undefined;
}

function digest(text: string) {
  return createHash('sha256').update(text).digest();
}

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update(`tdl-editor-session:${value}`).digest('hex');
}

export function editorConfigured() {
  return Boolean(password());
}

export async function hasEditorSession() {
  const secret = password();
  const token = (await cookies()).get(cookieName)?.value;
  if (!secret || !token) return false;
  const [expires, nonce, mac, extra] = token.split('.');
  if (extra !== undefined || !/^\d{13}$/.test(expires) || !/^[a-f0-9]{32}$/.test(nonce ?? '') || !/^[a-f0-9]{64}$/.test(mac ?? '')) return false;
  if (Number(expires) <= Date.now()) return false;
  return timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(signature(`${expires}.${nonce}`, secret), 'hex'));
}

export async function signInEditor(value: string) {
  const secret = password();
  if (!secret) return 'Set TDL_ADMIN_PASSWORD to at least 12 characters to enable sign in.';
  const now = Date.now();
  if (now >= retryAt) {
    attempts = 0;
    retryAt = now + attemptWindow;
  }
  if (attempts >= 10) return 'Too many attempts. Try again in a few minutes.';
  if (value.length > 1024 || !timingSafeEqual(digest(value), digest(secret))) {
    attempts++;
    return 'Incorrect password.';
  }
  attempts = 0;
  const session = `${now + sessionSeconds * 1000}.${randomBytes(16).toString('hex')}`;
  (await cookies()).set(cookieName, `${session}.${signature(session, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: sessionSeconds,
    path: '/',
  });
  return '';
}

export async function signOutEditor() {
  (await cookies()).set(cookieName, '', { path: '/', maxAge: 0 });
}
